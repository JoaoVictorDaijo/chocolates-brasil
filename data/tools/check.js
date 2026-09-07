#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { key } = require('./lib/key.js');

/**
 * Health check of the maker → brand mapping (`data/brands.json`) against every
 * award file under `data/awards/`:
 *
 *     node data/tools/check.js
 *
 * Prints four lists and exits 1 when either of the first two is non-empty, so a
 * Brazilian maker can never reach the site unmapped and an official spelling can
 * never drift away from the brand that owns it:
 *
 *   1. unmapped — a Brazilian maker (ICA `country === 'Brazil'`) with no brand and
 *      no `excluded` entry. Fix by adding an alias, a card, or an `excluded` reason.
 *   2. drift — an unmatched maker whose key contains, or is contained by, a brand
 *      key. Fix by adding the alias to that brand, or by excluding the maker when
 *      the containment is a coincidence between two different makers.
 *   3. hints — a maker that looks Brazilian (AVPA origin Brésil, or an AoC product
 *      named in Portuguese) but carries no country field to prove it. Advisory.
 *   4. dead — an alias no award file spells. Advisory: the mapping outlived its source.
 */

const ROOT = path.resolve(__dirname, '..');
const PT_TOKENS = ['cacau', 'ao leite', 'branco', 'intenso', 'castanha', 'cupuaçu', 'baru', 'cumaru', 'doce de leite', 'com '];

/** Every spelling that resolves to a brand — its name and its aliases — as key → brandId. */
function brandKeys(brands) {
  const map = new Map();
  for (const [id, b] of Object.entries(brands.brands)) {
    map.set(key(b.name), id);
    for (const a of b.aliases || []) map.set(key(a), id);
  }
  return map;
}

/** The brand a maker string belongs to, or null. Exact match on `key()` — never fuzzy. */
function resolveBrand(maker, brands) {
  return brandKeys(brands).get(key(maker)) || null;
}

function runCheck({ files, brands }) {
  const keys = brandKeys(brands);
  const excluded = new Set(Object.keys(brands.excluded || {}).map(key));
  const unmapped = [], drift = [], hints = [];
  const usedKeys = new Set();
  const seenUnmatched = new Set();
  for (const f of files) for (const e of f.entries) {
    const mk = key(e.maker);
    if (keys.has(mk)) { usedKeys.add(mk); continue; }
    if (excluded.has(mk)) continue;
    // One row per maker per competition: the same spelling repeats across editions.
    const id = `${f.competition}|${mk}`; if (seenUnmatched.has(id)) continue; seenUnmatched.add(id);
    const where = `${f.competition}/${f.slug}`;
    let drifted = false;
    // Short keys ("moa", "var") are substrings of unrelated names, so containment
    // only accuses spellings long enough for the overlap to mean something.
    if (mk.length >= 5) for (const [bk, brand] of keys) if (bk.length >= 5 && (mk.includes(bk) || bk.includes(mk))) { drift.push({ maker: e.maker, brand, where }); drifted = true; break; }
    if (drifted) continue;
    if (f.competition.startsWith('ica') && e.country === 'Brazil') { unmapped.push({ maker: e.maker, where }); continue; }
    if (f.competition === 'avpa' && /br[ée]sil/i.test(e.origin_country || '')) { hints.push({ maker: e.maker, where, why: 'AVPA origin Brésil' }); continue; }
    if (f.competition === 'aoc' && PT_TOKENS.some((t) => (e.product || '').toLowerCase().includes(t))) hints.push({ maker: e.maker, where, why: `product: ${e.product}` });
  }
  const dead = [];
  for (const [id, b] of Object.entries(brands.brands)) for (const a of b.aliases || []) if (!usedKeys.has(key(a))) dead.push({ brand: id, alias: a });
  return { unmapped, drift, hints, dead };
}

function loadAll() {
  const files = [];
  for (const comp of fs.readdirSync(path.join(ROOT, 'awards'))) for (const fn of fs.readdirSync(path.join(ROOT, 'awards', comp))) if (fn.endsWith('.json') && !fn.endsWith('.draft.json')) files.push(JSON.parse(fs.readFileSync(path.join(ROOT, 'awards', comp, fn), 'utf8')));
  return files;
}

if (require.main === module) {
  const brands = JSON.parse(fs.readFileSync(path.join(ROOT, 'brands.json'), 'utf8'));
  const r = runCheck({ files: loadAll(), brands });
  const show = (title, rows) => { console.log(`\n## ${title} (${rows.length})`); for (const x of rows) console.log('  ' + JSON.stringify(x)); };
  show('1. Unmapped Brazilian maker (fails)', r.unmapped); show('2. Possible spelling drift (fails)', r.drift);
  show('3. Possible Brazilian maker (hint)', r.hints); show('4. Dead alias', r.dead);
  process.exit(r.unmapped.length || r.drift.length ? 1 : 0);
}

module.exports = { runCheck, resolveBrand };
