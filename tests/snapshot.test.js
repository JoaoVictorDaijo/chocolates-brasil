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
test('a fetch that rejects (an aborted timeout) is retried three times and then throws', async () => {
  const dest = path.join(tmp(), 'x.html');
  let calls = 0;
  const fetchFn = async () => { calls++; const e = new Error('The operation was aborted due to timeout'); e.name = 'TimeoutError'; throw e; };
  await assert.rejects(
    fetchSnapshot({ url: 'https://x', dest, validate, fetchFn, sleepFn: noSleep }),
    (e) => e instanceof SnapshotError && e.dest === dest && /timeout/i.test(e.message));
  assert.equal(calls, 3); assert.equal(fs.existsSync(dest), false);
});
test('offline rejects a snapshot that fails the validator and leaves the file alone', async () => {
  const dest = path.join(tmp(), 'x.html'); fs.writeFileSync(dest, '<title>Log in</title>');
  await assert.rejects(
    fetchSnapshot({ url: 'https://x', dest, offline: true, validate, fetchFn: async () => { throw new Error('fetched while offline'); }, sleepFn: noSleep }),
    (e) => e instanceof SnapshotError && e.dest === dest && /bad title/.test(e.message));
  assert.equal(fs.readFileSync(dest, 'utf8'), '<title>Log in</title>');
});
