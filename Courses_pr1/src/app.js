const express = require('express');
const { requestLogger } = require('./middleware/logger');
const requestTimer = require('./middleware/timer');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const itemsRouter = require('./routes/items');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(requestLogger);
app.use(requestTimer);

app.use('/api/items', itemsRouter);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`API доступно по адресу: http://localhost:${PORT}/api`);
  console.log(`Список курсов: http://localhost:${PORT}/api/items`);
});
