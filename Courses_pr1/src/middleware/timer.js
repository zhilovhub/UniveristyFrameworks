const requestTimer = (req, res, next) => {
  const start = process.hrtime();

  res.once('finish', () => {
    const diff = process.hrtime(start);
    const timeInMs = (diff[0] * 1e9 + diff[1]) / 1e6;

    console.log(`[${req.requestId}] Время выполнения: ${timeInMs.toFixed(2)}ms`);
  });

  next();
};

module.exports = requestTimer;
