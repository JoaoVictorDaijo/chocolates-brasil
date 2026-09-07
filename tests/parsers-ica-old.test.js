// Fixtures (chocolateawards.com, downloaded 2026-09-05 with a browser UA), with the
// number of `results-link` occurrences each page carries. The old site ships its
// results markup on a single line, so `grep -c` counts 1 — count occurrences:
//   grep -o results-link <file> | wc -l
// ica-am-2019.html        660  /results/winners/americas-bean-to-bar-and-chocolatier-competition-winners-2019/
// ica-am-2017.html        520  /results/winners/americas-competition-2017-winners/
// ica-am-2017-fin.html    526  /results/winners/americas-competition-2017-grand-jury-finalists/
// ica-am-2021-22-fin.html 930  /results/winners/americas-bean-to-bar-and-craft-chocolatier-competition-2021-22-grand-jury-finalists/

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const icaOld = require('../data/tools/parsers/ica-old.js');
const { parseIcaStrong } = require('../data/tools/parsers/ica-strong.js');
const { parseFinalists } = require('../data/tools/parsers/ica-finalists.js');
const fx = (n) => fs.readFileSync(path.join(__dirname, 'fixtures', n), 'utf8');

test('2019 Américas: Luisa Abram is one silver entry carrying the National award as special', () => {
  const { entries, skipped } = icaOld.parse(fx('ica-am-2019.html'), {});
  assert.equal(entries.length, 321);
  assert.deepEqual(skipped, []);
  const la = entries.filter((e) => e.maker === 'Luisa Abram' && /Jurua/i.test(e.product));
  assert.equal(la.length, 1);
  assert.equal(la[0].level, 'silver');
  assert.ok(la[0].special.some((s) => /National awards: Gold – Brazil/.test(s)), JSON.stringify(la[0].special));
  // The qualifier of a National-award row travels inside the block tag and nowhere else,
  // so no medal entry is promoted to gold by the country prize it also won.
  assert.ok(entries.every((e) => e.level !== 'gold' || !e.special.some((s) => /^Gold – /.test(s))));
});

test('2019 Américas: Mission Chocolate keeps its three medals and their + Special runs', () => {
  const { entries } = icaOld.parse(fx('ica-am-2019.html'), {});
  const mc = entries.filter((e) => e.maker === 'Mission Chocolate');
  assert.equal(mc.length, 3);
  assert.deepEqual(mc.map((e) => e.level), ['silver', 'silver', 'silver']);
  // The product name carries a colon; the level split must not eat it.
  assert.deepEqual(mc.map((e) => e.product),
    ['Brazil Biomes Project: Guava 70%', 'Brazil Biomes Project: Umbu 70%', 'Brazilian Desserts: Romeu & Julieta']);
  assert.deepEqual(mc.map((e) => e.special), [['+ Special: Biome'], ['+ Special: Biome'], ['+ Special: Innovation']]);
  assert.deepEqual(mc[0].flags, ['own-chocolate']);
});

test('2017 Américas: the MMM row is a recognition entry beside the medal it did not replace', () => {
  const { entries, skipped } = icaOld.parse(fx('ica-am-2017.html'), {});
  const rec = entries.filter((e) => e.level === 'recognition');
  assert.equal(rec.length, 1);
  assert.equal(rec[0].level_raw, '2017 Americas MMM');
  assert.equal(rec[0].maker, 'LetterPress Chocolate');
  assert.equal(rec[0].product, 'Ucayali, Peru');
  assert.equal(rec[0].category, 'Triple MMM Special Award');
  // The same product's category silver stays a separate entry, with its own honours.
  const lp = entries.filter((e) => e.maker === 'LetterPress Chocolate' && e.product === 'Ucayali, Peru');
  assert.equal(lp.length, 2);
  const silver = lp.find((e) => e.level === 'silver');
  assert.deepEqual(silver.special, ['National awards: Gold – USA']);
  // The page's other two recognitions name a maker but no product: quarantined, never entries.
  assert.deepEqual(skipped, [
    { raw: '2017 Americas Bean-to-bar Chocolatier : French Broad Chocolates (United States)', reason: 'unparsed-body' },
    { raw: '2017 Americas Biome-to-bar Recognition : Ivan Murrugarra Magia Piura (Peru)', reason: 'unparsed-body' },
  ]);
});

test('finalists pages of 2017 (no score span) and 2021-22 (newline separated) both parse', () => {
  const f2017 = parseFinalists(fx('ica-am-2017-fin.html'));
  assert.equal(f2017.length, 263);
  assert.ok(f2017.every((e) => e.score === null));
  const f2122 = parseFinalists(fx('ica-am-2021-22-fin.html'));
  assert.equal(f2122.length, 465);
  assert.equal(f2122[0].score, 90.14);
});

test('the finalists join drops the medallists of the 2017 page', () => {
  const { entries } = icaOld.parse(fx('ica-am-2017.html'), { finalistsHtml: fx('ica-am-2017-fin.html') });
  const lp = entries.filter((e) => e.maker === 'LetterPress Chocolate' && e.product === 'Ucayali, Peru');
  assert.equal(lp.length, 2);                        // its silver and its MMM recognition, no finalist row
  // 263 finalists, 232 of them medallists already listed; the remaining 31 join the 234 medal rows.
  assert.equal(entries.filter((e) => e.level === 'finalist').length, 31);
  assert.equal(entries.length, 265);
});

// The recognition rule changes where a row inside an award block lands, so the run
// that may follow one needs markup built on purpose: no fixture prints that pair.
test('a recognition inside an award block is an entry, and a following + run joins it', () => {
  const { entries, skipped } = parseIcaStrong(
    '<h1>Plain/origin bars</h1><h2>Plain/origin dark chocolate bars</h2>'
    + '<p><strong>Gold</strong>: Maker A (Brazil) – Bar One</p>'
    + '<h1>Special awards</h1><h2>Triple MMM Special Award</h2>'
    + '<p><strong>2018 Americas MMM</strong>: Maker B (Brazil) – Bar Two</p>'
    + '<p><strong>+ Special</strong>: Biome</p>', { variant: 'old' });
  assert.deepEqual(skipped, []);
  assert.deepEqual(entries.map((e) => [e.level, e.maker, e.special]), [
    ['gold', 'Maker A', []],
    ['recognition', 'Maker B', ['+ Special: Biome']],
  ]);
});

// A recognition shares `entries` with the medals, so it is reachable by the block join
// on any page that prints its recognitions before the categories. No fixture does
// (2017 prints "Special awards" last), so the order needs markup built on purpose.
test('a recognition is never the target of a block-row join', () => {
  const recognitionBlock = '<h1>Special awards</h1><h2>Triple MMM Special Award</h2>'
    + '<p><strong>2018 Americas MMM</strong>: Maker A (Brazil) – Bar One</p>';
  const nationalBlock = '<h1>National awards</h1><h2>Plain/origin dark chocolate bars</h2>'
    + '<p><strong>Gold – Brazil</strong>: Maker A (Brazil) – Bar One</p>';
  const medal = '<h1>Plain/origin bars</h1><h2>Plain/origin dark chocolate bars</h2>'
    + '<p><strong>Silver</strong>: Maker A (Brazil) – Bar One</p>';

  const { entries, skipped } = parseIcaStrong(recognitionBlock + medal + nationalBlock, { variant: 'old' });
  assert.deepEqual(skipped, []);
  assert.deepEqual(entries.map((e) => [e.level, e.special]), [
    ['recognition', []],
    ['silver', ['National awards: Gold – Brazil']],
  ]);

  // With no medal for that product the national row is quarantined, not folded into the recognition.
  const alone = parseIcaStrong(recognitionBlock + nationalBlock, { variant: 'old' });
  assert.deepEqual(alone.entries.map((e) => [e.level, e.special]), [['recognition', []]]);
  assert.deepEqual(alone.skipped, [
    { raw: 'Gold – Brazil: Maker A – Bar One', reason: 'unjoined-block-row', block: 'National awards' },
  ]);
});

// The 2019 World Final subdivides its Chocolate Tasters' Special Prizes categories by
// cacao origin with an `<h3>`. Without a rule for that depth the heading text runs into
// the level label of the row below it ("Nicaragua Gold : …"), which no level word matches.
test('an <h3> names the category, so the run below it keeps its level', () => {
  const { entries, skipped } = parseIcaStrong(
    '<h1>Plain/origin bars</h1><h2>Plain/origin dark chocolate bars</h2>'
    + '<p><strong>Bronze</strong>: Maker A (Denmark) – Bar One</p>'
    + "<h1>Chocolate Tasters' Special Prizes</h1><h2>Plain/origin dark chocolate bars</h2>"
    + '<h3>Nicaragua</h3><p><strong>Gold</strong>: Maker A (Denmark) – Bar One</p>', { variant: 'old' });
  assert.deepEqual(skipped, []);
  assert.deepEqual(entries.map((e) => [e.level, e.category, e.special]), [
    ['bronze', 'Plain/origin dark chocolate bars', ["Chocolate Tasters' Special Prizes: Nicaragua"]],
  ]);
});

// The 2020-21 Américas page prints its National awards with no paragraph wrapper: rows
// are separated by a bare newline and the block ends at an <hr /> followed by the page
// footnotes. Splitting on <br>/</p> alone reads the whole block as one row, so 13 of its
// 15 national golds never reach the medal they qualify.
test('rows separated by a bare newline are separate runs, and an <hr /> ends the last one', () => {
  const medals = '<h1>Plain/origin bars</h1><h2>Plain/origin dark chocolate bars</h2>'
    + '<p><strong>Gold</strong>: Maker A (Ecuador) – <strong>Bar One</strong></p>'
    + '<p><strong>Silver</strong>: Maker B (Peru) – <strong>Bar Two</strong></p>';
  const national = '<h1>National awards</h1><h2>Plain/origin dark chocolate bars</h2>'
    + '<strong>Gold – Ecuador</strong>: Maker A (Ecuador) – <strong>Bar One</strong>\n\n'
    + '<strong>Gold – Peru</strong>: Maker B (Peru) – <strong>Bar Two</strong>\n'
    + '<hr /><em>(*) Declared chocolate maker for private label bars.</em>';

  const { entries, skipped } = parseIcaStrong(medals + national, { variant: 'old' });
  assert.deepEqual(skipped, []);
  assert.deepEqual(entries.map((e) => [e.maker, e.product, e.special]), [
    ['Maker A', 'Bar One', ['National awards: Gold – Ecuador']],
    ['Maker B', 'Bar Two', ['National awards: Gold – Peru']],
  ]);
});
