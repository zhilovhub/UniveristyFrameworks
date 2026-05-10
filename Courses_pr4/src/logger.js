function log(correlationId, message, extra = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    correlationId,
    message,
    ...extra
  };
  console.log(JSON.stringify(entry));
}

module.exports = { log };
