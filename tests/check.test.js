const test = require('node:test');
const assert = require('node:assert/strict');
const { runCheck, resolveBrand } = require('../data/tools/check.js');

const brands = { brands: { nugali: { name: 'Nugali Chocolates', aliases: ['Nugali'] }, monjolo: { name: 'Monjolo Chocolates', aliases: [] }, alma: { name: 'Alma Chocolates', aliases: [] }, mendoa: { name: 'Mendoá Chocolate', aliases: [] } }, excluded: { 'Feitoria do Cacao': 'Portugal' } };
const file = (competition, entries) => ({ competition, slug: 'x', entries: entries.map((e) => ({ level: 'bronze', product: 'p', ...e })) });

test('resolveBrand matches name key and alias key exactly', () => {
  assert.equal(resolveBrand('MONJOLO CHOCOLATES', brands), 'monjolo');
  assert.equal(resolveBrand('Nugali', brands), 'nugali');
  assert.equal(resolveBrand('Mendoá Chocolates', brands), null);
});
test('lists: unmapped Brazilian (ICA), drift by containment, AoC hints, dead aliases', () => {
  const files = [
    file('ica-americas', [{ maker: 'DoSemente Cacau', country: 'Brazil' }, { maker: 'Mendoá Chocolates', country: 'Brazil' }]),
    file('aoc', [{ maker: 'Feitoria do Cacao', country: null, product: 'Chocolate de Leite' }, { maker: 'Corumbau Cacau', country: null, product: '55% Cacau ao Leite com Cupuaçu' }, { maker: 'MONJOLO CHOCOLATES', country: null }]),
  ];
  const r = runCheck({ files, brands });
  assert.deepEqual(r.unmapped.map((u) => u.maker), ['DoSemente Cacau']);
  assert.deepEqual(r.drift.map((d) => [d.maker, d.brand]), [['Mendoá Chocolates', 'mendoa']]);
  assert.deepEqual(r.hints.map((h) => h.maker), ['Corumbau Cacau']);
  assert.deepEqual(r.dead, [{ brand: 'nugali', alias: 'Nugali' }]);
});
