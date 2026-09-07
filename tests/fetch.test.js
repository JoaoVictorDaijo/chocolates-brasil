const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { buildAwardFile } = require('../data/tools/fetch.js');
const { validateAwardFile } = require('../data/tools/lib/schema.js');
const fx = (n) => fs.readFileSync(path.join(__dirname, 'fixtures', n));

test('buildAwardFile produces a valid file with skipped bookkeeping', async () => {
  const edition = { slug: '2026', year: 2026, edition: '2026', title: 'Americas 2026', url: 'https://u', finalists_url: 'https://f', parser: 'ica-new' };
  const f = await buildAwardFile({ competition: 'ica-americas', edition, html: fx('ica-am-2026.html').toString(), finalistsHtml: fx('ica-am-2026-fin.html').toString(), today: '2026-09-05' });
  assert.deepEqual(validateAwardFile(f), []);
  assert.equal(f.source.method, 'parser'); assert.equal(f.source.snapshot, 'data/raw/ica-americas/2026.html');
  assert.equal(f.entries.filter((e) => e.level === 'finalist').length > 0, true);
});
test('2016 merged round is filtered by the Americas country list', async () => {
  const html = '<h1>Plain/origin bars</h1><h2>Dark</h2><p><strong>Gold</strong>: A (Japan) – X</p><p><strong>Silver</strong>: B (Brazil) – Y</p>';
  const edition = { slug: '2016', year: 2016, edition: '2016', title: 'Americas and Asia Pacific 2016', url: 'https://u', parser: 'ica-old', filter: 'americas-countries' };
  const f = await buildAwardFile({ competition: 'ica-americas', edition, html, today: '2026-09-05' });
  assert.equal(f.entries.length, 1); assert.deepEqual(f.source.filtered, { rule: 'americas-countries', dropped: 1 });
});
test('a row the source prints twice is one entry and one duplicate-row', async () => {
  const row = '<p><strong>Gold</strong>: Maker A (Brazil) – Bar One</p>';
  const html = '<h1>Plain/origin bars</h1><h2>Dark</h2>' + row + row;
  const edition = { slug: '2020', year: 2020, edition: '2020', title: 'Dupes', url: 'https://u', parser: 'ica-old' };
  const f = await buildAwardFile({ competition: 'ica-world', edition, html, today: '2026-09-05' });
  assert.deepEqual(validateAwardFile(f), []);
  assert.equal(f.entries.length, 1);
  assert.deepEqual(f.source.skipped, [{ raw: 'Gold: Maker A – Bar One [Dark]', reason: 'duplicate-row' }]);
});
