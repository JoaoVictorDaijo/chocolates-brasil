'use strict';

const { clean, strip } = require('../lib/text.js');
const { mapLevel } = require('../lib/levels.js');

/**
 * One Academy of Chocolate results page (academyofchocolate.org.uk/awards/<year>/,
 * 2005–2025). The edition ships as a single five-column `<table>`:
 * group | category | level (an icon then the word) | company | product. The `<th>`
 * header row is not a result; rows the page prints as section banners — the "Overall
 * Winner" row that carries only an icon, a company-less "Golden Bean" row — are
 * quarantined rather than aborting, so one malformed row never loses an edition.
 */
function parse(html) {
  const entries = [];
  const skipped = [];
  const table = html.match(/<table[\s\S]*?<\/table>/i);
  if (!table) throw new Error('AoC page has no <table>');
  for (const tr of table[0].match(/<tr[\s\S]*?<\/tr>/gi) || []) {
    const tds = (tr.match(/<td[^>]*>[\s\S]*?<\/td>/gi) || []).map((td) => clean(strip(td)));
    if (tds.length < 5) continue;                              // header row uses <th>
    const [group, category, levelRaw, maker, product] = tds;
    const raw = tds.join(' | ');
    if (!levelRaw) { skipped.push({ raw, reason: 'blank-level' }); continue; }
    if (!maker) { skipped.push({ raw, reason: 'blank-maker' }); continue; }
    if (!product) { skipped.push({ raw, reason: 'blank-product' }); continue; }
    const level = mapLevel('aoc', levelRaw);
    if (!level) throw new Error(`unknown AoC level word "${levelRaw}" in row: ${raw}`);
    entries.push({ level, level_raw: levelRaw, maker, country: null, product, category, group, score: null, special: [], flags: [], private_label_maker: null });
  }
  return { entries, skipped };
}

module.exports = { parse };
