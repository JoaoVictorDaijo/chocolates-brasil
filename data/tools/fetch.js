#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { fetchSnapshot } = require('./lib/snapshot.js');
const { validateAwardFile, entryKey } = require('./lib/schema.js');
const { key } = require('./lib/key.js');

/**
 * Turns one entry of an edition index (`data/editions/<competition>.json`) into a
 * snapshot under `data/raw/` and a validated award file under `data/awards/`:
 *
 *     node data/tools/fetch.js <competition> <slug|--all> [--offline]
 *
 * The snapshot is what the source published; the award file is what the parser read
 * from it, and never ships unless it passes the schema of
 * docs/superpowers/specs/2026-09-04-canonical-awards-data-design.md §3. Rows the
 * parser could not read stay in `source.skipped` with the reason, so an edition is
 * never quietly short. An edition marked `manual-transcription` in the index is
 * hand-written and is left alone. A failing edition costs that edition only — the
 * others still run — and the error names the snapshot path, so a page the site will
 * not serve can be saved there by hand and read back with `--offline`.
 */

const ROOT = path.resolve(__dirname, '..');
const PARSERS = {
  'ica-new': require('./parsers/ica-new.js'),
  'ica-old': require('./parsers/ica-old.js'),
  'ica-2012': require('./parsers/ica-2012.js'),
  'aoc': require('./parsers/aoc.js'),
  'avpa': require('./parsers/avpa.js'),
};
// The 2016 Américas round was judged together with Asia Pacific and published as one
// list, so its entries are filtered by the country the page prints for each maker.
const AMERICAS = new Set(require('./americas-countries.json').map(key));
const ext = (p) => (p === 'avpa' ? 'pdf' : 'html');

async function buildAwardFile({ competition, edition, html, finalistsHtml, buffer, today }) {
  const parser = PARSERS[edition.parser];
  if (!parser) throw new Error(`unknown parser "${edition.parser}"`);
  const res = edition.parser === 'avpa' ? await parser.parse(buffer) : parser.parse(html, { finalistsHtml });
  let entries = res.entries;
  const skipped = res.skipped.slice();
  let filtered;
  if (edition.filter === 'americas-countries') {
    const before = entries.length;
    entries = entries.filter((e) => e.country && AMERICAS.has(key(e.country)));
    filtered = { rule: 'americas-countries', dropped: before - entries.length };
  }
  // A source that prints the same award twice (the Academy of Chocolate repeats a row
  // in 2023 and 2024) would fail the schema's duplicate check, which would cost the
  // whole edition; quarantining the repeat keeps the edition and records the loss.
  const seen = new Set();
  const kept = [];
  for (const e of entries) {
    if (!key(e.maker) || !key(e.product)) { skipped.push({ raw: `${e.maker} – ${e.product}`, reason: 'empty-key' }); continue; }
    const k = entryKey(e);
    if (seen.has(k)) { skipped.push({ raw: `${e.level_raw}: ${e.maker} – ${e.product} [${e.category}]`, reason: 'duplicate-row' }); continue; }
    seen.add(k);
    kept.push(e);
  }
  const file = {
    competition,
    slug: edition.slug,
    year: edition.year,
    edition: edition.edition,
    title: edition.title,
    source: {
      url: edition.url,
      ...(edition.finalists_url ? { finalists_url: edition.finalists_url } : {}),
      snapshot: `data/raw/${competition}/${edition.slug}.${ext(edition.parser)}`,
      fetched: today,
      method: 'parser',
      skipped,
      ...(filtered ? { filtered } : {}),
    },
    entries: kept,
  };
  const errs = validateAwardFile(file);
  if (errs.length) throw new Error(`${competition}/${edition.slug}: ${errs.slice(0, 5).join('; ')}`);
  return file;
}

/**
 * What a good snapshot of this source looks like, so a WAF interstitial or an error
 * page never overwrites the page already saved.
 */
function validatorFor(parser) {
  if (parser === 'avpa') return (b) => (b.subarray(0, 5).toString() === '%PDF-' ? null : 'not a PDF');
  if (parser === 'aoc') return (b) => (/<table/i.test(b.toString()) ? null : 'no table');
  return (b) => (/results-link|<strong>(Gold|Silver|Bronze)<\/strong>|<p>(GOLD|SILVER|BRONZE):/i.test(b.toString()) ? null : 'no medal rows');
}

async function fetchEdition(competition, edition, { offline }) {
  const snap = path.join(ROOT, 'raw', competition, `${edition.slug}.${ext(edition.parser)}`);
  const buf = await fetchSnapshot({ url: edition.url, dest: snap, offline, validate: validatorFor(edition.parser) });
  let finalistsHtml;
  if (edition.finalists_url) {
    const fin = await fetchSnapshot({
      url: edition.finalists_url,
      dest: path.join(ROOT, 'raw', competition, `${edition.slug}-finalists.html`),
      offline,
      validate: (b) => (/results-link/.test(b.toString()) ? null : 'no finalist rows'),
    });
    finalistsHtml = fin.toString();
  }
  const file = await buildAwardFile({ competition, edition, html: buf.toString(), finalistsHtml, buffer: buf, today: new Date().toISOString().slice(0, 10) });
  const dest = path.join(ROOT, 'awards', competition, `${edition.slug}.json`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, JSON.stringify(file, null, 2) + '\n');
  console.log(`${competition}/${edition.slug}: ${file.entries.length} entries, ${file.source.skipped.length} skipped${file.source.filtered ? `, ${file.source.filtered.dropped} filtered` : ''}`);
}

if (require.main === module) {
  const [competition, which, ...flags] = process.argv.slice(2);
  const offline = flags.includes('--offline');
  const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'editions', `${competition}.json`), 'utf8'));
  const targets = which === '--all' ? index.editions : index.editions.filter((e) => e.slug === which);
  if (!targets.length) { console.error(`no edition "${which}" in data/editions/${competition}.json`); process.exit(2); }
  (async () => {
    let failed = 0;
    for (const e of targets) {
      if (e.method === 'manual-transcription') { console.log(`${competition}/${e.slug}: manual transcription, skipping fetch`); continue; }
      try { await fetchEdition(competition, e, { offline }); } catch (err) { failed++; console.error(`FAILED ${competition}/${e.slug}: ${err.message}`); }
    }
    process.exit(failed ? 1 : 0);
  })();
}

module.exports = { buildAwardFile };
