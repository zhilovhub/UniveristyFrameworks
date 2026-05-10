const { v4: uuidv4 } = require('uuid');

const requestLogs = [];

const requestLogger = (req, res, next) => {
  const requestId = uuidv4();
  req.requestId = requestId;

  const startTime = Date.now();

  const logEntry = {
    requestId,
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    body: req.body,
    query: req.query,
    params: req.params
  };

  console.log(`[${requestId}] Входящий запрос: ${req.method} ${req.url}`);

  const originalSend = res.json;
  res.json = function (body) {
    logEntry.response = {
      statusCode: res.statusCode,
      body: body
    };
    logEntry.duration = Date.now() - startTime;

    requestLogs.push(logEntry);

    if (requestLogs.length > 100) {
      requestLogs.shift();
    }

    console.log(`[${requestId}] Ответ: ${res.statusCode} (${logEntry.duration}ms)`);

    originalSend.call(this, body);
  };

  next();
};

const getLogById = (requestId) => {
  return requestLogs.find(log => log.requestId === requestId);
};

module.exports = { requestLogger, getLogById };
