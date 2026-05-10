const express = require('express');
const router = express.Router();
const { ProcessStorage } = require('../storage');
const { applyTransition } = require('../stateMachine');
const { log } = require('../logger');
const { metrics } = require('../metrics');
const { isDegraded } = require('../health');

const storage = new ProcessStorage();

router.post('/', async (req, res) => {
  const { processId, event, idempotencyKey, correlationId, payload } = req.body || {};

  if (!processId || !event || !idempotencyKey || !correlationId) {
    return res.status(400).json({
      error: 'Не заполнены обязательные поля: processId, event, idempotencyKey, correlationId'
    });
  }

  let proc = storage.get(processId);
  if (!proc) {
    proc = storage.create(processId);
    log(correlationId, 'process.created', { processId });
    if (payload && typeof payload === 'object') {
      storage.update(processId, { context: { ...proc.context, ...payload } });
      proc = storage.get(processId);
    }
  }

  if (storage.hasIdempotencyKey(processId, idempotencyKey)) {
    metrics.duplicate();
    const cached = storage.getIdempotencyResult(processId, idempotencyKey);
    log(correlationId, 'event.duplicate', { processId, event, idempotencyKey });
    return res.status(200).json({
      processId,
      currentState: proc.state,
      event,
      idempotencyKey,
      correlationId,
      duplicate: true,
      previousResult: cached
    });
  }

  if (isDegraded()) {
    log(correlationId, 'service.degraded', { processId });
  }

  const previousState = proc.state;
  const previousContext = { ...proc.context };

  const result = await applyTransition(
    processId,
    previousState,
    event,
    correlationId,
    previousContext
  );

  storage.update(processId, {
    state: result.newState,
    context: result.newContext
  });
  storage.appendHistory(processId, {
    correlationId,
    event,
    from: previousState,
    to: result.newState,
    at: new Date().toISOString(),
    error: result.error || null
  });

  const response = {
    processId,
    previousState,
    currentState: result.newState,
    event,
    idempotencyKey,
    correlationId,
    error: result.error || null,
    context: result.newContext
  };

  storage.rememberIdempotencyKey(processId, idempotencyKey, response);

  const status = result.error ? 422 : 200;
  res.status(status).json(response);
});

router.get('/:processId', (req, res) => {
  const proc = storage.get(req.params.processId);
  if (!proc) return res.status(404).json({ error: 'Процесс не найден' });
  res.json({
    processId: req.params.processId,
    state: proc.state,
    context: proc.context,
    history: proc.history
  });
});

module.exports = router;
