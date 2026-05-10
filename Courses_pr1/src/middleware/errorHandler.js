const { getLogById } = require('./logger');

const errorHandler = (err, req, res, next) => {
  console.log(`[${req.requestId}] Ошибка: ${err.message}`);

  const statusCode = err.statusCode || 500;

  const errorResponse = {
    error: {
      code: err.code || 'InternalServerError',
      message: err.message || 'Внутренняя ошибка сервера',
      requestId: req.requestId
    }
  };

  res.status(statusCode).json(errorResponse);
};

const notFoundHandler = (req, res, next) => {
  const error = new Error(`Маршрут ${req.method} ${req.url} не найден`);
  error.statusCode = 404;
  error.code = 'NotFoundError';
  next(error);
};

module.exports = {
  errorHandler,
  notFoundHandler
};
