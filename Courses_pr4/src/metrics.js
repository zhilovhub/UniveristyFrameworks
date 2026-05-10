class Metrics {
  constructor() {
    this.transitionsSuccess = 0;
    this.transitionsError = 0;
    this.duplicateEvents = 0;
    this.compensations = 0;
    this.stepLatencies = [];
  }

  success() { this.transitionsSuccess++; }
  error() { this.transitionsError++; }
  duplicate() { this.duplicateEvents++; }
  compensation() { this.compensations++; }

  latency(step, ms) {
    this.stepLatencies.push({ step, ms, at: Date.now() });
    if (this.stepLatencies.length > 1000) this.stepLatencies.shift();
  }

  snapshot(totalProcesses = 0) {
    const grouped = {};
    for (const item of this.stepLatencies) {
      if (!grouped[item.step]) grouped[item.step] = [];
      grouped[item.step].push(item.ms);
    }
    const stepStats = {};
    for (const [name, arr] of Object.entries(grouped)) {
      const sorted = [...arr].sort((a, b) => a - b);
      const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
      stepStats[name] = {
        count: arr.length,
        avgMs: Math.round(avg),
        p50Ms: sorted[Math.floor(sorted.length * 0.5)],
        maxMs: sorted[sorted.length - 1]
      };
    }
    return {
      transitionsSuccess: this.transitionsSuccess,
      transitionsError: this.transitionsError,
      duplicateEvents: this.duplicateEvents,
      compensations: this.compensations,
      totalProcesses,
      stepStats,
      recentLatencies: this.stepLatencies.slice(-20)
    };
  }
}

const metrics = new Metrics();

module.exports = { metrics, Metrics };
