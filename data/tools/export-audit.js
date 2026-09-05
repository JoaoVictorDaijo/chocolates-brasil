#!/usr/bin/env node
// Freezes the curated awards of marcas.json (pre-migration) as the golden audit input.
const fs = require('fs');
const path = require('path');

const COMP = { 'ICA Mundial': 'ica-world', 'ICA Américas': 'ica-americas', 'Academy of Chocolate': 'aoc', 'AVPA Paris': 'avpa' };
const LEVEL = {
  'Ouro': 'gold', 'Prata': 'silver', 'Bronze': 'bronze', 'Menção': 'commended', 'Finalista': 'finalist',
  'Prêmio Especial': 'recognition', 'Gourmet Ouro': 'gourmet-gold', 'Gourmet Prata': 'gourmet-silver',
  'Gourmet Bronze': 'gourmet-bronze', 'Medalha Gourmet': 'gourmet-medal', 'Diploma Gourmet': 'gourmet-diploma',
  // Gallette's card states the level of its loose "Premiado" row in its own nota: "menção na Academy of Chocolate 2018".
  'Premiado': 'commended',
};

function exportAudit(marcas) {
  const rows = [];
  const counter = new Map();
  for (const m of marcas) {
    for (const a of m.awards || []) {
      const competition = COMP[a.c];
      if (!competition) continue;
      const level = LEVEL[a.l];
      if (!level) throw new Error(`unmapped curated level "${a.l}" on ${m.name}`);
      const edition = String(a.y).replace('/', '-');
      const k = `${m.name}|${competition}|${edition}|${level}`;
      const n = (counter.get(k) || 0) + 1;
      counter.set(k, n);
      rows.push({ brand: m.name, competition, edition, level, n, p: a.p });
    }
  }
  return rows;
}

if (require.main === module) {
  const root = path.resolve(__dirname, '..', '..');
  const marcas = JSON.parse(fs.readFileSync(path.join(root, 'marcas.json'), 'utf8'));
  const out = { exported: process.argv[2] || new Date().toISOString().slice(0, 10), rows: exportAudit(marcas) };
  const dest = path.join(root, 'tests', 'golden', 'audit-2026-09-04.json');
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, JSON.stringify(out, null, 2) + '\n');
  console.log(`${out.rows.length} audited rows → ${dest}`);
}

module.exports = { exportAudit, COMP, LEVEL };
