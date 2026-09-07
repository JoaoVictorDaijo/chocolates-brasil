'use strict';

/**
 * The boundary between the canonical dataset and the site: turns
 * `data/awards/<competition>/<slug>.json` plus `data/brands.json` into the award
 * objects `gerar.js` renders, and carries the placement, badge and date helpers
 * that read them. Nothing under `data/` may require this module.
 */

const fs = require('fs');
const path = require('path');
const { key } = require('./data/tools/lib/key.js');
const { LEVELS } = require('./data/tools/lib/levels.js');
const { validateAwardFile } = require('./data/tools/lib/schema.js');

const COMP_LABEL_PT = { 'ica-world': 'ICA Mundial', 'ica-americas': 'ICA Américas', 'aoc': 'Academy of Chocolate', 'avpa': 'AVPA Paris' };
const LEVEL_LABEL_PT = { gold: 'Ouro', silver: 'Prata', bronze: 'Bronze', 'top-gold': 'Top Gold', commended: 'Menção', trophy: 'Troféu', recognition: 'Reconhecimento', finalist: 'Finalista', 'gourmet-gold': 'Gourmet Ouro', 'gourmet-silver': 'Gourmet Prata', 'gourmet-bronze': 'Gourmet Bronze', 'gourmet-medal': 'Medalha Gourmet', 'gourmet-diploma': 'Diploma Gourmet' };
const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

function formatDatePt(iso) { const [y, m, d] = iso.split('-').map(Number); return `${d} de ${MONTHS[m - 1]} de ${y}`; }

const SEASON = /^\d{4}-\d{2}$/;

/**
 * The edition label the site prints: `YYYY/YY` for a season spanning two years,
 * the year otherwise. An edition named in prose ("2022 Second Phase") belongs to
 * its year, which is also how the audit and the curated cards label it.
 */
function editionLabel(f) { return SEASON.test(f.edition) ? f.edition.replace('-', '/') : String(f.year); }

/**
 * Every award file, validated. A file that fails the schema aborts the load, so a
 * malformed row can never reach the site unnoticed. `*.draft.json` is work in
 * progress and is never read.
 */
function readFiles(dataDir) {
  const files = [];
  const base = path.join(dataDir, 'awards');
  for (const comp of fs.readdirSync(base)) for (const fn of fs.readdirSync(path.join(base, comp)).sort()) {
    if (!fn.endsWith('.json') || fn.endsWith('.draft.json')) continue;
    const f = JSON.parse(fs.readFileSync(path.join(base, comp, fn), 'utf8'));
    const errs = validateAwardFile(f);
    if (errs.length) throw new Error(`${comp}/${fn}: ${errs.slice(0, 3).join('; ')}`);
    files.push(f);
  }
  return files.sort((a, b) => a.competition.localeCompare(b.competition) || b.year - a.year);
}

/**
 * Every spelling that resolves to a brand — its name and its aliases — as key → brandId.
 * Two brands claiming one spelling abort: the rows would silently land on whichever
 * brand was read last.
 */
function brandKeys(brands) {
  const keys = new Map();
  for (const [id, b] of Object.entries(brands.brands)) for (const spelling of [b.name, ...(b.aliases || [])]) {
    const k = key(spelling);
    const prev = keys.get(k);
    if (prev && prev !== id) throw new Error(`brands.json: "${spelling}" maps to both "${prev}" and "${id}"`);
    keys.set(k, id);
  }
  return keys;
}

/**
 * The awards of every brand, keyed by brand id, plus the newest `source.fetched`
 * of the dataset — the date the site prints as its own. A maker that resolves to
 * no brand is not on the site and is skipped.
 */
function loadAwards({ dataDir = path.join(__dirname, 'data') } = {}) {
  const brands = JSON.parse(fs.readFileSync(path.join(dataDir, 'brands.json'), 'utf8'));
  const keys = brandKeys(brands);
  const sig = new Map(Object.entries(brands.brands).map(([id, b]) => [id, new Set((b.signature || []).map(key))]));
  const files = readFiles(dataDir);
  const byBrand = new Map(Object.keys(brands.brands).map((id) => [id, []]));
  let fetchedMax = '0000-00-00';
  for (const f of files) {
    if (f.source.fetched > fetchedMax) fetchedMax = f.source.fetched;
    const y = editionLabel(f);
    for (const e of f.entries) {
      const id = keys.get(key(e.maker)); if (!id) continue;
      byBrand.get(id).push({ c: COMP_LABEL_PT[f.competition], y, l: LEVEL_LABEL_PT[e.level], p: e.product, star: sig.get(id).has(key(e.product)), canonical: true, scored: LEVELS[e.level].scored, level: e.level });
    }
  }
  return { byBrand, fetchedMax, files, brands };
}

const PLACES = (a) => a.level && LEVELS[a.level] && LEVELS[a.level].places;

/**
 * The section a card belongs to, strongest competition first: ICA Mundial (S1N1),
 * ICA Américas (S1N2), Academy of Chocolate (S2), AVPA (S3), national only (S4).
 * ICA and AoC move a card up only on a placing award — a finalist or a commendation
 * does not; AVPA counts any level.
 */
function placeBrand(awards) {
  const has = (re, any) => awards.some((a) => re.test(a.c) && (any || PLACES(a)));
  if (has(/ICA Mundial/)) return 'S1N1';
  if (has(/ICA Américas/)) return 'S1N2';
  if (has(/Academy of Chocolate/)) return 'S2';
  if (has(/AVPA/, true)) return 'S3';
  return 'S4';
}

/** `oficial` when the card declares itself official, or carries awards and every one is canonical. */
function badgeFor(card, awards) {
  if (card.src === 'oficial') return 'oficial';
  return awards.length && awards.every((a) => a.canonical) ? 'oficial' : 'imprensa';
}

module.exports = { loadAwards, placeBrand, badgeFor, formatDatePt, COMP_LABEL_PT, LEVEL_LABEL_PT };
