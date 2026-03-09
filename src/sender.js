// sender.js
require('dotenv').config();
const { eventBuffer, allEvents } = require('./tracker');

// ─── Build session summary with Focus Ratio ───────────────────────────────
function buildSummary(events) {
  let productiveSecs = 0;
  let unproductiveSecs = 0;
  const appTotals = {};

  for (const e of events) {
    const secs = e.durationSecs || 0;
    if (e.category === 'unproductive') unproductiveSecs += secs;
    else productiveSecs += secs;

    if (!appTotals[e.app]) {
      appTotals[e.app] = { app: e.app, category: e.category, totalSecs: 0 };
    }
    appTotals[e.app].totalSecs += secs;
  }

  const totalSecs = productiveSecs + unproductiveSecs;
  const focusRatio = totalSecs > 0
    ? Math.round((productiveSecs / totalSecs) * 1000) / 10
    : 0;

  return {
    date: new Date().toISOString().split('T')[0],
    totalSecs,
    productiveSecs,
    unproductiveSecs,
    focusRatio,
    appBreakdown: Object.values(appTotals).sort((a, b) => b.totalSecs - a.totalSecs),
  };
}

// ─── Flush — local only ───────────────────────────────────────────────────
async function flush() {
  eventBuffer.splice(0, eventBuffer.length);
  const summary = buildSummary(allEvents);
  console.log(`[sender] Focus Ratio: ${summary.focusRatio}%`);
}

module.exports = { flush, buildSummary };