const test = require('node:test');
const assert = require('node:assert/strict');
const { classifyPost, slugFor, parserFor } = require('../data/tools/crawl-editions.js');

test('classifies old-site result posts', () => {
  assert.deepEqual(classifyPost({ title: 'World Final Winners – 2019', url: 'https://www.chocolateawards.com/results/winners/world-final-winners-2019/' }), { competition: 'ica-world', year: 2019, edition: '2019', kind: 'winners' });
  assert.deepEqual(classifyPost({ title: 'Americas Bean-to-Bar and Craft Chocolatier Competition 2021-22 – Winners', url: 'https://x/americas-…-2021-22-winners/' }), { competition: 'ica-americas', year: 2022, edition: '2021-22', kind: 'winners' });
  assert.equal(classifyPost({ title: 'Americas Semi-final 2013 Merit Awards', url: 'https://x/americas-semi-final-2013-merit-awards/' }).kind, 'not-a-results-page');
  assert.equal(classifyPost({ title: 'Americas Competition 2017 – Grand Jury Finalists', url: 'https://x/americas-competition-2017-grand-jury-finalists/' }).kind, 'finalists');
  assert.equal(classifyPost({ title: 'Americas – USA & Canada Bean-to-Bar and Craft Chocolatier Competition 2024 – Winners', url: 'https://x/' }), null);
  assert.equal(classifyPost({ title: 'Americas Craft Chocolate Competition – Latin America and the Caribbean 2026', url: 'https://x/' }).kind, 'not-a-results-page');
});
test('slugs', () => {
  assert.equal(slugFor('2020-21'), '2020-21');
  assert.equal(slugFor('2022 Second Phase'), '2022-second-phase');
});

test('classifies posts the ICA files under a competition instead of the results archive', () => {
  // The World Final 2022 winners list is published as a feature post whose title never
  // says "World Final": only its URL does.
  assert.deepEqual(classifyPost({ title: 'Best chocolate in the world in 2022', url: 'https://www.chocolateawards.com/competitions/world-final/best-chocolate-world-final-2022/' }), { competition: 'ica-world', year: 2022, edition: '2022', kind: 'not-a-results-page' });
  assert.equal(classifyPost({ title: 'Interview with Vigdis Rosenkilde', url: 'https://www.chocolateawards.com/competitions/world-final/vigdis-rosenkilde-best-milk-bar-2022/' }), null);
});
test('does not index the rounds the site runs beside Américas', () => {
  assert.equal(classifyPost({ title: 'Americas – USA Bean-to-Bar and Craft Chocolatier Competition 2026 – Winners', url: 'https://x/' }), null);
  assert.equal(classifyPost({ title: 'Asia-Pacific Bean-to-Bar and Craft Chocolatier Competition 2021-22 – Winners', url: 'https://x/' }), null);
});
test('picks the ICA parser by host, and by year when no URL is known', () => {
  assert.equal(parserFor('ica-world', 2022, 'https://www.chocolateawards.com/competitions/world-final/best-chocolate-world-final-2022/'), 'ica-old');
  assert.equal(parserFor('ica-world', 2023, 'https://enter.chocolateawards.com/competitions/world-final-competitions/world-final-2023-winners/'), 'ica-new');
  assert.equal(parserFor('ica-americas', 2014, 'https://www.chocolateawards.com/results/winners/americas-semi-final-2014-winners-international-chocolate-awards/'), 'ica-2012');
  assert.equal(parserFor('ica-world', 2019, null), 'ica-old');
});

// The indexes are committed, hand-merged data: these assertions are what a human
// checked when merging the crawler's proposal, kept executable.
const fs = require('fs');
const path = require('path');
const index = (c) => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'editions', `${c}.json`), 'utf8'));

test('every committed edition index is internally consistent', () => {
  for (const competition of ['ica-world', 'ica-americas', 'aoc', 'avpa']) {
    const file = index(competition);
    assert.equal(file.competition, competition);
    const slugs = file.editions.map((e) => e.slug);
    assert.deepEqual(slugs, [...new Set(slugs)], `${competition} has duplicate slugs`);
    for (const e of file.editions) {
      const where = `${competition}/${e.slug}`;
      assert.equal(e.slug, slugFor(e.edition), `${where}: slug does not match the edition label`);
      assert.equal(e.year, Number(e.edition.slice(0, 4)) + (/^\d{4}-\d\d$/.test(e.edition) ? 1 : 0), `${where}: year is not the closing year of the edition`);
      assert.ok(e.title, `${where}: no title`);
      assert.match(e.url, /^https:\/\/\S+$/, `${where}: no URL`);
    }
  }
});

test('every committed edition index names the parser its source needs', () => {
  for (const competition of ['ica-world', 'ica-americas']) {
    for (const e of index(competition).editions) {
      assert.equal(e.parser, parserFor(competition, e.year, e.url), `${competition}/${e.slug}: wrong parser for ${e.url}`);
      // Finalists lists before 2015 print maker and country without the product.
      if (e.year < 2015) assert.equal(e.finalists_url, undefined, `${competition}/${e.slug}: pre-2015 finalists are not indexed`);
    }
  }
  for (const e of index('aoc').editions) assert.equal(e.parser, 'aoc');
  for (const e of index('avpa').editions) {
    if (e.year <= 2023) { assert.equal(e.method, 'manual-transcription'); assert.equal(e.parser, undefined); }
    else { assert.equal(e.parser, 'avpa'); assert.equal(e.method, undefined); }
    assert.match(e.url, /^https:\/\/en\.avpa\.fr\/_files\/ugd\/58172f_[0-9a-f]{32}\.pdf$/);
  }
});

test('the merged Américas 2016 round is filtered to the Americas', () => {
  const e2016 = index('ica-americas').editions.find((e) => e.slug === '2016');
  assert.equal(e2016.filter, 'americas-countries');
  assert.match(e2016.notes, /merged Americas \+ Asia Pacific round/);
});
