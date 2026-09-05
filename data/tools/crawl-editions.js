#!/usr/bin/env node
'use strict';

const path = require('path');
const { clean, strip } = require('./lib/text.js');
const { fetchSnapshot } = require('./lib/snapshot.js');

/**
 * Proposes the committed edition indexes (`data/editions/*.json`) by walking the
 * competitions' own archive listings. The output is never written to disk: the ICA
 * archive carries duplicate posts, announcements and rounds this site does not index,
 * so a human merges the proposal into the index files by hand (spec §5).
 *
 * Listing pages are Elementor post archives: every card prints the same URL in three
 * anchors (thumbnail, title, "Read More »"), so the title of a post is the longest
 * text among the anchors pointing at it.
 */

const CRAWL_DIR = path.join(__dirname, '..', 'raw', '_crawl');
const OLD_SITE = 'https://www.chocolateawards.com';
const NEW_SITE = 'https://enter.chocolateawards.com';

/** Slug of an edition label: `2020-21` stays, `2022 Second Phase` → `2022-second-phase`. */
function slugFor(edition) {
  return String(edition).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/**
 * Competition, edition and kind of one archive post, from its title and, when the
 * title does not name the competition, from the section of the site it is filed under
 * (the World Final 2022 winners are published as "Best chocolate in the world in
 * 2022"). Rounds this site does not index (the USA and USA & Canada Américas rounds
 * from 2024, and every regional competition) return null; a post that is neither a
 * winners nor a finalists list is reported as `not-a-results-page` so the human sees
 * what was dropped.
 */
function classifyPost({ title, url }) {
  const t = clean(title);
  if (/\bUSA\b/i.test(t)) return null;                       // USA and USA & Canada rounds are not indexed
  let competition = null;
  if (/world final/i.test(t)) competition = 'ica-world';
  else if (/americas/i.test(t)) competition = 'ica-americas';
  else if (/\/competitions\/world-final\//.test(url)) competition = 'ica-world';
  else if (/\/competitions\/americas\//.test(url)) competition = 'ica-americas';
  else return null;
  const season = t.match(/\b(20\d\d)\s*[-–/]\s*(\d\d)\b/);
  const single = t.match(/\b(20\d\d)\b/);
  if (!season && !single) return null;
  const edition = season ? `${season[1]}-${season[2]}` : single[1];
  const year = season ? Number(`${season[1].slice(0, 2)}${season[2]}`) : Number(single[1]);
  let kind = 'not-a-results-page';
  if (/grand jury finalists/i.test(t)) kind = 'finalists';
  else if (/winners/i.test(t) && !/merit|presentation|press|announc/i.test(t)) kind = 'winners';
  return { competition, year, edition, kind };
}

/**
 * Parser for an ICA edition. The host decides: the results moved to
 * enter.chocolateawards.com with the 2023 editions, and the two sites print different
 * grammars. The year is the fallback for an edition whose URL is not known yet.
 */
function parserFor(competition, year, url) {
  if (competition === 'aoc') return 'aoc';
  if (competition === 'avpa') return 'avpa';
  if (url && url.startsWith(NEW_SITE)) return 'ica-new';
  if (year <= 2014) return 'ica-2012';
  return year >= 2023 ? 'ica-new' : 'ica-old';
}

/** Every post linked from one archive page, titled from the longest anchor text. */
function postsFrom(html, urlRe) {
  const titles = new Map();
  for (const m of html.matchAll(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
    const url = m[1];
    if (!urlRe.test(url) || /\/feed\/$/.test(url)) continue;
    const title = clean(strip(m[2]));
    if (title.length > (titles.get(url) || '').length) titles.set(url, title);
  }
  return [...titles].map(([url, title]) => ({ url, title }));
}

/**
 * Walks `<base>page/1..maxPages/`, stopping at the first page that carries no post.
 * A page that cannot be fetched ends the walk and is printed, so a crawl the site
 * truncated (a WAF block, a renamed archive) is visible instead of silent.
 */
async function walk(name, base, maxPages, urlRe) {
  const posts = [];
  for (let page = 1; page <= maxPages; page++) {
    let html;
    const dest = path.join(CRAWL_DIR, `${name}-${page}.html`);
    try { html = (await fetchSnapshot({ url: `${base}page/${page}/`, dest })).toString('utf8'); }
    catch (e) { console.error(`  ${name} page ${page}: ${e.message}`); return posts; }
    const found = postsFrom(html, urlRe);
    console.error(`  ${name} page ${page}: ${found.length} posts`);
    if (found.length === 0) return posts;
    posts.push(...found);
  }
  return posts;
}

// The archives an ICA edition can be published in. Not every results list is filed
// under Results: the World Final 2022 winners live in the World Final section as a
// feature post.
const ICA_ARCHIVES = [
  ['ica-old-results', `${OLD_SITE}/category/results/`, 30, /^https:\/\/www\.chocolateawards\.com\/results\/winners\/[^"]+$/],
  ['ica-old-world-final', `${OLD_SITE}/category/competitions/world-final/`, 10, /^https:\/\/www\.chocolateawards\.com\/competitions\/world-final\/[^"]+$/],
  ['ica-old-americas', `${OLD_SITE}/category/competitions/americas/`, 10, /^https:\/\/www\.chocolateawards\.com\/competitions\/americas\/[^"]+$/],
  ['ica-new-americas', `${NEW_SITE}/competitions/americas/`, 10, /^https:\/\/enter\.chocolateawards\.com\/competitions\/americas\/[^"]+$/],
  ['ica-new-world-final', `${NEW_SITE}/competitions/world-final-competitions/`, 10, /^https:\/\/enter\.chocolateawards\.com\/competitions\/world-final-competitions\/[^"]+$/],
];

async function crawlIca() {
  const seen = new Set();
  const proposals = {};
  for (const archive of ICA_ARCHIVES) {
    for (const post of await walk(...archive)) {
      if (seen.has(post.url)) continue;
      seen.add(post.url);
      const c = classifyPost(post);
      if (!c) continue;
      const bucket = (proposals[c.competition] ||= {});
      const e = (bucket[c.edition] ||= { slug: slugFor(c.edition), year: c.year, edition: c.edition, title: post.title, url: null, parser: parserFor(c.competition, c.year, null), notes: [] });
      if (c.kind === 'winners') {
        if (e.url) e.notes.push(`duplicate winners post: ${post.url}`);
        else { e.url = post.url; e.title = post.title; e.parser = parserFor(c.competition, c.year, post.url); }
      } else if (c.kind === 'finalists') {
        if (e.finalists_url) e.notes.push(`duplicate finalists post: ${post.url}`);
        else e.finalists_url = post.url;
      } else e.notes.push(`not-a-results-page: ${post.url}`);
    }
  }
  return proposals;
}

async function crawlAoc() {
  const html = (await fetchSnapshot({
    url: 'https://academyofchocolate.org.uk/previous-years/',
    dest: path.join(CRAWL_DIR, 'aoc-previous-years.html'),
  })).toString('utf8');
  const out = {};
  for (const m of html.matchAll(/href="https:\/\/academyofchocolate\.org\.uk\/awards\/([0-9]{4}(?:-2)?)\/"/g)) {
    const s = m[1];
    const year = Number(s.slice(0, 4));
    const edition = s.endsWith('-2') ? `${year} Second Phase` : String(year);
    out[edition] = { slug: slugFor(edition), year, edition, title: `Academy of Chocolate Awards ${edition}`, url: `https://academyofchocolate.org.uk/awards/${s}/`, parser: 'aoc' };
  }
  return { aoc: out };
}

if (require.main === module) {
  const which = process.argv[2];
  if (which !== 'ica' && which !== 'aoc') {
    console.error('usage: crawl-editions.js ica|aoc   (AVPA URLs are Wix content hashes, kept by hand)');
    process.exit(2);
  }
  (which === 'aoc' ? crawlAoc() : crawlIca()).then((proposals) => {
    for (const [competition, eds] of Object.entries(proposals)) {
      console.log(`\n# ${competition}: ${Object.keys(eds).length} editions — merge by hand into data/editions/${competition}.json`);
      console.log(JSON.stringify(Object.values(eds).sort((a, b) => a.year - b.year), null, 2));
    }
  }).catch((e) => { console.error(e.message); process.exit(1); });
}

module.exports = { classifyPost, slugFor, parserFor };
