'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { reconcile } = require('../data/tools/reconcile.js');
const { loadAwards } = require('../awards-loader.js');

test('every audited row is present unless accepted; no accepted delta is stale', () => {
  const audit = JSON.parse(fs.readFileSync(path.join(__dirname, 'golden', 'audit-2026-09-04.json'), 'utf8'));
  const deltas = JSON.parse(fs.readFileSync(path.join(__dirname, 'golden', 'accepted-deltas.json'), 'utf8'));
  const { byBrand, brands } = loadAwards();
  const r = reconcile({ audit, byBrand, brands, deltas });
  assert.deepEqual(r.missing, [], `missing audited rows:\n${r.missing.map((m) => JSON.stringify(m)).join('\n')}`);
  assert.deepEqual(r.stale, [], `stale accepted deltas:\n${r.stale.map((m) => JSON.stringify(m)).join('\n')}`);
});

test('no accepted delta describes a row the audit never had', () => {
  const audit = JSON.parse(fs.readFileSync(path.join(__dirname, 'golden', 'audit-2026-09-04.json'), 'utf8'));
  const deltas = JSON.parse(fs.readFileSync(path.join(__dirname, 'golden', 'accepted-deltas.json'), 'utf8'));
  const k = (r) => [r.brand, r.competition, r.edition, r.level, r.n].join('|');
  const audited = new Set(audit.rows.map(k));
  // An orphan is invisible to `missing`/`stale`, so it would sit in the file forever
  // claiming to excuse a row that does not exist.
  assert.deepEqual(deltas.filter((d) => !audited.has(k(d))).map(k), []);
});

test("the invariant is a multiset: removing one of Nugali's 2026 bronzes fails", () => {
  const audit = { rows: [1, 2].map((n) => ({ brand: 'Nugali Chocolates', competition: 'ica-americas', edition: '2026', level: 'bronze', n, p: 'x' })) };
  const byBrand = new Map([['nugali', [{ c: 'ICA Américas', y: '2026', level: 'bronze' }]]]);
  const brands = { brands: { nugali: { name: 'Nugali Chocolates', aliases: [] } } };
  const r = reconcile({ audit, byBrand, brands, deltas: [] });
  assert.equal(r.missing.length, 1);
  assert.equal(r.missing[0].n, 2);
});
