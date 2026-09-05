const test = require('node:test');
const assert = require('node:assert/strict');
const { validateAwardFile, entryKey } = require('../data/tools/lib/schema.js');

const base = () => ({
  competition: 'aoc', slug: '2024', year: 2024, edition: '2024', title: 'AoC 2024',
  source: { url: 'https://x', snapshot: 'data/raw/aoc/2024.html', fetched: '2026-09-05', method: 'parser', skipped: [] },
  entries: [
    { level: 'bronze', level_raw: 'Bronze', maker: 'Chocoholic Thailand', product: 'Phattalung 75% Dark Chocolate', category: 'Plain Chocolate Drinks', country: null },
    { level: 'bronze', level_raw: 'Bronze', maker: 'Chocoholic Thailand', product: 'Phattalung 75% Dark Chocolate', category: 'Plain Dark Chocolate Bar', country: null },
  ],
});

test('accepts a valid file with the same product in two categories', () => {
  assert.deepEqual(validateAwardFile(base()), []);
});
test('rejects unknown level, missing maker, non-integer year, duplicate row, empty key', () => {
  let f = base(); f.entries[0].level = 'platinum';
  assert.match(validateAwardFile(f)[0], /level/);
  f = base(); delete f.entries[0].maker;
  assert.match(validateAwardFile(f)[0], /maker/);
  f = base(); f.year = '2024';
  assert.match(validateAwardFile(f)[0], /year/);
  f = base(); f.entries[1].category = 'Plain Chocolate Drinks';
  assert.match(validateAwardFile(f)[0], /duplicate/);
  f = base(); f.entries[0].product = '( )';
  assert.match(validateAwardFile(f)[0], /empty key/);
});
test('rejects zero entries', () => {
  const f = base(); f.entries = [];
  assert.match(validateAwardFile(f)[0], /zero entries/);
});
test('accepts the extra entry fields AVPA carries', () => {
  const f = base();
  Object.assign(f.entries[0], { company: 'Nugali Chocolates LTDA', producer: 'Cacauicultor Gilmar', origin_country: 'Brésil' });
  assert.deepEqual(validateAwardFile(f), []);
});
test('entryKey folds category, maker and product to matching keys', () => {
  assert.equal(
    entryKey({ level: 'gold', category: 'Plain Dark Chocolate Bar', maker: 'Cacau do Céu', product: 'Catongo 80%' }),
    'gold|plaindarkchocolatebar|cacaudoceu|catongo80',
  );
});
