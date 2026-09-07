const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { LEVELS } = require('../data/tools/lib/levels.js');
const { COMPETITIONS } = require('../data/tools/lib/schema.js');
const { loadAwards, placeBrand, badgeFor, formatDatePt, COMP_LABEL_PT, LEVEL_LABEL_PT } = require('../awards-loader.js');

const tmpDirs = [];
test.after(() => { for (const d of tmpDirs) fs.rmSync(d, { recursive: true, force: true }); });

function tmpDir() { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'ld-')); tmpDirs.push(d); return d; }
function writeAward(d, comp, fn, file) {
  fs.mkdirSync(path.join(d, 'awards', comp), { recursive: true });
  fs.writeFileSync(path.join(d, 'awards', comp, fn), JSON.stringify(file));
}
function writeBrands(d, brands) { fs.writeFileSync(path.join(d, 'brands.json'), JSON.stringify({ brands, excluded: {} })); }

function tmpData() {
  const d = tmpDir();
  fs.mkdirSync(path.join(d, 'awards', 'ica-americas'), { recursive: true });
  fs.writeFileSync(path.join(d, 'awards', 'ica-americas', '2021-22.json'), JSON.stringify({ competition: 'ica-americas', slug: '2021-22', year: 2022, edition: '2021-22', title: 't', source: { url: 'u', snapshot: 's', fetched: '2026-09-05', method: 'parser', skipped: [] }, entries: [
    { level: 'silver', level_raw: 'Silver', maker: 'Nugali', country: 'Brazil', product: 'Dragée Coffee Beans', category: 'c', special: [], flags: [] },
    { level: 'finalist', level_raw: 'Grand Jury Finalist', maker: 'Nugali', country: 'Brazil', product: 'Other', category: null, special: [], flags: [] },
    { level: 'gold', level_raw: 'Gold', maker: 'Someone Else', country: 'Peru', product: 'x', category: 'c', special: [], flags: [] },
  ] }));
  fs.writeFileSync(path.join(d, 'brands.json'), JSON.stringify({ brands: { nugali: { name: 'Nugali Chocolates', aliases: ['Nugali'], signature: ['Dragée Coffee Beans'] } }, excluded: {} }));
  return d;
}

/** An AoC edition whose label is not a season, carrying the two flags the source sets. */
function tmpAoc() {
  const d = tmpDir();
  writeAward(d, 'aoc', '2022-second-phase.json', { competition: 'aoc', slug: '2022-second-phase', year: 2022, edition: '2022 Second Phase', title: 't', source: { url: 'u', snapshot: 's', fetched: '2026-09-06', method: 'parser', skipped: [] }, entries: [
    { level: 'gold', level_raw: 'Gold', maker: 'Nugali', product: 'Growing Producer', category: 'Growing Producer', special: [], flags: ['maker-level'] },
    { level: 'bronze', level_raw: 'Bronze', maker: 'Nugali', product: '70% Bar', category: 'c', special: [], flags: ['own-chocolate'] },
  ] });
  writeBrands(d, { nugali: { name: 'Nugali Chocolates', aliases: ['Nugali'], signature: [] } });
  return d;
}

test('loader maps entries to site awards with labels, star, scored flag and edition label', () => {
  const { byBrand, fetchedMax } = loadAwards({ dataDir: tmpData() });
  const aw = byBrand.get('nugali');
  assert.deepEqual(aw[0], { c: 'ICA Américas', y: '2021/22', l: 'Prata', p: 'Dragée Coffee Beans', star: true, canonical: true, scored: true, level: 'silver' });
  assert.equal(aw[1].l, 'Finalista'); assert.equal(aw[1].scored, false); assert.equal(aw[1].star, false);
  assert.equal(fetchedMax, '2026-09-05');
  assert.equal(formatDatePt('2026-09-05'), '5 de setembro de 2026');
  assert.equal(LEVEL_LABEL_PT['gourmet-diploma'], 'Diploma Gourmet');
});
test('placement uses placing levels only; AVPA any level; national otherwise', () => {
  const A = (c, level) => ({ c, level, scored: level !== 'finalist' });
  assert.equal(placeBrand([A('ICA Mundial', 'finalist'), A('ICA Américas', 'bronze')]), 'S1N2');
  assert.equal(placeBrand([A('ICA Mundial', 'silver')]), 'S1N1');
  assert.equal(placeBrand([A('Academy of Chocolate', 'commended')]), 'S4');
  assert.equal(placeBrand([A('Academy of Chocolate', 'top-gold')]), 'S2');
  assert.equal(placeBrand([A('AVPA Paris', 'gourmet-diploma')]), 'S3');
  assert.equal(placeBrand([{ c: 'Bean to Bar Brasil', level: null, scored: true }]), 'S4');
});
test('badge: oficial only when every award is canonical or src is oficial', () => {
  assert.equal(badgeFor({ src: 'imprensa' }, [{ canonical: true }, { canonical: false }]), 'imprensa');
  assert.equal(badgeFor({ src: 'imprensa' }, [{ canonical: true }]), 'oficial');
  assert.equal(badgeFor({ src: 'oficial' }, [{ canonical: false }]), 'oficial');
  assert.equal(badgeFor({ src: 'imprensa' }, []), 'imprensa');
});

test('an edition that is not a season is labelled by year, and flags change nothing', () => {
  const { byBrand } = loadAwards({ dataDir: tmpAoc() });
  assert.deepEqual(byBrand.get('nugali'), [
    { c: 'Academy of Chocolate', y: '2022', l: 'Ouro', p: 'Growing Producer', star: false, canonical: true, scored: true, level: 'gold' },
    { c: 'Academy of Chocolate', y: '2022', l: 'Bronze', p: '70% Bar', star: false, canonical: true, scored: true, level: 'bronze' },
  ]);
});

test('draft files are skipped before they are read', () => {
  const d = tmpAoc();
  fs.writeFileSync(path.join(d, 'awards', 'aoc', '2023.draft.json'), '{ not json');
  const { byBrand, files } = loadAwards({ dataDir: d });
  assert.equal(files.length, 1);
  assert.equal(byBrand.get('nugali').length, 2);
});

test('an award file that fails the schema throws, naming the file', () => {
  const d = tmpAoc();
  writeAward(d, 'aoc', '2024.json', { competition: 'aoc', slug: '2024', year: 2024, edition: '2024', title: 't', source: { url: 'u', snapshot: 's', fetched: '2026-09-06', method: 'parser', skipped: [] }, entries: [
    { level: 'platinum', level_raw: 'Platinum', maker: 'Nugali', product: 'p', category: 'c', special: [], flags: [] },
  ] });
  assert.throws(() => loadAwards({ dataDir: d }), /aoc\/2024\.json.*platinum/);
});

test('two brands claiming the same spelling throw', () => {
  const d = tmpAoc();
  writeBrands(d, {
    nugali: { name: 'Nugali Chocolates', aliases: ['Nugali'], signature: [] },
    'nugali-doces': { name: 'Nugali Doces', aliases: ['nugali'], signature: [] },
  });
  assert.throws(() => loadAwards({ dataDir: d }), /"nugali".*nugali-doces/);
});

test('loadAwards hands back the brands document it resolved against', () => {
  const { brands } = loadAwards({ dataDir: tmpAoc() });
  assert.equal(brands.brands.nugali.name, 'Nugali Chocolates');
  assert.deepEqual(brands.excluded, {});
});

test('every level and every competition has a Portuguese label', () => {
  assert.deepEqual(Object.keys(LEVEL_LABEL_PT).sort(), Object.keys(LEVELS).sort());
  assert.deepEqual(Object.keys(COMP_LABEL_PT).sort(), [...COMPETITIONS].sort());
});
