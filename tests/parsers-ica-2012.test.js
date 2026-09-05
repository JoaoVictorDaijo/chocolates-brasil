// Fixtures (chocolateawards.com, downloaded 2026-09-05 with a browser UA). These pages
// have no `results-link` spans and ship their body on a single line, so count the level
// runs with `grep -o '<level>' <file> | wc -l`, never `grep -c`:
// ica-wf-2012.html  GOLD 18 SILVER 26 BRONZE 0  → 38 medal rows + 6 award-block rows
//                   /results/winners/world-final-2012-winners/
// ica-wf-2014.html  GOLD 42 SILVER 56 BRONZE 28 → 114 medal rows + 12 award-block bullets
//                   /results/winners/world-final-2014-winners/
// ica-am-2013.html  GOLD 28 SILVER 47 BRONZE 0  → 42 medal rows + 33 award-block rows
//                   /results/winners/americas-semi-final-2013-winners/

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const ica2012 = require('../data/tools/parsers/ica-2012.js');
const fx = (n) => fs.readFileSync(path.join(__dirname, 'fixtures', n), 'utf8');
const levels = (es) => es.reduce((a, e) => ({ ...a, [e.level]: (a[e.level] || 0) + 1 }), {});
const one = (es, maker, product) => {
  const hit = es.filter((e) => e.maker === maker && e.product === product);
  assert.equal(hit.length, 1, `${maker} – ${product}: ${hit.length} entries`);
  return hit[0];
};

test('World Final 2012: plain "<p>GOLD: …</p>" rows, with the Special awards joined onto the medal', () => {
  const { entries, skipped } = ica2012.parse(fx('ica-wf-2012.html'), {});
  assert.equal(entries.length, 38);
  assert.deepEqual(levels(entries), { gold: 12, silver: 26 });
  assert.ok(entries.every((e) => e.category && e.group && e.country));

  // The page opens a group with <h1> and names its categories <h3> in some groups and
  // <h4> in others, so group and category come from the heading nesting, not the number.
  const paul = one(entries, 'Paul A Young Fine Chocolates', '85% RAW Ecuadorian dark chocolate truffle');
  assert.equal(paul.group, 'Filled chocolates – unflavoured dark');       // <h1>
  assert.equal(paul.category, 'Unflavoured dark – Ganaches and truffles'); // <h3>
  assert.equal(one(entries, 'Pacari Chocolate', '70% Raw – Organic and Biodynamic').category,
    'Bars – Dark plain/origin bars');                                      // <h4> under <h1>Bars</h1>

  // The Special awards rows restate the gold this product already won, so they are its
  // qualifiers — four more gold entries would double-count the category's single gold.
  assert.deepEqual(one(entries, 'Pacari Chocolate', '70% Raw – Organic and Biodynamic').special, [
    'Special awards: GOLD – Chocolate Maker',
    'Special awards: GOLD – Growing Country Chocolate',
    'Special awards: GOLD – Directly Traded Cacao',
    'Special awards: GOLD – Organic',
  ]);
  assert.deepEqual(one(entries, 'Chocolates El Rey, C.A.', 'Icoa White Chocolate').special,
    ['Special awards: GOLD – Growing Country Chocolate']);

  // "Best cacao source" names a cacao origin, with no maker and no product: the
  // country-less fallback must not split the hyphen of "Piura-Quemazon" into two fields.
  assert.deepEqual(skipped, [{ raw: 'GOLD – Best cacao source: Piura-Quemazon', reason: 'unparsed-body' }]);
});

test('World Final 2014: the <strong> variant, and the indented bullets of its award blocks', () => {
  const { entries, skipped } = ica2012.parse(fx('ica-wf-2014.html'), {});
  assert.equal(entries.length, 114);
  assert.deepEqual(levels(entries), { gold: 30, silver: 56, bronze: 28 });
  assert.deepEqual(skipped, []);

  // "<strong>GOLD:</strong> <em>maker </em>(Country) <strong>– product</strong>", with the
  // colon inside or outside the <strong>, and the private-label maker in "( * … )".
  assert.deepEqual(one(entries, 'Friis-Holm', 'Johe 70%'),
    { level: 'bronze', level_raw: 'BRONZE', maker: 'Friis-Holm', country: 'Denmark', product: 'Johe 70%',
      score: null, flags: [], private_label_maker: 'Bonnat, France',
      category: 'Bars – Dark plain/origin bars', group: 'BARS', special: [] });

  // This page's group headings are <h1>BARS</h1> and, later, <h2>Spreads</h2> — both with
  // <h4> categories, so the nesting and not the heading number decides which is which.
  assert.equal(one(entries, 'Guido Castagna', 'Crema di nocciole + 55').group, 'Spreads');
  assert.equal(one(entries, 'Guido Castagna', 'Crema di nocciole + 55').category, 'Spreads with dark chocolate');

  // 2014 prints an award block as one product header followed by "– GOLD – Qualifier"
  // bullets, rather than 2012's one full row per award; both join the same way.
  assert.deepEqual(one(entries, 'Pacari Chocolate', 'Montubia 70%').special, [
    'Special Category awards: GOLD – Chocolate Maker',
    'Special Category awards: GOLD – Growing Country',
    'Special Category awards: GOLD – Organic',
    'Special Category awards: GOLD – Directly Traded',
  ]);
  assert.deepEqual(one(entries, 'Friis-Holm', 'Dark Milk 65%').special,
    ['Special category awards: GOLD – Directly Traded']);
});

test('Américas 2013: countries, the National awards join, and the rows it cannot join', () => {
  const { entries, skipped } = ica2012.parse(fx('ica-am-2013.html'), {});
  assert.equal(entries.length, 42);
  assert.deepEqual(levels(entries), { gold: 11, silver: 31 });
  // Every medal row prints its country, and Brazil is not among them: no Brazilian maker
  // placed in the 2013 Américas semi-final.
  assert.ok(entries.every((e) => e.country));
  assert.deepEqual([...new Set(entries.map((e) => e.country))].sort(),
    ['Ecuador', 'Grenada', 'Japan', 'United States', 'Venezuela']);

  // A group headed <h3> between <h2> groups: nesting keeps it a group, not a category.
  const white = one(entries, 'Chocolopolis', 'Lemon Lavender Truffle');
  assert.equal(white.group, 'Filled chocolates – White (flavoured or unflavoured)');
  assert.equal(white.category, 'White – Flavoured filled chocolates');

  // A National award qualifies the medal the same product won — including the row the
  // page prints with an unspaced hyphen, "GOLD-USA:".
  assert.deepEqual(one(entries, 'Patric Chocolate', 'Madagascar 67%').special, ['National awards: GOLD – USA']);
  assert.deepEqual(one(entries, 'Theo Chocolate', 'Mint Ganache').special, ['National awards: GOLD – USA']);
  // A qualifier on a medal row itself stays on that entry rather than opening a new one.
  assert.deepEqual(one(entries, 'Es Koyama', 'Manganji-Temple Green Pepper & Almond Praline').special, ['GOLD – FILLED']);

  // Ten National awards name a product that won no medal in its category, so there is no
  // entry to qualify; they are quarantined rather than counted as medals of their own.
  const unjoined = skipped.filter((s) => s.reason === 'unjoined-block-row');
  assert.equal(unjoined.length, 10);
  assert.ok(unjoined.every((s) => s.block === 'National awards'));
  assert.ok(unjoined.some((s) => s.raw === 'SILVER – USA: Tejas Chocolate – Capistrano'), JSON.stringify(unjoined));
});

test('Américas 2013: the finalist sections are quarantined, never dropped and never entries', () => {
  const { entries, skipped } = ica2012.parse(fx('ica-am-2013.html'), {});
  // The two finalist sections print 14 "maker (Country) – product" nominations with no
  // level word, plus one line of explanatory prose each. This era's results pages link to
  // no finalists page, so `ica-finalists.js` cannot recover the 14: they must not vanish.
  const finalists = skipped.filter((s) => s.reason === 'unlevelled-finalist-row');
  assert.equal(finalists.length, 14);
  assert.equal(skipped.length, 24);                       // + the 10 unjoined National awards
  assert.deepEqual([...new Set(finalists.map((s) => s.block))].sort(),
    ['Additional World Finalists', 'World Finalists']);
  assert.ok(finalists.some((s) => s.raw === 'Payard (United States) – Chocolat Chocolat'), JSON.stringify(finalists));
  // The prose that opens each section has no maker/product body, so it is not a row.
  assert.ok(finalists.every((s) => !/nominated to go forward/.test(s.raw)));
  // A nomination is not a medal: none of the 14 reaches `entries`.
  assert.ok(!entries.some((e) => e.maker === 'Amazona Chocolate' || e.maker === 'Socola Chocolatier'));
});

// No fixture prints a malformed row inside an award block, so the shape needs markup
// built on purpose: without the guard the header fallback swallows it silently.
test('a level run an award block cannot read is quarantined, not taken for a product header', () => {
  const { entries, skipped } = ica2012.parse(
    '<h2>Bars</h2><h4>Bars – Dark plain/origin bars</h4>'
    + '<p>GOLD: Pacari Chocolate (Ecuador) – Montubia 70%</p>'
    + '<p><span style="text-decoration: underline;">Special awards</span></p>'
    + '<p>GOLD – Chocolate Maker Pacari Chocolate (Ecuador) – Montubia 70%</p>'   // no colon
    + '<p>– GOLD – Organic</p>', {});
  // The malformed row is quarantined, so it never becomes the header the bullet hangs on;
  // the orphaned bullet is quarantined in turn rather than joined to the wrong product.
  assert.deepEqual(skipped, [
    { raw: 'GOLD – Chocolate Maker Pacari Chocolate (Ecuador) – Montubia 70%', reason: 'unparsed-run' },
    { raw: '– GOLD – Organic', reason: 'unparsed-run' },
  ]);
  assert.deepEqual(entries.map((e) => [e.level, e.maker, e.product, e.special]),
    [['gold', 'Pacari Chocolate', 'Montubia 70%', []]]);
});
