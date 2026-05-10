const { log } = require('./logger');
const { metrics } = require('./metrics');

const compensationLog = [];

async function compensateBooking(processId, correlationId, context) {
  log(correlationId, 'compensation.start', { processId, bookingId: context.bookingId });
  await new Promise(resolve => setTimeout(resolve, 50));
  metrics.compensation();
  const entry = {
    processId,
    correlationId,
    bookingId: context.bookingId || null,
    timestamp: new Date().toISOString(),
    reason: 'Сбой на шаге ВыдатьДоступ — отмена брони'
  };
  compensationLog.push(entry);
  log(correlationId, 'compensation.done', { processId, bookingId: context.bookingId });
  return entry;
}

function getCompensationLog() {
  return compensationLog;
}

module.exports = { compensateBooking, getCompensationLog };
