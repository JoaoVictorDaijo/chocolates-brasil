const test = require('node:test');
const assert = require('node:assert/strict');
const { key } = require('../data/tools/lib/key.js');
const { clean } = require('../data/tools/lib/text.js');
const { LEVELS, mapLevel, icaBlock } = require('../data/tools/lib/levels.js');

test('key folds case, accents, dashes and punctuation but keeps CJK', () => {
  assert.equal(key('Dark Chocolate 70% Cocoa – Cacau em Flor'), key('Dark Chocolate 70% Cocoa - Cacau em Flor'));
  assert.equal(key('Ju Arléo chocolates'), key('Ju Arléo Chocolates'));
  assert.notEqual(key('Nugali'), key('Nugali Chocolates'));
  assert.equal(key('Mestiço\nChocolates'), 'mesticochocolates');
  assert.equal(key('拾米屋米花/蘇怡帆'), '拾米屋米花蘇怡帆');
  assert.equal(key(' ( ) '), '');
});

test('clean decodes entities and collapses whitespace', () => {
  assert.equal(clean('  Blum&#8217;s  &amp;\n Co '), "Blum’s & Co");
});

test('vocabulary is closed and carries disc/scored/places', () => {
  assert.deepEqual(Object.keys(LEVELS).sort(), ['bronze', 'commended', 'finalist', 'gold', 'gourmet-bronze', 'gourmet-diploma', 'gourmet-gold', 'gourmet-medal', 'gourmet-silver', 'recognition', 'silver', 'top-gold', 'trophy']);
  assert.deepEqual(LEVELS.finalist, { disc: 'o', scored: false, places: false });
  assert.deepEqual(LEVELS['gourmet-diploma'], { disc: 'o', scored: true, places: true });
  assert.deepEqual(LEVELS['top-gold'], { disc: 'g', scored: true, places: true });
});

test('mapLevel handles every published wording', () => {
  assert.equal(mapLevel('aoc', 'GOLD'), 'gold');
  assert.equal(mapLevel('aoc', 'Silvere'), 'silver');
  assert.equal(mapLevel('aoc', 'Top Gold'), 'top-gold');
  assert.equal(mapLevel('aoc', 'TROPHY'), 'trophy');
  assert.equal(mapLevel('aoc', 'COMMENDED'), 'commended');
  assert.equal(mapLevel('ica', 'Bronze'), 'bronze');
  assert.equal(mapLevel('ica', '2018 Americas MMM'), 'recognition');
  assert.equal(mapLevel('ica', '2017 World Gold M.M.M'), 'recognition');
  assert.equal(mapLevel('avpa', 'Gourmet Or'), 'gourmet-gold');
  assert.equal(mapLevel('avpa', 'Diplôme Gourmet'), 'gourmet-diploma');
  assert.equal(mapLevel('avpa', 'Médaille Gourmet'), 'gourmet-medal');
  assert.equal(mapLevel('aoc', 'Platinum'), null);
});

test('icaBlock classifies headings by key', () => {
  assert.equal(icaBlock('Plain/origin dark bar categories'), 'medal');
  assert.equal(icaBlock("‘Best in competition’ overall winners"), 'block');
  assert.equal(icaBlock('Special flavor ingredient recognition'), 'block');
  assert.equal(icaBlock('National awards'), 'block');
  assert.equal(icaBlock('Something new'), null);
});
