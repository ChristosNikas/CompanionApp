// sender.js
// Batches activity events and sends them to your web API.
// Handles offline buffering, retries, and auth.

require('dotenv').config();
const Store = require('electron-store').default;
const { eventBuffer } = require('./tracker');

const store = new Store();
const MAX_RETRY_BUFFER = 200; // max events to hold offline

// ─── Load any unsent events from last session ─────────────────────────────
let retryQueue = store.get('retryQueue', []);

// ─── Core flush function ──────────────────────────────────────────────────
async function flush() {
  // Combine retry queue + new events
  const batch = [...retryQueue, ...eventBuffer.splice(0, eventBuffer.length)];

  if (batch.length === 0) return;

  console.log(`[sender] Flushing ${batch.length} event(s)...`);

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