const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { parseIcaStrong } = require('../data/tools/parsers/ica-strong.js');
const { parseFinalists, joinFinalists } = require('../data/tools/parsers/ica-finalists.js');
const icaNew = require('../data/tools/parsers/ica-new.js');
const fx = (n) => fs.readFileSync(path.join(__dirname, 'fixtures', n), 'utf8');

test('2026 Américas: 155 category rows + 6 award-block rows joined, not duplicated', () => {
  const { entries, skipped } = parseIcaStrong(fx('ica-am-2026.html'), { variant: 'new' });
  assert.equal(entries.length, 155);
  // The page's two award blocks hold 6 rows: 4 under "‘Best in competition’ overall
  // winners" and 2 under "Special flavor ingredient recognition". None becomes an entry.
  const blockTags = entries.flatMap((e) => e.special.filter((s) => /^(Best in competition|Special flavor)/.test(s)));
  assert.equal(blockTags.length, 6);
  const best = entries.filter((e) => e.special.some((s) => s.startsWith('Best in competition')));
  assert.equal(best.length, 4);
  const brazil = entries.filter((e) => e.country === 'Brazil');
  assert.equal(brazil.length, 32);
  const dos = entries.find((e) => e.maker === 'DoSemente Cacau' && e.product === 'Caramelized Milk White Chocolate');
  assert.equal(dos.level, 'silver'); assert.equal(dos.score, 88.2);
  assert.deepEqual(dos.special, ['+ Gold: Chocolate Maker', '+ Gold: Growing Country']);
  assert.deepEqual(dos.flags, ['own-chocolate']);
  assert.deepEqual(skipped, []);
  // The page prints the same private-label maker two ways; both are stored verbatim.
  const pl = entries.filter((e) => e.private_label_maker).map((e) => e.private_label_maker);
  assert.deepEqual(pl, ['José Carlos Buendía Beristain', 'JOSE CARLOS BUENDIA BERISTAIN',
    'JOSE CARLOS BUENDIA BERISTAIN', 'El cacao es de mi plantación y yo hago el chocolate']);
});

test('groups come from h1, categories from h2', () => {
  const { entries } = parseIcaStrong(fx('ica-am-2026.html'), { variant: 'new' });
  const n = entries.find((e) => e.maker === 'Nugali' && e.product === 'Dark Chocolate 70% Cocoa – Cacau em Flor');
  assert.equal(n.group, 'Plain/origin bars');
  assert.equal(n.category, 'Plain/origin dark chocolate bars');
  // An award block's own h2 never leaks into a medal entry's category.
  const best = entries.find((e) => e.special.some((s) => s.startsWith('Best in competition')));
  assert.ok(best.special.includes('Best in competition overall winners: Plain/origin dark bar categories'));
  assert.equal(best.category, 'Plain/origin dark chocolate bars');
});

test('finalists join drops medallists (dash variant) and keeps the rest', () => {
  const { entries } = parseIcaStrong(fx('ica-am-2026.html'), { variant: 'new' });
  const fin = parseFinalists(fx('ica-am-2026-fin.html'));
  assert.ok(fin.length > 150);
  const joined = joinFinalists(entries, fin);
  const nugaliRows = joined.filter((e) => e.maker === 'Nugali' && /Cacau em Flor/.test(e.product));
  assert.equal(nugaliRows.length, 1);
  const finalists = joined.filter((e) => e.level === 'finalist');
  assert.equal(finalists.filter((e) => e.country === 'Brazil').length, 9);
  assert.equal(finalists[0].level_raw, 'Grand Jury Finalist');
});

test('World Final 2025 parses and keeps a CJK product name', () => {
  const { entries, skipped } = icaNew.parse(fx('ica-wf-2025.html'), {});
  assert.ok(entries.length >= 290);
  assert.deepEqual(skipped, []);
  const cjk = entries.find((e) => e.maker === 'OneBite Nama');
  assert.equal(cjk.product, '姜枣流香 Ginger Date');
  assert.equal(entries.filter((e) => e.country === 'Brazil').length, 5);
});

test('editorial prose before the first h1 is not read as results', () => {
  // The World Final 2025 page opens with a judges' commentary full of <strong> runs
  // ("Flavoured Bars and Bonbons: A Year of Bold Creativity"); none of it is an entry.
  const { entries } = parseIcaStrong(fx('ica-wf-2025.html'), { variant: 'new' });
  assert.ok(entries.every((e) => e.group && e.category));
  assert.ok(!entries.some((e) => /A Year of Bold Creativity/.test(e.product)));
});
