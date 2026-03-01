// sender.js
// Batches activity events and sends them to your web API.
// Handles offline buffering, retries, and auth.

require('dotenv').config();
const Store = require('electron-store').default;
const { eventBuffer, allEvents } = require('./tracker');

const store = new Store();
const MAX_RETRY_BUFFER = 200; // max events to hold offline

// ─── Load any unsent events from last session ─────────────────────────────
let retryQueue = store.get('retryQueue', []);

// ─── Build session summary with Focus Ratio ───────────────────────────────
function buildSummary(events) {
  let productiveSecs = 0;
  let neutralSecs    = 0;
  let distractingSecs = 0;
  const appTotals = {};

  for (const e of events) {
    const secs = e.durationSecs || 0;
    if (e.category === 'productive')  productiveSecs  += secs;
    else if (e.category === 'neutral')    neutralSecs += secs;
    else if (e.category === 'distracting') distractingSecs += secs;

    if (!appTotals[e.app]) {
      appTotals[e.app] = { app: e.app, category: e.category, totalSecs: 0 };
    }
    appTotals[e.app].totalSecs += secs;
  }

  const totalScreenTimeSecs = productiveSecs + neutralSecs + distractingSecs;
  const focusRatio = totalScreenTimeSecs > 0
    ? Math.round((productiveSecs / totalScreenTimeSecs) * 1000) / 10
    : 0;

  return {
    date: new Date().toISOString().split('T')[0],
    totalScreenTimeSecs,
    productiveSecs,
    neutralSecs,
    distractingSecs,
    focusRatio,
    appBreakdown: Object.values(appTotals).sort((a, b) => b.totalSecs - a.totalSecs),
  };
}

// ─── Core flush function ──────────────────────────────────────────────────
async function flush() {
  // Combine retry queue + new events
  const batch = [...retryQueue, ...eventBuffer.splice(0, eventBuffer.length)];

  if (batch.length === 0) return;

  console.log(`[sender] Flushing ${batch.length} event(s)...`);

  const sessionSummary = buildSummary(allEvents);
  console.log(`[sender] Focus Ratio: ${sessionSummary.focusRatio}%`);

  try {
    const res = await fetch(`${process.env.API_URL}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.USER_TOKEN}`,
      },
      body: JSON.stringify({
        deviceId: process.env.DEVICE_ID || 'desktop',
        userId: process.env.USER_ID,
        sessionSummary,
        events: batch,
      }),
    });

    if (!res.ok) {
      throw new Error(`Server responded with ${res.status}`);
    }

    // Success — clear retry queue from disk
    retryQueue = [];
    store.set('retryQueue', []);
    console.log(`[sender] ✓ ${batch.length} event(s) sent successfully.`);

  } catch (err) {
    console.warn(`[sender] ✗ Send failed: ${err.message}. Queuing for retry.`);

    // Save unsent events to disk so they survive app restarts
    retryQueue = [...batch].slice(0, MAX_RETRY_BUFFER);
    store.set('retryQueue', retryQueue);
  }
}


//  Send every 30 seconds the data 
const interval = setInterval(flush, 30_000);

//  Flush immediately on app quit so no data is lost 
process.on('exit', () => {
  clearInterval(interval);
  flush();
});

module.exports = { flush };