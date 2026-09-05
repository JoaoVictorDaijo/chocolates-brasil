'use strict';

const { LEVELS } = require('./levels.js');
const { key } = require('./key.js');

const COMPETITIONS = ['ica-world', 'ica-americas', 'aoc', 'avpa'];
const METHODS = ['parser', 'manual-transcription'];

/** Identity of a row for duplicate detection: same award to the same product in the same category. */
function entryKey(e) { return `${e.level}|${key(e.category || '')}|${key(e.maker)}|${key(e.product)}`; }

/**
 * Checks an award file against the schema of
 * docs/superpowers/specs/2026-09-04-canonical-awards-data-design.md §3.
 * Returns every problem found as a message; an empty array means valid. Fields
 * beyond the schema are left alone, so a source may carry its own extras.
 * What a failure costs — quarantining one file or aborting the run — is the caller's call.
 */
function validateAwardFile(f) {
  const errs = [];
  if (!f || typeof f !== 'object') return ['file: not an object'];
  if (!COMPETITIONS.includes(f.competition)) errs.push(`competition: unknown "${f.competition}"`);
  if (typeof f.slug !== 'string' || !f.slug) errs.push('slug: missing');
  if (!Number.isInteger(f.year)) errs.push(`year: not an integer (${JSON.stringify(f.year)})`);
  if (typeof f.edition !== 'string' || !f.edition) errs.push('edition: missing');
  const s = f.source || {};
  for (const k of ['url', 'snapshot', 'fetched']) if (typeof s[k] !== 'string' || !s[k]) errs.push(`source.${k}: missing`);
  if (!METHODS.includes(s.method)) errs.push(`source.method: unknown "${s.method}"`);
  if (!Array.isArray(f.entries)) return errs.concat(['entries: not an array']);
  if (f.entries.length === 0) errs.push('entries: zero entries');
  const seen = new Set();
  f.entries.forEach((e, i) => {
    const at = `entries[${i}]`;
    if (!LEVELS[e.level]) errs.push(`${at}.level: unknown "${e.level}"`);
    if (typeof e.level_raw !== 'string' || !e.level_raw) errs.push(`${at}.level_raw: missing`);
    for (const k of ['maker', 'product']) {
      if (typeof e[k] !== 'string' || !e[k].trim()) errs.push(`${at}.${k}: missing`);
      else if (!key(e[k])) errs.push(`${at}.${k}: empty key for "${e[k]}"`);
    }
    if (e.special !== undefined && !Array.isArray(e.special)) errs.push(`${at}.special: not an array`);
    if (e.flags !== undefined && !Array.isArray(e.flags)) errs.push(`${at}.flags: not an array`);
    if (e.score !== undefined && e.score !== null && typeof e.score !== 'number') errs.push(`${at}.score: not a number`);
    if (e.maker && e.product) {
      const k = entryKey(e);
      if (seen.has(k)) errs.push(`${at}: duplicate of an earlier entry (${k})`);
      seen.add(k);
    }
  });
  return errs;
}

module.exports = { validateAwardFile, entryKey, COMPETITIONS };
