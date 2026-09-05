'use strict';

const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', eacute: 'é', ccedil: 'ç', atilde: 'ã', ntilde: 'ñ', ouml: 'ö', uuml: 'ü', hellip: '…', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“' };

/** Resolves numeric and known named HTML entities; unknown named entities stay literal. */
function decode(s) {
  return s.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => (NAMED[n.toLowerCase()] !== undefined ? NAMED[n.toLowerCase()] : m));
}

function strip(html) { return html.replace(/<[^>]+>/g, ' '); }

/**
 * Normalises a scraped string for storage. Case and wording are left verbatim:
 * stored strings must stay what the source published.
 */
function clean(s) { return decode(String(s || '')).replace(/\s+/g, ' ').trim(); }

module.exports = { clean, decode, strip };
