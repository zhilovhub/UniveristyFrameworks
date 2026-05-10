let degraded = false;
const startedAt = Date.now();

function setupHealthRoutes(app) {
  app.get('/health/live', (req, res) => {
    res.status(200).json({
      status: 'alive',
      uptimeSec: Math.floor((Date.now() - startedAt) / 1000)
    });
  });

  app.get('/health/ready', (req, res) => {
    if (degraded) {
      return res.status(503).json({
        status: 'not ready',
        reason: 'critical degradation'
      });
    }
    res.status(200).json({ status: 'ready' });
  });
}

function setDegraded(value) { degraded = value; }
function isDegraded() { return degraded; }

module.exports = { setupHealthRoutes, setDegraded, isDegraded };
