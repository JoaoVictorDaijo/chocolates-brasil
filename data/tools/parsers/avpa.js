'use strict';

const { PDFParse } = require('pdf-parse');
const { clean } = require('../lib/text.js');
const { mapLevel } = require('../lib/levels.js');
const { key } = require('../lib/key.js');

/**
 * One AVPA-Paris "Chocolats élaborés à l'origine" palmarès PDF (2024 →). Every page
 * carries the same ruled table, so the header repeats once per page and every repeat
 * after the first is quarantined. AVPA prints the cocoa origin, not the maker's
 * country, so `country` stays null and the printed country goes to `origin_country`;
 * `maker` is the "Marque commerciale" column, with "Nom de la société" and
 * "Producteur" kept beside it. Wording is stored verbatim, in French. In the 2021–2023
 * PDFs the extractor finds no cell text at all (2023) or only empty cells (2021, 2022),
 * so `parse` aborts on them and those editions are hand-transcribed instead — see
 * `data/tools/transcribe-avpa.js`.
 *
 * The table extractor loses cells where a page's ruling lines are incomplete, so each
 * page's rows are checked against the medals its text layer prints (see `fillFromText`):
 * that both repairs missing medals and records what the extractor dropped.
 */

// Header cell matching key → field. Each edition prints its own header, so the map
// carries every spelling the six chocolate palmarès (2021 → 2026) publish. Columns an
// entry does not carry — the sample number ("N° Échantillon", "# choc") and the
// production region — are left unmapped, and their cells are ignored.
const COLS = {
  nomdelasociete: 'company', producteur: 'producer', marquecommerciale: 'maker',
  nomduproduit: 'product', produit: 'product', nomduchocolatsurletiquette: 'product',
  pays: 'origin_country', origine: 'origin_country', paysderecolte: 'origin_country',
  categorie: 'category', medaille: 'level',
};

function colField(h) { return COLS[key(h)] || null; }

/**
 * Every medal AVPA prints, as a pattern source: callers build their own RegExp so no
 * two of them share one `lastIndex`. The level each word maps to lives in `lib/levels.js`.
 */
const MEDAL_SOURCE = 'Gourmet Or|Gourmet Argent|Gourmet Bronze|M[ée]daille Gourmet|Dipl[ôo]me Gourmet';

function medalsIn(text) { return String(text || '').match(new RegExp(MEDAL_SOURCE, 'g')) || []; }

// A special prize is printed as a trailing line inside whichever cell had room for it
// (the "Catégorie" cell in 2024); it is an extra award, never the row's medal.
const PRIX = /\s*Prix Sp[ée]cial\b.*$/;

/** True for the medal column's header cell — the one word every edition's header prints alone. */
function isMedalHeaderCell(c) { return /^m[ée]daille$/i.test(c); }

/**
 * Drops the header text a page reprinted on top of its first result row. Where the
 * ruling lines do not separate the header band from the row below it (AVPA 2024 pages
 * 5 and 7) each cell arrives as "<header>\n<value>", so stripping the header prefix
 * recovers the row. Returns null when nothing is left — a plain repeated header.
 */
function stripHeaderBand(cells, header) {
  const rest = cells.map((c, i) => (header[i] && c.startsWith(header[i]) ? clean(c.slice(header[i].length)) : c));
  return rest.some(Boolean) ? rest : null;
}

/**
 * Puts medals back on the rows they were printed for. The medal column is the one whose
 * ruling lines the AVPA PDFs lose (2024 page 5 does both): a medal ends up alone on a
 * row of its own, belonging to the row above, or two rows' medals end up stacked in one
 * cell, the extras belonging to the rows below. Both are repaired from the printed
 * reading order; rows are marked `dropped` rather than removed, so indices stay put.
 */
function realignMedals(rows, levelAt) {
  rows.forEach((row, i) => {
    if (row.reason) return;
    const filled = row.cells.filter(Boolean);
    const prev = rows[i - 1];
    if (prev && !prev.reason && !prev.cells[levelAt] && filled.length === 1
        && row.cells.length < prev.cells.length && mapLevel('avpa', filled[0])) {
      prev.cells[levelAt] = filled[0];
      row.dropped = true;
      return;
    }
    const stacked = medalsIn(row.cells[levelAt]);
    if (stacked.length < 2) return;
    row.cells[levelAt] = stacked[0];
    stacked.slice(1).forEach((medal, k) => {
      const below = rows[i + 1 + k];
      if (below && !below.reason && !below.cells[levelAt]) below.cells[levelAt] = medal;
    });
  });
}

/**
 * Checks each page's result rows against the medals its text layer prints, in reading
 * order. When the two agree the text supplies any medal the table extractor dropped
 * (AVPA 2024 pages 5 and 7 lose the medal cell of the rows nearest the page foot).
 * When they do not, the extractor lost a whole row (2024 page 1) or the orders disagree:
 * nothing is filled and the page is reported, so the loss is never silent.
 */
function fillFromText(rows, pages, levelAt) {
  const notes = [];
  for (const page of pages) {
    if (typeof page.text !== 'string') continue;
    const medals = medalsIn(page.text);
    const data = rows.filter((r) => r.page === page && !r.reason && !r.dropped);
    const aligned = data.length === medals.length
      && data.every((r, i) => !r.cells[levelAt] || r.cells[levelAt] === medals[i]);
    if (!aligned) {
      notes.push({ raw: `page ${page.num}: ${data.length} table rows for ${medals.length} printed medals`, reason: 'page-rows-incomplete' });
      continue;
    }
    data.forEach((r, i) => { if (!r.cells[levelAt]) r.cells[levelAt] = medals[i]; });
  }
  return notes;
}

/**
 * Turns the pages of one palmarès — `{ num, tables, text }`, as `getTable()` and
 * `getText()` return them — into entries. Rows that cannot be read as a result — a
 * reprinted header, a blank medal, maker or product — are quarantined so one unreadable
 * row never loses an edition; a medal word or a header the parser does not know aborts,
 * because guessing there would silently change what AVPA published.
 */
function parsePages(pages) {
  const all = [];
  for (const page of pages) {
    for (const table of page.tables || []) {
      for (const row of table) {
        const cells = row.map((c) => clean(String(c || '')));
        if (cells.some(Boolean)) all.push({ cells, page });
      }
    }
  }

  const headerAt = all.findIndex((r) => r.cells.some(isMedalHeaderCell));
  if (headerAt < 0) throw new Error('AVPA PDF: no table header found (use manual transcription)');
  const header = all[headerAt].cells;
  const fields = header.map(colField);
  if (!fields.includes('maker') || !fields.includes('level') || !fields.includes('product')) {
    throw new Error(`AVPA header not understood: ${header.join(' | ')}`);
  }
  const levelAt = fields.indexOf('level');

  // dropping the header keeps every earlier row at its index, so `i < headerAt` still
  // names the rows a page printed above it
  const rows = all.filter((_, i) => i !== headerAt);
  rows.forEach((row, i) => {
    if (i < headerAt) { row.reason = 'before-header'; return; }
    if (!row.cells.some(isMedalHeaderCell)) return;
    const rest = stripHeaderBand(row.cells, header);
    if (rest) row.cells = rest;
    else row.reason = 'repeated-header';
  });
  realignMedals(rows, levelAt);
  const skipped = fillFromText(rows, pages, levelAt);

  const entries = [];
  for (const row of rows) {
    if (row.dropped) continue;
    if (row.reason) { skipped.push({ raw: row.cells.join(' | '), reason: row.reason }); continue; }
    const read = readRow(row.cells, fields);
    if (read.reason) skipped.push({ raw: row.cells.join(' | '), reason: read.reason });
    else entries.push(read.entry);
  }
  return { entries, skipped, header };
}

/** One row → `{ entry }`, or `{ reason }` when it cannot be read as a result. */
function readRow(cells, fields) {
  const special = [];
  const values = cells.map((c) => {
    const m = c.match(PRIX);
    if (!m) return c;
    special.push(clean(m[0]));
    return clean(c.slice(0, m.index));
  });
  const row = {};
  values.forEach((c, i) => { if (fields[i]) row[fields[i]] = c; });
  const levelRaw = row.level || '';
  if (!levelRaw) return { reason: 'blank-level' };
  if (!row.maker) return { reason: 'blank-maker' };
  if (!row.product) return { reason: 'blank-product' };
  const level = mapLevel('avpa', levelRaw);
  if (!level) throw new Error(`unknown AVPA medal "${levelRaw}" in row: ${cells.join(' | ')}`);
  return {
    entry: {
      level,
      level_raw: levelRaw,
      maker: row.maker,
      company: row.company || null,
      producer: row.producer || null,
      country: null,
      origin_country: row.origin_country || null,
      product: row.product,
      category: row.category || null,
      group: null,
      score: null,
      special,
      flags: [],
      private_label_maker: null,
    },
  };
}

async function parse(buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const tables = await parser.getTable();
    const text = await parser.getText();
    const byNum = new Map((text.pages || []).map((p) => [p.num, p.text]));
    return parsePages((tables.pages || []).map((p) => ({ num: p.num, tables: p.tables || [], text: byNum.get(p.num) })));
  } finally {
    await parser.destroy();
  }
}

module.exports = { parse, parsePages, colField, MEDAL_SOURCE };
