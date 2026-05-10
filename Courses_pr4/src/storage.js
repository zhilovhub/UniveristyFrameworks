const { States } = require('./states');

class ProcessStorage {
  constructor() {
    if (ProcessStorage._instance) {
      return ProcessStorage._instance;
    }
    this.processes = new Map();
    ProcessStorage._instance = this;
  }

  get(processId) {
    return this.processes.get(processId);
  }

  create(processId) {
    if (!this.processes.has(processId)) {
      this.processes.set(processId, {
        state: States.NEW,
        context: {},
        idempotencyKeys: new Map(),
        history: []
      });
    }
    return this.processes.get(processId);
  }

  update(processId, data) {
    const existing = this.processes.get(processId);
    if (existing) {
      Object.assign(existing, data);
      this.processes.set(processId, existing);
    }
    return this.processes.get(processId);
  }

  appendHistory(processId, entry) {
    const existing = this.processes.get(processId);
    if (existing) {
      existing.history.push(entry);
    }
  }

  hasIdempotencyKey(processId, idempotencyKey) {
    const proc = this.processes.get(processId);
    return proc ? proc.idempotencyKeys.has(idempotencyKey) : false;
  }

  getIdempotencyResult(processId, idempotencyKey) {
    const proc = this.processes.get(processId);
    return proc ? proc.idempotencyKeys.get(idempotencyKey) : null;
  }

  rememberIdempotencyKey(processId, idempotencyKey, result) {
    const proc = this.processes.get(processId);
    if (proc) {
      proc.idempotencyKeys.set(idempotencyKey, result);
      return true;
    }
    return false;
  }

  list() {
    const out = [];
    for (const [id, value] of this.processes.entries()) {
      out.push({ processId: id, state: value.state, context: value.context });
    }
    return out;
  }

  size() {
    return this.processes.size;
  }
}

module.exports = { ProcessStorage };
