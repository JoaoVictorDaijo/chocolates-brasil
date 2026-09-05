'use strict';

const { parseIcaStrong } = require('./ica-strong.js');
const { parseFinalists, joinFinalists } = require('./ica-finalists.js');

/**
 * One International Chocolate Awards results page from the old site
 * (chocolateawards.com, 2015–2022). Same `<strong>Level</strong>:` grammar as the
 * new site; the difference is what the pages print — "National awards" and
 * "Special awards" blocks, and the MMM/Bean-to-bar/Biome-to-bar recognitions.
 */
function parse(html, { finalistsHtml } = {}) {
  const { entries, skipped } = parseIcaStrong(html, { variant: 'old' });
  const all = finalistsHtml ? joinFinalists(entries, parseFinalists(finalistsHtml)) : entries;
  return { entries: all, skipped };
}

module.exports = { parse };
