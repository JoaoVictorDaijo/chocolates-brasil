'use strict';
const fs = require('fs');
const path = require('path');

/**
 * Downloads an official results page or PDF into `data/raw/`, with browser
 * headers (the Academy of Chocolate site sits behind a rate-based Cloudflare
 * WAF), retry with long backoff, pacing between requests and a caller-supplied
 * content validator. An existing snapshot is never overwritten by a blocked or
 * invalid response, so a bad run degrades to the last good page.
 */
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Sec-Fetch-Mode': 'navigate', 'Sec-Fetch-Dest': 'document', 'Sec-Fetch-Site': 'none', 'Upgrade-Insecure-Requests': '1',
};
const RETRIES = 3;
const BACKOFF_MS = [20000, 40000];   // WAF blocks are rate-based; wait before retrying
const PACE_MS = 2000;                // minimum gap between requests

class SnapshotError extends Error { constructor(msg, dest) { super(msg); this.dest = dest; } }

async function defaultFetch(url, headers) {
  const res = await fetch(url, { headers, redirect: 'follow' });
  return { status: res.status, body: Buffer.from(await res.arrayBuffer()) };
}
const defaultSleep = (ms) => new Promise((r) => setTimeout(r, ms));
let lastRequestAt = 0;

/** A WAF interstitial, which arrives with a 200 as often as with a 403. */
function isBlockPage(buf) {
  const head = buf.subarray(0, 4000).toString('utf8');
  return /<title>[^<]*(Attention Required|Access denied|Just a moment)[^<]*<\/title>/i.test(head) || /Mod_Security/i.test(head);
}

async function fetchSnapshot({ url, dest, offline = false, validate = () => null, fetchFn = defaultFetch, sleepFn = defaultSleep }) {
  if (offline) {
    if (!fs.existsSync(dest)) throw new SnapshotError(`offline and no snapshot at ${dest} — save the page there by hand and re-run with --offline`, dest);
    return fs.readFileSync(dest);
  }
  let lastErr = 'no attempt';
  for (let attempt = 0; attempt < RETRIES; attempt++) {
    if (attempt > 0) await sleepFn(BACKOFF_MS[Math.min(attempt - 1, BACKOFF_MS.length - 1)]);
    const gap = Date.now() - lastRequestAt;
    if (gap < PACE_MS) await sleepFn(PACE_MS - gap);
    lastRequestAt = Date.now();
    let res;
    try { res = await fetchFn(url, BROWSER_HEADERS); } catch (e) { lastErr = `network: ${e.message}`; continue; }
    if (res.status !== 200) { lastErr = `HTTP ${res.status}`; continue; }
    if (isBlockPage(res.body)) { lastErr = 'WAF block page'; continue; }
    const v = validate(res.body);
    if (v) { lastErr = `invalid page: ${v}`; continue; }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, res.body);
    return res.body;
  }
  throw new SnapshotError(`could not fetch ${url} (${lastErr}) — expected snapshot at ${dest}; save the page there by hand and re-run with --offline`, dest);
}

module.exports = { fetchSnapshot, SnapshotError, BROWSER_HEADERS, isBlockPage };
