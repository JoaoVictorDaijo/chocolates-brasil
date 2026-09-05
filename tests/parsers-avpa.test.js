// Fixtures (en.avpa.fr/_files/ugd/58172f_<hash>.pdf, downloaded 2026-09-05) — the
// palmarès of the "Chocolats élaborés à l'origine" contest, one ruled table per page:
// avpa-2024.pdf  58172f_0e02fe2ebf174cd980c4f9793a2c03b3  7 pages, 98 table rows
// avpa-2026.pdf  58172f_7e2fec46cd1441f8b6d6f49eccc88689  12 pages, 141 table rows

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const avpa = require('../data/tools/parsers/avpa.js');
const { draft } = require('../data/tools/transcribe-avpa.js');
const { validateAwardFile } = require('../data/tools/lib/schema.js');
const fx = (n) => fs.readFileSync(path.join(__dirname, 'fixtures', n));
const award = (y) => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'awards', 'avpa', `${y}.json`), 'utf8'));

test('2026: 129 entries, the 11 reprinted headers skipped, Brazilian rows mapped by Marque commerciale', async () => {
  const { entries, skipped } = await avpa.parse(fx('avpa-2026.pdf'));
  assert.deepEqual(skipped.map((s) => s.reason), Array(11).fill('repeated-header'));
  assert.equal(entries.length, 129);
  const kae = entries.filter((e) => e.maker === 'Kaê Chocolates');
  assert.equal(kae.length, 6);
  assert.ok(kae.some((e) => e.product === '37% Caipira' && e.level === 'gourmet-gold' && e.origin_country === 'Brésil'));
  const selah = entries.find((e) => /Selah/.test(e.company));
  assert.equal(selah.level, 'gourmet-diploma');
  assert.equal(selah.producer, 'Pedro Henrique Goulart Rezende');
});

test('2026: the header names the columns and the entry carries the shared shape', async () => {
  const { entries, header } = await avpa.parse(fx('avpa-2026.pdf'));
  assert.deepEqual(header, ['Nom De la Société', 'Producteur', 'Marque Commerciale', 'Nom du produit', 'Origine', 'Catégorie', 'Médaille']);
  assert.deepEqual(entries.find((e) => e.product === '37% Caipira'), {
    level: 'gourmet-gold',
    level_raw: 'Gourmet Or',
    maker: 'Kaê Chocolates',
    company: 'Kaê Chocolates',
    producer: 'Jorge Klotz',
    country: null,
    origin_country: 'Brésil',
    product: '37% Caipira',
    category: 'Chocolat blanc fantaisie avec autres ingrédients',
    group: null,
    score: null,
    special: [],
    flags: [],
    private_label_maker: null,
  });
});

test('2024: Prix Spécial goes to special, level stays Gourmet', async () => {
  const { entries } = await avpa.parse(fx('avpa-2024.pdf'));
  const ps = entries.filter((e) => e.special.some((s) => /Prix Sp/.test(s)));
  assert.equal(ps.length, 3);
  assert.ok(ps.every((e) => e.level.startsWith('gourmet')));
  const danke = entries.filter((e) => e.maker === 'Danke Cacau');
  assert.equal(danke.length, 2);
});

test('2024: the Prix Spécial is lifted out of the category cell it was printed in', async () => {
  const { entries } = await avpa.parse(fx('avpa-2024.pdf'));
  const ayitika = entries.find((e) => e.maker === 'Ayitika');
  assert.deepEqual(ayitika.special, ['Prix Spécial Chloé Doutre Roussel']);
  assert.equal(ayitika.category, 'Chocolats Noirs Sans Adjuvants % De Cacao < 75%');
  assert.equal(ayitika.level, 'gourmet-silver');
});

test('2024: a page whose header banner ran into the first row keeps that row', async () => {
  const { entries, skipped } = await avpa.parse(fx('avpa-2024.pdf'));
  assert.equal(entries.length, 92);
  assert.equal(skipped.filter((s) => s.reason === 'repeated-header').length, 3);
  assert.ok(!skipped.some((s) => /Maison Mandjou|Diraja/.test(s.raw)));
  const mayak = entries.find((e) => e.maker === 'Mayak Chocolate');
  assert.equal(mayak.level, 'gourmet-medal');
  const mandjou = entries.find((e) => e.maker === 'Maison Mandjou');
  assert.equal(mandjou.product, 'Manroblé De Samory');
  assert.equal(mandjou.level, 'gourmet-medal');
  assert.equal(mandjou.origin_country, "Cote D'ivoire");
  const diraja = entries.find((e) => e.product === 'Diraja 99% Dark Chocolate');
  assert.equal(diraja.maker, 'Diraja Chocolate');
  assert.equal(diraja.company, 'Taiwan Cocoa And Chocolate Industry Association');
  assert.equal(diraja.level, 'gourmet-medal');
});

test('2024: the one row the table extractor never produced is reported', async () => {
  const { skipped } = await avpa.parse(fx('avpa-2024.pdf'));
  assert.deepEqual(skipped.filter((s) => s.reason === 'page-rows-incomplete'), [
    { raw: 'page 1: 13 table rows for 14 printed medals', reason: 'page-rows-incomplete' },
  ]);
});

test('every 2024 and 2026 entry has a known level and a maker, and no maker country', async () => {
  for (const name of ['avpa-2024.pdf', 'avpa-2026.pdf']) {
    const { entries } = await avpa.parse(fx(name));
    assert.ok(entries.every((e) => e.level.startsWith('gourmet')), name);
    assert.ok(entries.every((e) => e.maker && e.product && e.level_raw), name);
    assert.ok(entries.every((e) => e.country === null), name);
  }
});

test('the column map reads each published header spelling', () => {
  assert.equal(avpa.colField('Marque\nCommerciale'), 'maker');
  assert.equal(avpa.colField('MEDAILLE'), 'level');
  assert.equal(avpa.colField('Nom du chocolat sur l’étiquette'), 'product');
  assert.equal(avpa.colField('Pays de récolte'), 'origin_country');
  assert.equal(avpa.colField('Prix'), null);
  // columns an entry does not carry
  assert.equal(avpa.colField('N° Échantillon'), null);
  assert.equal(avpa.colField('Région'), null);
});

const HEAD = ['Marque Commerciale', 'Produit', 'Pays', 'Médaille'];
// One page of table rows, as `parsePages` takes them. Without `text` there is nothing
// to cross-check the page against, so the rows are read exactly as the table gives them.
const PAGES = (rows, text) => avpa.parsePages([{ num: 1, tables: [rows], text }]);

test('blank level, blank maker and blank product rows are quarantined, not dropped', () => {
  const { entries, skipped } = PAGES([
    HEAD,
    ['Maker', 'Product', 'Brésil', ''],
    ['', 'Product', 'Brésil', 'Gourmet Or'],
    ['Maker', '', 'Brésil', 'Gourmet Or'],
  ]);
  assert.equal(entries.length, 0);
  assert.deepEqual(skipped, [
    { raw: 'Maker | Product | Brésil | ', reason: 'blank-level' },
    { raw: ' | Product | Brésil | Gourmet Or', reason: 'blank-maker' },
    { raw: 'Maker |  | Brésil | Gourmet Or', reason: 'blank-product' },
  ]);
});

test('a row printed before the first header is quarantined', () => {
  const { entries, skipped } = PAGES([['Palmarès', '', '', ''], HEAD, ['Maker', 'Product', 'Brésil', 'Gourmet Or']]);
  assert.equal(entries.length, 1);
  assert.deepEqual(skipped, [{ raw: 'Palmarès |  |  | ', reason: 'before-header' }]);
});

test('a medal the PDF split into its own row completes the row above', () => {
  const { entries, skipped } = PAGES([HEAD, ['Maker', 'Product', 'Brésil', ''], ['Gourmet Bronze']]);
  assert.deepEqual(skipped, []);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].level, 'gourmet-bronze');
  assert.equal(entries[0].level_raw, 'Gourmet Bronze');
});

test('the page text supplies a medal the table extractor dropped', () => {
  const rows = [HEAD, ['Maker', 'Product', 'Brésil', 'Gourmet Or'], ['Other', 'Thing', 'Pérou', '']];
  const text = 'Marque Commerciale Produit Pays Médaille\nMaker Product Brésil Gourmet Or\nOther Thing Pérou Gourmet Bronze';
  const { entries, skipped } = PAGES(rows, text);
  assert.deepEqual(skipped, []);
  assert.deepEqual(entries.map((e) => e.level_raw), ['Gourmet Or', 'Gourmet Bronze']);
});

test('a page whose rows and printed medals disagree is reported, and nothing is filled', () => {
  const rows = [HEAD, ['Maker', 'Product', 'Brésil', 'Gourmet Or'], ['Other', 'Thing', 'Pérou', '']];
  const text = 'Maker Product Brésil Gourmet Or';                  // the second row never made it
  const { entries, skipped } = PAGES(rows, text);
  assert.equal(entries.length, 1);
  assert.deepEqual(skipped, [
    { raw: 'page 1: 2 table rows for 1 printed medals', reason: 'page-rows-incomplete' },
    { raw: 'Other | Thing | Pérou | ', reason: 'blank-level' },
  ]);
});

test('tables with no header at all abort loudly', () => {
  assert.throws(() => PAGES([['Palmarès 2026', '', '']]), /no table header/);
});

test('a header the column map cannot read aborts loudly', () => {
  assert.throws(() => PAGES([['Colonne A', 'Colonne B', 'Médaille']]), /header not understood/);
});

test('an unknown medal word aborts loudly', () => {
  assert.throws(() => PAGES([HEAD, ['Maker', 'Product', 'Brésil', 'Platine']]), /unknown AVPA medal "Platine"/);
});

// The 2021-2023 palmarès carry no table a parser can read, so they are transcribed by
// hand from the PDFs (data/tools/transcribe-avpa.js drafts them). These pin what the
// audit of 2026-09-05 read off the printed pages.
test('the hand-transcribed 2021-2023 editions are valid, complete and snapshotted', () => {
  for (const [year, count] of [[2021, 81], [2022, 51], [2023, 69]]) {
    const f = award(year);
    assert.deepEqual(validateAwardFile(f), [], `${year}`);
    assert.equal(f.entries.length, count, `${year}`);
    assert.equal(f.source.method, 'manual-transcription', `${year}`);
    assert.ok(fs.existsSync(path.join(__dirname, '..', f.source.snapshot)), `${year} snapshot`);
    assert.ok(f.entries.every((e) => e.country === null && e.level.startsWith('gourmet')), `${year}`);
  }
});

test('the transcribed editions carry the Brazilian rows the audit found', () => {
  const br = (y) => award(y).entries.filter((e) => e.origin_country === 'Brésil')
    .map((e) => [e.maker, e.product, e.level]);
  assert.deepEqual(br(2021), [
    ['Chor Chocolate de Origem', 'Bahia Terra da Felicidade', 'gourmet-bronze'],
    ['Chor Chocolate de Origem', 'Oro Negro', 'gourmet-diploma'],
    ['Chor Chocolate de Origem', 'Terra de Santa Cruz', 'gourmet-diploma'],
  ]);
  assert.deepEqual(br(2022), [['Chor Chocolate de Origem', 'Terra de Santa Cruz', 'gourmet-diploma']]);
  assert.deepEqual(br(2023), []);
});

test('the transcription helper splits a text dump on the medal words and keeps the raw chunk', () => {
  const dump = 'Pays Producteur Marque Médaille\nBrésil Chor Chocolate de Origem Chor Oro Negro Gourmet Bronze\n'
    + 'Pérou Barberis Barberis Bitter 70%\nDiplôme Gourmet';
  const out = draft(dump, '2021', 'https://en.avpa.fr/x.pdf');
  assert.equal(out.competition, 'avpa');
  assert.equal(out.source.method, 'manual-transcription');
  assert.deepEqual(out.entries.map((e) => [e.level, e.origin_country, e.maker]), [
    ['gourmet-bronze', 'Brésil', '??'],
    ['gourmet-diploma', 'Pérou', '??'],
  ]);
  assert.match(out.entries[1]._raw, /Barberis Bitter 70%$/);
});
