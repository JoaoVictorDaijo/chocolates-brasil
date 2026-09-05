'use strict';

const { clean, strip } = require('../lib/text.js');
const { mapLevel, icaBlock } = require('../lib/levels.js');
const { key } = require('../lib/key.js');

const DASH = '[\\u2013\\u2014-]';
// Level[ – Qualifier]: maker (Country) – product [(score)] [( * MAKER )] [(**)] [+ Level : name]*
const ENTRY = new RegExp('^\\s*([A-Za-z0-9][^:]{0,60}?)\\s*:\\s*(.+)$', 's');
const BODY = new RegExp(`^(.*?)\\s*\\(([^()]+)\\)\\s*${DASH}\\s*(.+)$`, 's');

/**
 * The award block's name for a `special` tag: the heading without the quote pair some
 * editions wrap the award name in ("‘Best in competition’ overall winners"). Only a
 * leading quote and its closing partner go; an apostrophe inside a word stays
 * ("Chocolate Tasters' Special Prizes").
 */
function blockLabel(heading) { return String(heading || '').replace(/^['\u2018\u201c"]\s*(.*?)\s*['\u2019\u201d"]/, '$1'); }

/** Splits the trailing "+ Gold : X" runs off an entry body. */
function splitTail(rest) {
  const specials = [];
  let body = rest;
  const re = /\s*\+\s*(Gold|Silver|Bronze|Special)\s*:\s*([^+]+?)\s*(?=\+\s*(?:Gold|Silver|Bronze|Special)\s*:|$)/g;
  const idx = body.search(/\s\+\s*(Gold|Silver|Bronze|Special)\s*:/);
  if (idx >= 0) {
    const tail = body.slice(idx); body = body.slice(0, idx);
    let m; while ((m = re.exec(tail))) specials.push(`+ ${m[1]}: ${clean(m[2])}`);
  }
  return { body: body.trim(), specials };
}

/** "maker (Country) – product (score) ( * MAKER ) (**)" → the entry's fields. */
function parseBody(text) {
  let t = text; const flags = []; let privateLabel = null; let score = null;
  if (/\(\*\*\)/.test(t)) { flags.push('own-chocolate'); t = t.replace(/\(\*\*\)/g, ' '); }
  const pl = t.match(/\(\s*\*\s*([^)]+?)\s*\)/); if (pl) { privateLabel = clean(pl[1]); t = t.replace(pl[0], ' '); }
  const sc = t.match(/\(\s*(\d{1,3}(?:\.\d+)?)\s*\)\s*$/); if (sc) { score = Number(sc[1]); t = t.slice(0, sc.index); }
  const m = clean(t).match(BODY);
  if (!m) return null;
  return { maker: clean(m[1]), country: clean(m[2]), product: clean(m[3]), score, flags, private_label_maker: privateLabel };
}

/**
 * The `<strong>Level</strong>:` results grammar. `<h1>` opens either a run of
 * medal categories or a standalone award block (see `ica-blocks.json`); `<h2>`
 * names the category. Award-block rows are joined onto the category entry for
 * the same maker and product, so a winner is one entry with several honours.
 */
function parseIcaStrong(html, { variant = 'new' } = {}) {
  const entries = []; const skipped = []; const groups = [];
  let group = null; let category = null; let mode = null;
  const blockRows = [];
  const parts = html.split(/(<h[12][^>]*>[\s\S]*?<\/h[12]>)/i);
  for (const part of parts) {
    const h = part.match(/^<h([12])[^>]*>([\s\S]*?)<\/h\1>$/i);
    if (h) {
      const text = clean(strip(h[2]));
      if (h[1] === '1') {
        group = text; groups.push(text);
        const kind = icaBlock(text);
        if (!kind) throw new Error(`unknown ICA <h1> block heading "${text}" — add it to data/tools/lib/ica-blocks.json`);
        mode = kind; category = null;
      } else category = text;
      continue;
    }
    if (!mode) continue;   // page chrome and editorial prose live before the first <h1>
    // runs: split on <br> or </p>; an entry starts with <strong>Level</strong>:
    for (const raw of part.split(/<br\s*\/?>|<\/p>/i)) {
      if (!/<strong>/i.test(raw)) continue;
      const text = clean(strip(raw));
      if (!text) continue;
      if (/^\+\s*(Gold|Silver|Bronze|Special)\s*:/.test(text)) {           // standalone "+ Gold : X" paragraph
        const last = mode === 'medal' ? entries[entries.length - 1] : blockRows[blockRows.length - 1];
        if (last) last.special.push(...splitTail(' ' + text).specials);
        continue;
      }
      const m = text.match(ENTRY);
      if (!m) { skipped.push({ raw: text, reason: 'unparsed-run' }); continue; }
      const label = clean(m[1]);
      const lm = label.match(new RegExp(`^(Gold|Silver|Bronze)\\s*${DASH}\\s*(.+)$`, 'i'));
      const levelWord = lm ? lm[1] : label;
      const level = mapLevel('ica', levelWord);
      if (!level) throw new Error(`unknown ICA level label "${label}" in run: ${text}`);
      const { body, specials } = splitTail(m[2]);
      const b = parseBody(body);
      if (!b) { skipped.push({ raw: text, reason: 'unparsed-body' }); continue; }
      const qualifier = lm ? `${lm[1]} – ${clean(lm[2])}` : null;
      const row = { level, level_raw: label, ...b, category, group, special: [], flags: b.flags };
      if (qualifier) row.special.push(qualifier);
      row.special.push(...specials);
      if (mode === 'medal') entries.push(row);
      else blockRows.push({ ...row, blockHeading: group, qualifier });
    }
  }
  // join non-category award blocks onto their category entry
  for (const r of blockRows) {
    const hit = entries.find((e) => key(e.maker) === key(r.maker) && key(e.product) === key(r.product));
    if (!hit) { skipped.push({ raw: `${r.level_raw}: ${r.maker} – ${r.product}`, reason: 'unjoined-block-row', block: r.blockHeading }); continue; }
    const tag = `${blockLabel(r.blockHeading)}: ${r.qualifier || r.category || r.level_raw}`;
    if (!hit.special.includes(tag)) hit.special.push(tag);
    for (const s of r.special) if (s !== r.qualifier && !hit.special.includes(s)) hit.special.push(s);
  }
  return { entries, skipped, groups };
}

module.exports = { parseIcaStrong, parseBody };
