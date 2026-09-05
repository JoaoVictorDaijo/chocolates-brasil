#!/usr/bin/env node
'use strict';

/**
 * Drafts an AVPA award file from a text dump of a palmarès PDF, for HAND REVIEW.
 *
 * The 2021–2023 PDFs carry no table a parser can read (`data/tools/parsers/avpa.js`
 * aborts on them), so those editions are transcribed by hand and committed with
 * `source.method: "manual-transcription"`. This splits the dump on the medal words,
 * which end every row, and guesses only the origin country: `maker`, `product` and the
 * rest are left as `??` for a human to fill from the `_raw` chunk kept beside them.
 *
 *   node data/tools/transcribe-avpa.js 2021 <dump.txt> <pdf-url>
 *   → data/awards/avpa/2021.draft.json
 *
 * Then fill each row from `_raw`, delete `_raw`, and save as `<year>.json`.
 */

const fs = require('fs');
const path = require('path');
const { clean } = require('./lib/text.js');
const { mapLevel } = require('./lib/levels.js');
const { MEDAL_SOURCE } = require('./parsers/avpa.js');

// The countries AVPA prints as the cocoa origin, in French, as published.
const COUNTRIES = /\b(Brésil|Pérou|Perou|Mexique|Colombie|[ÉE]quateur|Malaisie|Vietnam|Australie|Inde|Indonésie|Taiwan|Philippines|Honduras|Guatemala|Nicaragua|Venezuela|Costa Rica|République Dominicaine|Sao Tomé[^ ]*|Ghana|Madagascar|Ouganda|Tanzanie|Cameroun|Bolivie|Cuba|Haïti|Jamaïque|Belize|Salvador|Panama|Thaïland[e]?|Sri Lanka|Nigeria|Congo|Togo|Gabon|Vanuatu|Etats-Unis|Côte d’Ivoire|Cote D'ivoire|France|Bénin|Benin)\b/;

function draft(text, year, url) {
  const flat = String(text).replace(/\s+/g, ' ');
  const medals = new RegExp(MEDAL_SOURCE, 'g');
  const entries = [];
  let last = 0;
  let m;
  while ((m = medals.exec(flat))) {
    const raw = clean(flat.slice(last, m.index));
    last = medals.lastIndex;
    entries.push({
      level: mapLevel('avpa', m[0]),
      level_raw: m[0],
      maker: '??',
      company: null,
      producer: null,
      country: null,
      origin_country: (raw.match(COUNTRIES) || [])[1] || null,
      product: '??',
      category: null,
      group: null,
      score: null,
      special: [],
      flags: [],
      private_label_maker: null,
      _raw: raw,
    });
  }
  return {
    competition: 'avpa',
    slug: year,
    year: Number(year),
    edition: year,
    title: `Concours International des Chocolats élaborés à l'origine AVPA Paris ${year}`,
    source: {
      url,
      snapshot: `data/raw/avpa/${year}.pdf`,
      fetched: new Date().toISOString().slice(0, 10),
      method: 'manual-transcription',
      skipped: [],
    },
    entries,
  };
}

function main(argv) {
  const [year, txtPath, url] = argv;
  if (!year || !txtPath || !url) {
    console.error('usage: transcribe-avpa.js <year> <text-dump> <pdf-url>');
    process.exit(2);
  }
  const out = draft(fs.readFileSync(txtPath, 'utf8'), year, url);
  const dest = path.resolve(__dirname, '..', 'awards', 'avpa', `${year}.draft.json`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, `${JSON.stringify(out, null, 2)}\n`);
  console.log(`${out.entries.length} draft rows → ${dest}`);
  console.log(`fill maker/product/company/producer from _raw, delete _raw, save as ${year}.json`);
}

if (require.main === module) main(process.argv.slice(2));
module.exports = { draft };
