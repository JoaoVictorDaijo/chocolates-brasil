'use strict';

const { clean, strip } = require('../lib/text.js');
const { mapLevel } = require('../lib/levels.js');
const { key } = require('../lib/key.js');
const { parseBody } = require('./ica-strong.js');

const DASH = '[\\u2013\\u2014-]';
// "GOLD: body", or "GOLD – Qualifier: body" — the level word is printed in capitals.
const RUN = new RegExp(`^(GOLD|SILVER|BRONZE)\\s*(?:${DASH}\\s*([^:]+?))?\\s*:\\s*(.+)$`);
// A block row drops the "(Country)": "maker – product". The dash has to carry spaces,
// so a hyphenated single name ("Piura-Quemazon") is never split into two fields.
const NO_COUNTRY = new RegExp(`^(.+?)\\s+${DASH}\\s+(.+)$`);
// Inside an award block 2014 prints one product header — "maker (Country) – product:" —
// followed by indented "– LEVEL – Qualifier" bullets, instead of 2012's one row per award.
const BULLET = new RegExp(`^${DASH}\\s*(GOLD|SILVER|BRONZE)\\s*${DASH}\\s*(.+)$`);
// Headings, and the underlined labels that open a sub-section inside a category.
const TOKEN = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>|<span[^>]*text-decoration:\s*underline[^>]*>([\s\S]*?)<\/span>/gi;

/**
 * The underlined sub-section labels these pages print inside a category, by matching
 * key. "Overall winners" names the plain medal run here, not the award block the
 * 2015+ pages give that `<h1>` — so this grammar needs its own vocabulary and cannot
 * reuse `icaBlock()`. The two finalist sections list nominations printed with no level
 * word, which this grammar cannot turn into entries and quarantines instead.
 */
const SECTIONS = {
  overallwinners: 'medal',
  worldfinalists: 'finalists',
  additionalworldfinalists: 'finalists',
  specialawards: 'block',
  specialcategoryawards: 'block',
  nationalawards: 'block',
};

/**
 * Group and category from the heading nesting rather than from fixed levels: these
 * pages number their headings inconsistently (2012 opens a group with `<h1>` and names
 * categories `<h3>` or `<h4>`; 2013 uses `<h2>` and once `<h3>` for a group; 2014 mixes
 * `<h1>` and `<h2>`). The deepest open heading is the category and the one enclosing it
 * is the group, which reads every page the same way.
 */
function headings(stack) {
  if (!stack.length) return { group: null, category: null };
  return { group: stack[Math.max(0, stack.length - 2)].text, category: stack[stack.length - 1].text };
}

/**
 * One International Chocolate Awards results page from 2012–2014, which prints the
 * level as plain uppercase text ("<p>GOLD: maker (Country) – product</p>", wrapped in
 * `<strong>` in 2014) and has no `results-link` spans. A "National awards" or "Special
 * awards" sub-section restates a medal the same product already won, so its rows are
 * joined onto that entry — as the 2015+ grammar joins its award blocks — not counted again.
 */
function parse(html) {
  const entries = []; const skipped = []; const blockRows = [];
  const stack = []; let section = null; let mode = 'medal'; let header = null;

  const level = (word, text) => {
    const hit = mapLevel('ica', word);
    if (!hit) throw new Error(`unknown ICA level word "${word}" in run: ${text}`);
    return hit;
  };
  const block = (row, qualifier) => blockRows.push({ ...row, section, qualifier });

  const runs = (chunk) => {
    for (const raw of chunk.split(/<br\s*\/?>|<\/p>/i)) {
      const text = clean(strip(raw)).replace(/\s*:\s*$/, '');   // a trailing colon opens a 2014 bullet list
      const m = text.match(RUN);
      if (!m) {
        // A finalists section lists "maker (Country) – product" nominations with no level
        // word. This era's results pages link to no finalists page for `ica-finalists.js`
        // to read, so the rows are quarantined rather than dropped; the section's
        // explanatory prose has no body to parse and is not a row.
        if (mode === 'finalists') {
          if (parseBody(text)) skipped.push({ raw: text, reason: 'unlevelled-finalist-row', block: section });
          continue;
        }
        const b = mode === 'block' ? text.match(BULLET) : null;
        if (b && header) {
          const label = clean(`${b[1]} – ${b[2]}`);
          const { group, category } = headings(stack);
          block({ level: level(b[1], text), level_raw: label, ...header, category, group, special: [] }, label);
          continue;
        }
        // A run naming a level that this grammar cannot read is quarantined wherever it
        // stands — inside an award block the header fallback would otherwise swallow it.
        if (b || /^(GOLD|SILVER|BRONZE)\b/.test(text)) { skipped.push({ raw: text, reason: 'unparsed-run' }); continue; }
        if (mode === 'block') header = parseBody(text) || header;   // 2014's product header; prose keeps the current one
        continue;
      }
      const label = clean(m[2] ? `${m[1]} – ${m[2]}` : m[1]);
      let body = parseBody(m[3]);
      if (!body) {
        const nc = m[3].match(NO_COUNTRY);
        if (!nc) { skipped.push({ raw: text, reason: 'unparsed-body' }); continue; }
        body = { maker: clean(nc[1]), country: null, product: clean(nc[2]), score: null, flags: [], private_label_maker: null };
      }
      const { group, category } = headings(stack);
      const qualifier = m[2] ? label : null;
      const row = { level: level(m[1], text), level_raw: label, ...body, category, group, special: [] };
      if (mode === 'block') { block(row, qualifier); continue; }
      if (qualifier) row.special.push(qualifier);
      entries.push(row);
    }
  };

  let last = 0;
  TOKEN.lastIndex = 0;
  for (let t; (t = TOKEN.exec(html));) {
    runs(html.slice(last, t.index));
    last = t.index + t[0].length;
    if (t[1]) {                                     // a heading closes every heading at or below its depth
      const depth = Number(t[1]);
      while (stack.length && stack[stack.length - 1].depth >= depth) stack.pop();
      stack.push({ depth, text: clean(strip(t[2])) });
      section = null; mode = 'medal'; header = null;
      continue;
    }
    section = clean(strip(t[3])); header = null;
    mode = SECTIONS[key(section)];
    if (!mode) throw new Error(`unknown ICA 2012–2014 sub-section "${section}" — classify it in SECTIONS`);
  }
  runs(html.slice(last));

  // An award-block row is a qualifier on a medal the same product already won, so it is
  // joined onto that entry. A row naming a product that won no medal in its category has
  // nothing to qualify and is quarantined rather than counted as a medal of its own.
  for (const r of blockRows) {
    const hit = entries.find((e) => e.category === r.category && key(e.maker) === key(r.maker) && key(e.product) === key(r.product));
    if (!hit) { skipped.push({ raw: `${r.level_raw}: ${r.maker} – ${r.product}`, reason: 'unjoined-block-row', block: r.section }); continue; }
    const tag = `${r.section}: ${r.qualifier || r.level_raw}`;
    if (!hit.special.includes(tag)) hit.special.push(tag);
  }
  return { entries, skipped };
}

module.exports = { parse };
