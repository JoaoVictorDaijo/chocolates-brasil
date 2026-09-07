#!/usr/bin/env node
'use strict';

/**
 * The migration's safety net: checks that every award the curated site showed on
 * 2026-09-04 is still shown by the canonical dataset. A row that is gone must be
 * listed in `tests/golden/accepted-deltas.json` with the reason it is gone, so no
 * loss can pass unnoticed.
 */

const fs = require('fs');
const path = require('path');

const COMP = { 'ICA Mundial': 'ica-world', 'ICA Américas': 'ica-americas', 'Academy of Chocolate': 'aoc', 'AVPA Paris': 'avpa' };

/**
 * Audited rows against loaded awards, matched on (brand, competition, edition,
 * level) as a multiset: the audit's `n` is the ordinal among rows sharing that
 * key, so a brand keeps its row only while the canonical data holds at least `n`
 * of them. Products are not compared — the sources spell them differently from
 * the cards, and the audit froze the curated spelling.
 *
 * `missing` is an audited row neither present nor accepted; `stale` is an
 * accepted delta whose row is present after all, and so must be dropped.
 */
function reconcile({ audit, byBrand, brands, deltas }) {
  const idByName = new Map(Object.entries(brands.brands).map(([id, b]) => [b.name, id]));
  const have = new Map();
  for (const [id, awards] of byBrand) {
    for (const a of awards) {
      const k = `${id}|${COMP[a.c]}|${String(a.y).replace('/', '-')}|${a.level}`;
      have.set(k, (have.get(k) || 0) + 1);
    }
  }
  // A brand name that resolves to no id keys on the name itself, so an unmapped
  // maker still lines its delta up with its audited row instead of silently
  // matching every other unmapped one.
  const dk = (d) => `${idByName.get(d.brand) || d.brand}|${d.competition}|${d.edition}|${d.level}|${d.n}`;
  const accepted = new Set(deltas.map(dk));
  const missing = [];
  const stale = [];
  for (const row of audit.rows) {
    const id = idByName.get(row.brand);
    const present = row.n <= (have.get(`${id}|${row.competition}|${row.edition}|${row.level}`) || 0);
    const isAccepted = accepted.has(dk(row));
    if (!present && !isAccepted) missing.push(row);
    if (present && isAccepted) stale.push(row);
  }
  return { missing, stale };
}

if (require.main === module) {
  const root = path.resolve(__dirname, '..', '..');
  const { loadAwards } = require(path.join(root, 'awards-loader.js'));
  const audit = JSON.parse(fs.readFileSync(path.join(root, 'tests', 'golden', 'audit-2026-09-04.json'), 'utf8'));
  const deltasPath = path.join(root, 'tests', 'golden', 'accepted-deltas.json');
  const deltas = fs.existsSync(deltasPath) ? JSON.parse(fs.readFileSync(deltasPath, 'utf8')) : [];
  const { byBrand, brands } = loadAwards();
  const r = reconcile({ audit, byBrand, brands, deltas });
  console.log(`missing: ${r.missing.length}  stale: ${r.stale.length}`);
  for (const m of r.missing) console.log('  MISSING', JSON.stringify(m));
  for (const s of r.stale) console.log('  STALE  ', JSON.stringify(s));
}

module.exports = { reconcile };
