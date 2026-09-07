// Fixtures (academyofchocolate.org.uk/awards/<year>/, downloaded 2026-09-05), with the
// number of `<tr` occurrences each page carries — one five-column results table per
// edition, plus the `<th>` header row:
//   grep -o '<tr' <file> | wc -l
// aoc-2013.html  107  /awards/2013/
// aoc-2022.html  489  /awards/2022/
// aoc-2023.html  841  /awards/2023/
// aoc-2024.html  534  /awards/2024/

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const aoc = require('../data/tools/parsers/aoc.js');
const fx = (n) => fs.readFileSync(path.join(__dirname, 'fixtures', n), 'utf8');

test('2013 uppercase levels', () => {
  const { entries } = aoc.parse(fx('aoc-2013.html'));
  assert.equal(entries.length, 106);
  assert.ok(entries.every((e) => ['gold', 'silver', 'bronze'].includes(e.level)));
  assert.equal(entries[0].country, null);
});

test('2022 Top Gold maps to top-gold', () => {
  const { entries } = aoc.parse(fx('aoc-2022.html'));
  assert.equal(entries.filter((e) => e.level === 'top-gold').length, 3);
});

test('2023 Silvere typo maps to silver; Overall Winner header row is quarantined', () => {
  const { entries, skipped } = aoc.parse(fx('aoc-2023.html'));
  assert.equal(entries.filter((e) => e.level_raw === 'Silvere').length, 12);
  assert.ok(entries.filter((e) => e.level_raw === 'Silvere').every((e) => e.level === 'silver'));
  assert.ok(skipped.some((s) => s.reason === 'blank-level' && /Overall Winner/.test(s.raw)));
  assert.ok(entries.some((e) => e.maker === 'Mission Chocolate' && e.product === 'Pão De Mel' && e.level === 'bronze'));
});

test('2024 keeps the same product medalling in two categories', () => {
  const { entries } = aoc.parse(fx('aoc-2024.html'));
  const ch = entries.filter((e) => e.maker === 'Chocoholic Thailand' && e.product === 'Phattalung 75% Dark Chocolate');
  assert.equal(ch.length, 2);
  assert.deepEqual(ch.map((e) => e.category).sort(), ['Plain Chocolate Drinks', 'Plain Dark Chocolate Bar']);
  assert.ok(entries.some((e) => e.maker === 'MONJOLO CHOCOLATES'));
});

test('the first column is the group and the second the category; every entry has the shared shape', () => {
  const { entries } = aoc.parse(fx('aoc-2024.html'));
  const monjolo = entries.find((e) => e.maker === 'MONJOLO CHOCOLATES');
  assert.deepEqual(monjolo, {
    level: 'bronze',
    level_raw: 'Bronze',
    maker: 'MONJOLO CHOCOLATES',
    country: null,
    product: '70% CACAO TUERÊ - AMAZÔNIA',
    category: 'Plain Dark Chocolate Bar',
    group: 'PLAIN CHOCOLATE BARS (BEAN-TO-BAR)',
    score: null,
    special: [],
    flags: [],
    private_label_maker: null,
  });
});

test('2024 quarantines the rows with no company instead of aborting', () => {
  const { entries, skipped } = aoc.parse(fx('aoc-2024.html'));
  assert.equal(entries.length, 531);
  assert.deepEqual(skipped.filter((s) => s.reason === 'blank-maker').map((s) => s.raw), [
    'SPREADS | Milk Chocolate Spreads | Silver |  | ',
    'Golden Bean |  | Gold |  | ',
  ]);
});

// PACKAGING, BRAND EXPERIENCE and the early truffle categories are awarded to the maker,
// and the page prints them with an empty product cell — 71 real awards across the 18
// editions, which quarantining every product-less row would lose.
test('a row with a category but no product is a maker-level award', () => {
  const html = '<table><tr><td>PACKAGING</td><td>Bar Wrappers</td><td>GOLD</td><td>Mission Chocolate</td><td></td></tr></table>';
  const { entries, skipped } = aoc.parse(html);
  assert.deepEqual(skipped, []);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].product, 'Bar Wrappers');
  assert.equal(entries[0].product, entries[0].category);
  assert.deepEqual(entries[0].flags, ['maker-level']);
});

test('a row with neither product nor category is quarantined, not dropped', () => {
  const html = '<table><tr><td>BRAND EXPERIENCE</td><td></td><td>TROPHY</td><td>Table</td><td></td></tr></table>';
  const { entries, skipped } = aoc.parse(html);
  assert.equal(entries.length, 0);
  assert.deepEqual(skipped, [{ raw: 'BRAND EXPERIENCE |  | TROPHY | Table | ', reason: 'blank-product' }]);
});

test('a page with no results table aborts loudly', () => {
  assert.throws(() => aoc.parse('<html><body><p>Sem resultados</p></body></html>'), /no <table>/);
});

test('an unknown level word aborts loudly', () => {
  const html = '<table><tr><td>BAR</td><td>Best Dark</td><td>Platinum</td><td>Maker</td><td>Product</td></tr></table>';
  assert.throws(() => aoc.parse(html), /unknown AoC level word "Platinum"/);
});
