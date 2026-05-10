const express = require('express');
const processRoutes = require('./src/routes/process');
const adminRoutes = require('./src/routes/admin');
const { setupHealthRoutes } = require('./src/health');
const { metrics } = require('./src/metrics');
const { ProcessStorage } = require('./src/storage');

const app = express();
app.use(express.json());

app.use('/process-event', processRoutes);
app.use('/admin', adminRoutes);
setupHealthRoutes(app);

app.get('/metrics', (req, res) => {
  const storage = new ProcessStorage();
  res.json(metrics.snapshot(storage.size()));
});

app.get('/', (req, res) => {
  res.json({
    service: 'BookingService',
    description: 'Веб-служба бронирования переговорных',
    endpoints: [
      'POST /process-event',
      'GET  /process-event/:processId',
      'GET  /metrics',
      'GET  /health/live',
      'GET  /health/ready',
      'POST /admin/degrade',
      'POST /admin/recover',
      'POST /admin/fail/issue/on',
      'POST /admin/fail/issue/off',
      'GET  /admin/state',
      'GET  /admin/compensation-log',
      'GET  /admin/processes'
    ]
  });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`BookingService запущен на порту ${PORT}`);
  });
}

module.exports = app;
