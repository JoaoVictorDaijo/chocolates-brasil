'use strict';

const { clean, strip } = require('../lib/text.js');
const { key } = require('../lib/key.js');

/**
 * Grand Jury finalists list. Stable features: a results-link maker span, an
 * optional (Country), the product in <strong>, an optional score; rows are
 * separated by <br> or by a newline inside the block (2021-22 prints no <br>).
 */
function parseFinalists(html) {
  const out = [];
  const rows = html.split(/<br\s*\/?>|\n/);
  for (const r of rows) {
    if (!/results-link/.test(r) || !/<strong>/.test(r)) continue;
    const maker = r.match(/class="results-link"[^>]*>([^<]+)<\/a>/) || r.match(/class="results-link"[^>]*>([^<]+)</);
    const prod = r.match(/<strong>([\s\S]*?)<\/strong>/);
    if (!maker || !prod) continue;
    const text = clean(strip(r));
    const country = (text.match(/\(([^()]+)\)\s*[–—-]/) || [])[1] || null;
    const score = (r.match(/\((\d{1,3}(?:\.\d+)?)\)/) || [])[1];
    out.push({ maker: clean(maker[1]), country: country ? clean(country) : null, product: clean(prod[1]), score: score ? Number(score) : null });
  }
  return out;
}

/** Appends the finalists that did not medal; a winner is never duplicated. */
function joinFinalists(entries, finalists) {
  const won = new Set(entries.map((e) => `${key(e.maker)}|${key(e.product)}`));
  const seen = new Set();
  const extra = [];
  for (const f of finalists) {
    const k = `${key(f.maker)}|${key(f.product)}`;
    if (won.has(k) || seen.has(k)) continue;
    seen.add(k);
    extra.push({ level: 'finalist', level_raw: 'Grand Jury Finalist', maker: f.maker, country: f.country, product: f.product, category: null, group: null, score: f.score, special: [], flags: [], private_label_maker: null });
  }
  return entries.concat(extra);
}

module.exports = { parseFinalists, joinFinalists };
