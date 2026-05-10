const { metrics } = require('./metrics');
const { log } = require('./logger');

const failFlags = {
  issueAccess: false
};

function setIssueAccessFail(value) {
  failFlags.issueAccess = !!value;
}

function isIssueAccessFail() {
  return failFlags.issueAccess;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function stepAccept(processId, correlationId, ctx) {
  const t0 = Date.now();
  log(correlationId, 'step.start', { processId, step: 'ПринятьЗаявку' });
  await delay(80);
  metrics.latency('ПринятьЗаявку', Date.now() - t0);
  log(correlationId, 'step.done', { processId, step: 'ПринятьЗаявку' });
  return { ...ctx, applicationAccepted: true };
}

async function stepBook(processId, correlationId, ctx) {
  const t0 = Date.now();
  log(correlationId, 'step.start', { processId, step: 'Забронировать' });
  await delay(120);
  metrics.latency('Забронировать', Date.now() - t0);
  const bookingId = `book_${processId}_${Date.now()}`;
  log(correlationId, 'step.done', { processId, step: 'Забронировать', bookingId });
  return { ...ctx, bookingConfirmed: true, bookingId };
}

async function stepIssue(processId, correlationId, ctx) {
  const t0 = Date.now();
  log(correlationId, 'step.start', { processId, step: 'ВыдатьДоступ' });
  await delay(100);
  if (failFlags.issueAccess) {
    log(correlationId, 'step.failed', { processId, step: 'ВыдатьДоступ', reason: 'simulated' });
    throw new Error('Имитация сбоя на шаге ВыдатьДоступ');
  }
  metrics.latency('ВыдатьДоступ', Date.now() - t0);
  const accessCode = `code_${processId}_${Math.random().toString(36).slice(2, 8)}`;
  log(correlationId, 'step.done', { processId, step: 'ВыдатьДоступ', accessCode });
  return { ...ctx, accessIssued: true, accessCode };
}

async function stepComplete(processId, correlationId, ctx) {
  const t0 = Date.now();
  log(correlationId, 'step.start', { processId, step: 'Завершить' });
  await delay(60);
  metrics.latency('Завершить', Date.now() - t0);
  log(correlationId, 'step.done', { processId, step: 'Завершить' });
  return { ...ctx, completed: true, finishedAt: new Date().toISOString() };
}

module.exports = {
  stepAccept,
  stepBook,
  stepIssue,
  stepComplete,
  setIssueAccessFail,
  isIssueAccessFail
};
