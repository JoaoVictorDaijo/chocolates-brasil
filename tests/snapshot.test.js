const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { fetchSnapshot, SnapshotError, BROWSER_HEADERS } = require('../data/tools/lib/snapshot.js');

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'snap-'));
const ok = (body) => async () => ({ status: 200, body: Buffer.from(body) });
const noSleep = async () => {};
const validate = (b) => (b.toString().includes('<title>Results') ? null : 'bad title');

test('offline reads the existing snapshot and never calls fetch', async () => {
  const dest = path.join(tmp(), 'x.html'); fs.writeFileSync(dest, '<title>Results</title>');
  let calls = 0;
  const buf = await fetchSnapshot({ url: 'https://x', dest, offline: true, validate, fetchFn: async () => { calls++; }, sleepFn: noSleep });
  assert.equal(buf.toString(), '<title>Results</title>'); assert.equal(calls, 0);
});
test('offline without a snapshot throws naming the path', async () => {
  const dest = path.join(tmp(), 'missing.html');
  await assert.rejects(fetchSnapshot({ url: 'https://x', dest, offline: true, validate, sleepFn: noSleep }), (e) => e instanceof SnapshotError && e.dest === dest);
});
test('retries three times with backoff and keeps the old snapshot on a block page', async () => {
  const dest = path.join(tmp(), 'x.html'); fs.writeFileSync(dest, '<title>Results</title>old');
  let calls = 0; const waits = [];
  const fetchFn = async () => { calls++; return { status: 403, body: Buffer.from('<title>Attention Required! | Cloudflare</title>') }; };
  await assert.rejects(fetchSnapshot({ url: 'https://x', dest, validate, fetchFn, sleepFn: async (ms) => { waits.push(ms); } }), SnapshotError);
  assert.equal(calls, 3); assert.equal(fs.readFileSync(dest, 'utf8'), '<title>Results</title>old');
  assert.ok(waits.length >= 2);
});
test('a valid response is written and returned, with browser headers', async () => {
  const dest = path.join(tmp(), 'sub', 'x.html'); let seen;
  const fetchFn = async (url, headers) => { seen = headers; return { status: 200, body: Buffer.from('<title>Results</title>new') }; };
  const buf = await fetchSnapshot({ url: 'https://x', dest, validate, fetchFn, sleepFn: noSleep });
  assert.equal(buf.toString(), '<title>Results</title>new'); assert.equal(fs.readFileSync(dest, 'utf8'), '<title>Results</title>new');
  assert.equal(seen['User-Agent'], BROWSER_HEADERS['User-Agent']);
});
test('a 200 that fails the validator keeps the old snapshot', async () => {
  const dest = path.join(tmp(), 'x.html'); fs.writeFileSync(dest, '<title>Results</title>old');
  await assert.rejects(
    fetchSnapshot({ url: 'https://x', dest, validate, fetchFn: ok('<title>Nothing here</title>'), sleepFn: noSleep }),
    (e) => e instanceof SnapshotError && /bad title/.test(e.message));
  assert.equal(fs.readFileSync(dest, 'utf8'), '<title>Results</title>old');
});
