'use strict';

const { parseIcaStrong } = require('./ica-strong.js');
const { parseFinalists, joinFinalists } = require('./ica-finalists.js');

/** One International Chocolate Awards results page from the new site (2023 →). */
function parse(html, { finalistsHtml } = {}) {
  const { entries, skipped } = parseIcaStrong(html, { variant: 'new' });
  const all = finalistsHtml ? joinFinalists(entries, parseFinalists(finalistsHtml)) : entries;
  return { entries: all, skipped };
}

module.exports = { parse };
