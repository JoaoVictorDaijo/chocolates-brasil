const test = require('node:test');
const assert = require('node:assert/strict');
const { exportAudit } = require('../data/tools/export-audit.js');

test('exportAudit keeps only the four canonical competitions and numbers duplicates', () => {
  const marcas = [{ name: 'Nugali Chocolates', awards: [
    { c: 'ICA Américas', y: '2026', l: 'Bronze', p: 'Ao Leite 45%' },
    { c: 'ICA Américas', y: '2026', l: 'Bronze', p: 'Drágea de Nibs de Cacau' },
    { c: 'ICA Mundial', y: '2020/21', l: 'Prata', p: 'x' },
    { c: 'Bean to Bar Brasil', y: '2025', l: 'Ouro', p: 'ignored' },
    { c: 'AVPA Paris', y: '2026', l: 'Diploma Gourmet', p: 'y' },
  ] }];
  const rows = exportAudit(marcas);
  assert.deepEqual(rows, [
    { brand: 'Nugali Chocolates', competition: 'ica-americas', edition: '2026', level: 'bronze', n: 1, p: 'Ao Leite 45%' },
    { brand: 'Nugali Chocolates', competition: 'ica-americas', edition: '2026', level: 'bronze', n: 2, p: 'Drágea de Nibs de Cacau' },
    { brand: 'Nugali Chocolates', competition: 'ica-world', edition: '2020-21', level: 'silver', n: 1, p: 'x' },
    { brand: 'Nugali Chocolates', competition: 'avpa', edition: '2026', level: 'gourmet-diploma', n: 1, p: 'y' },
  ]);
});
