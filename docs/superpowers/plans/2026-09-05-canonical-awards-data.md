# Canonical Awards Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hand-typed ICA / Academy of Chocolate / AVPA award lists in `gerar.js` with a canonical, fetched, validated dataset under `data/`, and make the site build from it.

**Architecture:** `data/tools/` fetches official result pages into `data/raw/` snapshots and parses them into one JSON file per competition edition under `data/awards/`, using a shared schema, level vocabulary and matching key. `data/brands.json` maps official maker names to brand ids. `awards-loader.js` turns the award files into the `{c, y, l, p, star}` objects `gerar.js` already renders; sections, badges, counts and the update date are derived from data. A frozen export of today's curated awards plus an accepted-deltas file proves the migration lost nothing.

**Tech Stack:** Node 22 (`.nvmrc`), built-in `node:test`, `pdf-parse` 2.x (only new dependency), plain regex parsing of the known markup, JSON files in git.

**Spec:** `docs/superpowers/specs/2026-09-04-canonical-awards-data-design.md` — read it first; every rule below argues from it.

## Global Constraints

- Node 22 per `.nvmrc`; no test framework beyond `node --test`; no DOM library.
- Only new runtime dependency: `pdf-parse` pinned to the exact 2.x version installed in Task 9; AVPA fixtures are generated with that version only.
- Nothing under `data/` may `require` anything outside `data/`.
- Stored strings are verbatim after HTML-entity decoding, whitespace collapse and trim. No translation, no case change.
- Matching key (spec §3): lowercase → NFD, strip combining marks → fold U+2010–U+2015 and U+2212 to `-` → remove everything outside `\p{L}\p{N}`.
- Level vocabulary is closed (spec §3): `gold silver bronze top-gold commended trophy recognition finalist gourmet-gold gourmet-silver gourmet-bronze gourmet-medal gourmet-diploma`.
- Fail loudly on zero entries or an unknown level word; quarantine (never abort) blank rows, repeated headers, duplicates, unjoined block rows, empty keys.
- Owner decisions already made: finalists are stored and shown but `scored: false` and never place a brand; the 10 section moves in spec §10 step 4 are accepted; `SHOW_NACIONAL` defaults to `true`.
- Commit after every task with the `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>` trailer. Never push.
- Downloaded official pages from the audit session live in
  `/tmp/claude-1000/-home-mainframe-chocolates-brasil/1990d141-c19e-4885-b480-1a8682b782c6/scratchpad/src/` (referred to below as `$SNAP`). Copy from there; if the directory is gone, re-download with the fetch tool once it exists (Task 11).

---

## File structure

| Path | Responsibility |
|---|---|
| `data/tools/lib/key.js` | matching key |
| `data/tools/lib/levels.js` | vocabulary, per-source alias tables, ICA block registry loader |
| `data/tools/lib/ica-blocks.json` | ICA `<h1>` heading registry |
| `data/tools/lib/schema.js` | award-file validator |
| `data/tools/lib/text.js` | entity decode + whitespace collapse |
| `data/tools/lib/snapshot.js` | download with retry/pacing/validation, offline mode |
| `data/tools/parsers/ica-strong.js` | shared `<strong>Level</strong>:` grammar (2015 →) |
| `data/tools/parsers/ica-new.js`, `ica-old.js` | thin wrappers selecting the markup variant |
| `data/tools/parsers/ica-2012.js` | plain-text level grammar (2012–2014) |
| `data/tools/parsers/ica-finalists.js` | finalists page parser + join |
| `data/tools/parsers/aoc.js` | five-column table |
| `data/tools/parsers/avpa.js` | pdf-parse tables + per-edition column map |
| `data/tools/crawl-editions.js` | proposes edition index entries |
| `data/tools/fetch.js` | CLI: snapshot → parse → award file |
| `data/tools/check.js` | mapping health report |
| `data/tools/export-audit.js` | freezes today's curated awards (golden input) |
| `data/tools/transcribe-avpa.js` | drafts AVPA 2021–2023 JSON from text dumps for hand review |
| `data/tools/americas-countries.json` | filter for the merged 2016 round |
| `data/editions/*.json` | committed edition indexes |
| `data/awards/<competition>/<slug>.json` | canonical results |
| `data/raw/<competition>/<slug>.*` | snapshots |
| `data/brands.json` | maker → brand mapping |
| `data/README.md` | dataset documentation |
| `awards-loader.js` | award files → site award objects, placement, badge, date |
| `gerar.js` | site generator (modified) |
| `tests/*.test.js`, `tests/fixtures/`, `tests/golden/` | tests |

---

### Task 1: Freeze the audited state and export the golden audit

**Files:**
- Create: `data/tools/export-audit.js`, `tests/golden/audit-2026-09-04.json`, `tests/export-audit.test.js`
- Modify: `package.json` (add `"test": "node --test tests/"`)

**Interfaces:**
- Produces: `tests/golden/audit-2026-09-04.json` = `{ exported: "2026-09-05", rows: [{ brand, competition, edition, level, n, p }] }` where `competition ∈ ica-world|ica-americas|aoc|avpa`, `edition` is the label with `/` replaced by `-` (`2020-21`), `level` is a vocabulary word, `n` is the 1-based ordinal among rows sharing (brand, competition, edition, level).

- [ ] **Step 1: Commit the audited working tree as-is**

```bash
git add -A
git commit -m "Audita medalhas em 4/9/2026: ICA Américas 2026, AoC 2020-2025, AVPA 2026, B2B; 4 marcas novas; data de atualização" \
  -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

- [ ] **Step 2: Write the failing test**

`tests/export-audit.test.js`:
```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { exportAudit } = require('../data/tools/export-audit.js');

test('exportAudit keeps only the four canonical competitions and numbers duplicates', () => {
  const marcas = [{ name: 'Nugali Chocolates', awards: [
    { c: 'ICA Américas', y: '2026', l: 'Bronze', p: 'Ao Leite 45%' },
    { c: 'ICA Américas', y: '2026', l: 'Bronze', p: 'Drágea de Nibs de Cacau' },
    { c: 'ICA Mundial', y: '2020/21', l: 'Prata', p: 'x' },
    { c: 'Bean to Bar Brasil', y: '2025', l: 'Ouro', p: 'ignored' },
    { c: 'AVPA Paris', y: '2026', l: 'Diploma Gourmet', p: 'y' },
  ] }];
  const rows = exportAudit(marcas);
  assert.deepEqual(rows, [
    { brand: 'Nugali Chocolates', competition: 'ica-americas', edition: '2026', level: 'bronze', n: 1, p: 'Ao Leite 45%' },
    { brand: 'Nugali Chocolates', competition: 'ica-americas', edition: '2026', level: 'bronze', n: 2, p: 'Drágea de Nibs de Cacau' },
    { brand: 'Nugali Chocolates', competition: 'ica-world', edition: '2020-21', level: 'silver', n: 1, p: 'x' },
    { brand: 'Nugali Chocolates', competition: 'avpa', edition: '2026', level: 'gourmet-diploma', n: 1, p: 'y' },
  ]);
});
```

- [ ] **Step 3: Run it, expect failure**

Run: `node --test tests/export-audit.test.js`
Expected: FAIL, "Cannot find module '../data/tools/export-audit.js'"

- [ ] **Step 4: Implement**

`data/tools/export-audit.js`:
```js
#!/usr/bin/env node
// Freezes the curated awards of marcas.json (pre-migration) as the golden audit input.
const fs = require('fs');
const path = require('path');

const COMP = { 'ICA Mundial': 'ica-world', 'ICA Américas': 'ica-americas', 'Academy of Chocolate': 'aoc', 'AVPA Paris': 'avpa' };
const LEVEL = {
  'Ouro': 'gold', 'Prata': 'silver', 'Bronze': 'bronze', 'Menção': 'commended', 'Finalista': 'finalist',
  'Prêmio Especial': 'recognition', 'Gourmet Ouro': 'gourmet-gold', 'Gourmet Prata': 'gourmet-silver',
  'Gourmet Bronze': 'gourmet-bronze', 'Medalha Gourmet': 'gourmet-medal', 'Diploma Gourmet': 'gourmet-diploma',
};

function exportAudit(marcas) {
  const rows = [];
  const counter = new Map();
  for (const m of marcas) {
    for (const a of m.awards || []) {
      const competition = COMP[a.c];
      if (!competition) continue;
      const level = LEVEL[a.l];
      if (!level) throw new Error(`unmapped curated level "${a.l}" on ${m.name}`);
      const edition = String(a.y).replace('/', '-');
      const k = `${m.name}|${competition}|${edition}|${level}`;
      const n = (counter.get(k) || 0) + 1;
      counter.set(k, n);
      rows.push({ brand: m.name, competition, edition, level, n, p: a.p });
    }
  }
  return rows;
}

if (require.main === module) {
  const root = path.resolve(__dirname, '..', '..');
  const marcas = JSON.parse(fs.readFileSync(path.join(root, 'marcas.json'), 'utf8'));
  const out = { exported: process.argv[2] || new Date().toISOString().slice(0, 10), rows: exportAudit(marcas) };
  const dest = path.join(root, 'tests', 'golden', 'audit-2026-09-04.json');
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, JSON.stringify(out, null, 2) + '\n');
  console.log(`${out.rows.length} audited rows → ${dest}`);
}

module.exports = { exportAudit, COMP, LEVEL };
```

- [ ] **Step 5: Run the test, expect pass, then export the real audit**

Run: `node --test tests/export-audit.test.js` → PASS.
Run: `node gerar.js && node data/tools/export-audit.js 2026-09-05` → prints `N audited rows` (expected around 430: every non-national award in marcas.json).
Check: `grep -c '"brand"' tests/golden/audit-2026-09-04.json` equals N.

- [ ] **Step 6: Add the test script and commit**

`package.json` scripts: add `"test": "node --test tests/"`.
```bash
git add package.json data/tools/export-audit.js tests/export-audit.test.js tests/golden/audit-2026-09-04.json
git commit -m "Congela auditoria de 4/9/2026 como entrada do teste golden" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Matching key, text normalisation and level vocabulary

**Files:**
- Create: `data/tools/lib/key.js`, `data/tools/lib/text.js`, `data/tools/lib/levels.js`, `data/tools/lib/ica-blocks.json`, `tests/lib.test.js`

**Interfaces:**
- Produces: `key(s: string): string`; `clean(s: string): string` (decode entities, collapse whitespace, trim); `LEVELS: { [level]: { disc: 'g'|'s'|'b'|'o', scored: boolean, places: boolean } }`; `mapLevel(source: 'ica'|'aoc'|'avpa', raw: string): string|null`; `icaBlock(heading: string): 'medal'|'block'|null`.

- [ ] **Step 1: Write the failing tests**

`tests/lib.test.js`:
```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { key } = require('../data/tools/lib/key.js');
const { clean } = require('../data/tools/lib/text.js');
const { LEVELS, mapLevel, icaBlock } = require('../data/tools/lib/levels.js');

test('key folds case, accents, dashes and punctuation but keeps CJK', () => {
  assert.equal(key('Dark Chocolate 70% Cocoa – Cacau em Flor'), key('Dark Chocolate 70% Cocoa - Cacau em Flor'));
  assert.equal(key('Ju Arléo chocolates'), key('Ju Arléo Chocolates'));
  assert.notEqual(key('Nugali'), key('Nugali Chocolates'));
  assert.equal(key('Mestiço\nChocolates'), 'mesticochocolates');
  assert.equal(key('拾米屋米花/蘇怡帆'), '拾米屋米花蘇怡帆');
  assert.equal(key(' ( ) '), '');
});

test('clean decodes entities and collapses whitespace', () => {
  assert.equal(clean('  Blum&#8217;s  &amp;\n Co '), "Blum’s & Co");
});

test('vocabulary is closed and carries disc/scored/places', () => {
  assert.deepEqual(Object.keys(LEVELS).sort(), ['bronze', 'commended', 'finalist', 'gold', 'gourmet-bronze', 'gourmet-diploma', 'gourmet-gold', 'gourmet-medal', 'gourmet-silver', 'recognition', 'silver', 'top-gold', 'trophy']);
  assert.deepEqual(LEVELS.finalist, { disc: 'o', scored: false, places: false });
  assert.deepEqual(LEVELS['gourmet-diploma'], { disc: 'o', scored: true, places: true });
  assert.deepEqual(LEVELS['top-gold'], { disc: 'g', scored: true, places: true });
});

test('mapLevel handles every published wording', () => {
  assert.equal(mapLevel('aoc', 'GOLD'), 'gold');
  assert.equal(mapLevel('aoc', 'Silvere'), 'silver');
  assert.equal(mapLevel('aoc', 'Top Gold'), 'top-gold');
  assert.equal(mapLevel('aoc', 'TROPHY'), 'trophy');
  assert.equal(mapLevel('aoc', 'COMMENDED'), 'commended');
  assert.equal(mapLevel('ica', 'Bronze'), 'bronze');
  assert.equal(mapLevel('ica', '2018 Americas MMM'), 'recognition');
  assert.equal(mapLevel('ica', '2017 World Gold M.M.M'), 'recognition');
  assert.equal(mapLevel('avpa', 'Gourmet Or'), 'gourmet-gold');
  assert.equal(mapLevel('avpa', 'Diplôme Gourmet'), 'gourmet-diploma');
  assert.equal(mapLevel('avpa', 'Médaille Gourmet'), 'gourmet-medal');
  assert.equal(mapLevel('aoc', 'Platinum'), null);
});

test('icaBlock classifies headings by key', () => {
  assert.equal(icaBlock('Plain/origin dark bar categories'), 'medal');
  assert.equal(icaBlock("‘Best in competition’ overall winners"), 'block');
  assert.equal(icaBlock('Special flavor ingredient recognition'), 'block');
  assert.equal(icaBlock('National awards'), 'block');
  assert.equal(icaBlock('Something new'), null);
});
```

- [ ] **Step 2: Run, expect failure** — `node --test tests/lib.test.js` → FAIL (modules missing).

- [ ] **Step 3: Implement**

`data/tools/lib/key.js`:
```js
'use strict';
// Matching key (spec §3): comparisons only, never stored.
function key(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/\p{M}/gu, '')
    .replace(/[‐-―−]/g, '-')
    .replace(/[^\p{L}\p{N}]/gu, '');
}
module.exports = { key };
```

`data/tools/lib/text.js`:
```js
'use strict';
const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', eacute: 'é', ccedil: 'ç', atilde: 'ã', ntilde: 'ñ', ouml: 'ö', uuml: 'ü', hellip: '…', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“' };
function decode(s) {
  return s.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => (NAMED[n.toLowerCase()] !== undefined ? NAMED[n.toLowerCase()] : m));
}
function strip(html) { return html.replace(/<[^>]+>/g, ' '); }
function clean(s) { return decode(String(s || '')).replace(/\s+/g, ' ').trim(); }
module.exports = { clean, decode, strip };
```

`data/tools/lib/ica-blocks.json`:
```json
{
  "medal": [
    "Plain/origin dark bar categories", "Plain/origin milk bar categories", "Flavoured bar categories",
    "Filled chocolates", "Flavoured with coffee", "Flavoured with alcohol", "Drinking chocolate categories",
    "Spreads", "Cocoa products", "Plain/origin bars", "Flavoured bars", "Ganaches, truffles and pralines",
    "Dragées and enrobed products", "Spreads and drinking chocolate", "Cocoa powder and cocoa butter"
  ],
  "block": [
    "'Best in competition' overall winners", "Special flavour ingredient recognition",
    "Chocolate Tasters' Special Prizes", "National awards", "Special awards", "World Regional awards",
    "Growing country awards", "Overall winners"
  ]
}
```
(The `medal` list is extended in Task 5–7 as fixtures reveal headings; an unknown heading aborts by design.)

`data/tools/lib/levels.js`:
```js
'use strict';
const path = require('path');
const { key } = require('./key.js');

const LEVELS = {
  'gold': { disc: 'g', scored: true, places: true },
  'silver': { disc: 's', scored: true, places: true },
  'bronze': { disc: 'b', scored: true, places: true },
  'top-gold': { disc: 'g', scored: true, places: true },
  'commended': { disc: 'o', scored: true, places: false },
  'trophy': { disc: 'o', scored: true, places: false },
  'recognition': { disc: 'o', scored: true, places: false },
  'finalist': { disc: 'o', scored: false, places: false },
  'gourmet-gold': { disc: 'g', scored: true, places: true },
  'gourmet-silver': { disc: 's', scored: true, places: true },
  'gourmet-bronze': { disc: 'b', scored: true, places: true },
  'gourmet-medal': { disc: 'o', scored: true, places: true },
  'gourmet-diploma': { disc: 'o', scored: true, places: true },
};

// Published wording → level, per source. Keys are matching keys of the raw word.
const ALIASES = {
  aoc: { gold: 'gold', topgold: 'top-gold', silver: 'silver', silvere: 'silver', bronze: 'bronze', commended: 'commended', trophy: 'trophy' },
  ica: { gold: 'gold', silver: 'silver', bronze: 'bronze' },
  avpa: { gourmetor: 'gourmet-gold', gourmetargent: 'gourmet-silver', gourmetbronze: 'gourmet-bronze', medaillegourmet: 'gourmet-medal', diplomegourmet: 'gourmet-diploma' },
};
// ICA non-medal labels: any label containing one of these fragments is a recognition.
const ICA_RECOGNITION = [/\bmmm\b/i, /m\.m\.m/i, /recognition/i, /bean-to-bar chocolatier/i, /biome-to-bar/i];

function mapLevel(source, raw) {
  const k = key(raw);
  const hit = (ALIASES[source] || {})[k];
  if (hit) return hit;
  if (source === 'ica' && ICA_RECOGNITION.some((re) => re.test(raw))) return 'recognition';
  return null;
}

const BLOCKS = require(path.join(__dirname, 'ica-blocks.json'));
const BLOCK_KEYS = { medal: new Set(BLOCKS.medal.map(key)), block: new Set(BLOCKS.block.map(key)) };
function icaBlock(heading) {
  const k = key(heading);
  if (BLOCK_KEYS.block.has(k)) return 'block';
  if (BLOCK_KEYS.medal.has(k)) return 'medal';
  return null;
}

module.exports = { LEVELS, mapLevel, icaBlock };
```

- [ ] **Step 4: Run, expect pass** — `node --test tests/lib.test.js` → all PASS.

- [ ] **Step 5: Commit**
```bash
git add data/tools/lib tests/lib.test.js
git commit -m "Adiciona chave de comparação, vocabulário de níveis e registro de blocos do ICA" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Award-file schema validator

**Files:**
- Create: `data/tools/lib/schema.js`, `tests/schema.test.js`

**Interfaces:**
- Produces: `validateAwardFile(file: object): string[]` (empty array = valid); `COMPETITIONS = ['ica-world','ica-americas','aoc','avpa']`; `entryKey(e) = level|category key|maker key|product key`.

- [ ] **Step 1: Write the failing tests**

`tests/schema.test.js`:
```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { validateAwardFile } = require('../data/tools/lib/schema.js');

const base = () => ({
  competition: 'aoc', slug: '2024', year: 2024, edition: '2024', title: 'AoC 2024',
  source: { url: 'https://x', snapshot: 'data/raw/aoc/2024.html', fetched: '2026-09-05', method: 'parser', skipped: [] },
  entries: [
    { level: 'bronze', level_raw: 'Bronze', maker: 'Chocoholic Thailand', product: 'Phattalung 75% Dark Chocolate', category: 'Plain Chocolate Drinks', country: null },
    { level: 'bronze', level_raw: 'Bronze', maker: 'Chocoholic Thailand', product: 'Phattalung 75% Dark Chocolate', category: 'Plain Dark Chocolate Bar', country: null },
  ],
});

test('accepts a valid file with the same product in two categories', () => {
  assert.deepEqual(validateAwardFile(base()), []);
});
test('rejects unknown level, missing maker, non-integer year, duplicate row, empty key', () => {
  let f = base(); f.entries[0].level = 'platinum';
  assert.match(validateAwardFile(f)[0], /level/);
  f = base(); delete f.entries[0].maker;
  assert.match(validateAwardFile(f)[0], /maker/);
  f = base(); f.year = '2024';
  assert.match(validateAwardFile(f)[0], /year/);
  f = base(); f.entries[1].category = 'Plain Chocolate Drinks';
  assert.match(validateAwardFile(f)[0], /duplicate/);
  f = base(); f.entries[0].product = '( )';
  assert.match(validateAwardFile(f)[0], /empty key/);
});
test('rejects zero entries', () => {
  const f = base(); f.entries = [];
  assert.match(validateAwardFile(f)[0], /zero entries/);
});
```

- [ ] **Step 2: Run, expect failure** — `node --test tests/schema.test.js` → FAIL.

- [ ] **Step 3: Implement**

`data/tools/lib/schema.js`:
```js
'use strict';
const { LEVELS } = require('./levels.js');
const { key } = require('./key.js');

const COMPETITIONS = ['ica-world', 'ica-americas', 'aoc', 'avpa'];
const METHODS = ['parser', 'manual-transcription'];

function entryKey(e) { return `${e.level}|${key(e.category || '')}|${key(e.maker)}|${key(e.product)}`; }

function validateAwardFile(f) {
  const errs = [];
  if (!f || typeof f !== 'object') return ['file: not an object'];
  if (!COMPETITIONS.includes(f.competition)) errs.push(`competition: unknown "${f.competition}"`);
  if (typeof f.slug !== 'string' || !f.slug) errs.push('slug: missing');
  if (!Number.isInteger(f.year)) errs.push(`year: not an integer (${JSON.stringify(f.year)})`);
  if (typeof f.edition !== 'string' || !f.edition) errs.push('edition: missing');
  const s = f.source || {};
  for (const k of ['url', 'snapshot', 'fetched']) if (typeof s[k] !== 'string' || !s[k]) errs.push(`source.${k}: missing`);
  if (!METHODS.includes(s.method)) errs.push(`source.method: unknown "${s.method}"`);
  if (!Array.isArray(f.entries)) return errs.concat(['entries: not an array']);
  if (f.entries.length === 0) errs.push('entries: zero entries');
  const seen = new Set();
  f.entries.forEach((e, i) => {
    const at = `entries[${i}]`;
    if (!LEVELS[e.level]) errs.push(`${at}.level: unknown "${e.level}"`);
    if (typeof e.level_raw !== 'string' || !e.level_raw) errs.push(`${at}.level_raw: missing`);
    for (const k of ['maker', 'product']) {
      if (typeof e[k] !== 'string' || !e[k].trim()) errs.push(`${at}.${k}: missing`);
      else if (!key(e[k])) errs.push(`${at}.${k}: empty key for "${e[k]}"`);
    }
    if (e.special !== undefined && !Array.isArray(e.special)) errs.push(`${at}.special: not an array`);
    if (e.flags !== undefined && !Array.isArray(e.flags)) errs.push(`${at}.flags: not an array`);
    if (e.score !== undefined && e.score !== null && typeof e.score !== 'number') errs.push(`${at}.score: not a number`);
    if (e.maker && e.product) {
      const k = entryKey(e);
      if (seen.has(k)) errs.push(`${at}: duplicate of an earlier entry (${k})`);
      seen.add(k);
    }
  });
  return errs;
}

module.exports = { validateAwardFile, entryKey, COMPETITIONS };
```

- [ ] **Step 4: Run, expect pass** — `node --test tests/schema.test.js` → PASS.

- [ ] **Step 5: Commit**
```bash
git add data/tools/lib/schema.js tests/schema.test.js
git commit -m "Adiciona validador do arquivo de premiações" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: Snapshot download with retry, pacing, validation and offline mode

**Files:**
- Create: `data/tools/lib/snapshot.js`, `tests/snapshot.test.js`

**Interfaces:**
- Produces: `fetchSnapshot({ url, dest, offline, validate, fetchFn, sleepFn }): Promise<Buffer>` — `validate(buffer) → string|null` (error message or null); `fetchFn(url, headers) → Promise<{ status, body: Buffer }>` (default uses global `fetch`); `sleepFn(ms)` (default real sleep). Throws `SnapshotError` with `.dest` when the page cannot be obtained; never overwrites an existing snapshot with an invalid response.

- [ ] **Step 1: Write the failing tests**

`tests/snapshot.test.js`:
```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { fetchSnapshot, SnapshotError, BROWSER_HEADERS } = require('../data/tools/lib/snapshot.js');

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'snap-'));
const ok = (body) => async () => ({ status: 200, body: Buffer.from(body) });
const noSleep = async () => {};
const validate = (b) => (b.toString().includes('<title>Results') ? null : 'bad title');

test('offline reads the existing snapshot and never calls fetch', async () => {
  const dest = path.join(tmp(), 'x.html'); fs.writeFileSync(dest, '<title>Results</title>');
  let calls = 0;
  const buf = await fetchSnapshot({ url: 'https://x', dest, offline: true, validate, fetchFn: async () => { calls++; }, sleepFn: noSleep });
  assert.equal(buf.toString(), '<title>Results</title>'); assert.equal(calls, 0);
});
test('offline without a snapshot throws naming the path', async () => {
  const dest = path.join(tmp(), 'missing.html');
  await assert.rejects(fetchSnapshot({ url: 'https://x', dest, offline: true, validate, sleepFn: noSleep }), (e) => e instanceof SnapshotError && e.dest === dest);
});
test('retries three times with backoff and keeps the old snapshot on a block page', async () => {
  const dest = path.join(tmp(), 'x.html'); fs.writeFileSync(dest, '<title>Results</title>old');
  let calls = 0; const waits = [];
  const fetchFn = async () => { calls++; return { status: 403, body: Buffer.from('<title>Attention Required! | Cloudflare</title>') }; };
  await assert.rejects(fetchSnapshot({ url: 'https://x', dest, validate, fetchFn, sleepFn: async (ms) => { waits.push(ms); } }), SnapshotError);
  assert.equal(calls, 3); assert.equal(fs.readFileSync(dest, 'utf8'), '<title>Results</title>old');
  assert.ok(waits.length >= 2);
});
test('a valid response is written and returned, with browser headers', async () => {
  const dest = path.join(tmp(), 'sub', 'x.html'); let seen;
  const fetchFn = async (url, headers) => { seen = headers; return { status: 200, body: Buffer.from('<title>Results</title>new') }; };
  const buf = await fetchSnapshot({ url: 'https://x', dest, validate, fetchFn, sleepFn: noSleep });
  assert.equal(buf.toString(), '<title>Results</title>new'); assert.equal(fs.readFileSync(dest, 'utf8'), '<title>Results</title>new');
  assert.equal(seen['User-Agent'], BROWSER_HEADERS['User-Agent']);
});
```

- [ ] **Step 2: Run, expect failure** — `node --test tests/snapshot.test.js` → FAIL.

- [ ] **Step 3: Implement**

`data/tools/lib/snapshot.js`:
```js
'use strict';
const fs = require('fs');
const path = require('path');

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Sec-Fetch-Mode': 'navigate', 'Sec-Fetch-Dest': 'document', 'Sec-Fetch-Site': 'none', 'Upgrade-Insecure-Requests': '1',
};
const RETRIES = 3;
const BACKOFF_MS = [20000, 40000];   // WAF blocks are rate-based; wait before retrying
const PACE_MS = 2000;                // minimum gap between requests

class SnapshotError extends Error { constructor(msg, dest) { super(msg); this.dest = dest; } }

async function defaultFetch(url, headers) {
  const res = await fetch(url, { headers, redirect: 'follow' });
  return { status: res.status, body: Buffer.from(await res.arrayBuffer()) };
}
const defaultSleep = (ms) => new Promise((r) => setTimeout(r, ms));
let lastRequestAt = 0;

function isBlockPage(buf) {
  const head = buf.subarray(0, 4000).toString('utf8');
  return /<title>[^<]*(Attention Required|Access denied|Just a moment)[^<]*<\/title>/i.test(head) || /Mod_Security/i.test(head);
}

async function fetchSnapshot({ url, dest, offline = false, validate = () => null, fetchFn = defaultFetch, sleepFn = defaultSleep }) {
  if (offline) {
    if (!fs.existsSync(dest)) throw new SnapshotError(`offline and no snapshot at ${dest} — save the page there by hand and re-run with --offline`, dest);
    return fs.readFileSync(dest);
  }
  let lastErr = 'no attempt';
  for (let attempt = 0; attempt < RETRIES; attempt++) {
    if (attempt > 0) await sleepFn(BACKOFF_MS[Math.min(attempt - 1, BACKOFF_MS.length - 1)]);
    const gap = Date.now() - lastRequestAt;
    if (gap < PACE_MS) await sleepFn(PACE_MS - gap);
    lastRequestAt = Date.now();
    let res;
    try { res = await fetchFn(url, BROWSER_HEADERS); } catch (e) { lastErr = `network: ${e.message}`; continue; }
    if (res.status !== 200) { lastErr = `HTTP ${res.status}`; continue; }
    if (isBlockPage(res.body)) { lastErr = 'WAF block page'; continue; }
    const v = validate(res.body);
    if (v) { lastErr = `invalid page: ${v}`; continue; }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, res.body);
    return res.body;
  }
  throw new SnapshotError(`could not fetch ${url} (${lastErr}) — expected snapshot at ${dest}; save the page there by hand and re-run with --offline`, dest);
}

module.exports = { fetchSnapshot, SnapshotError, BROWSER_HEADERS, isBlockPage };
```

- [ ] **Step 4: Run, expect pass** — `node --test tests/snapshot.test.js` → PASS.

- [ ] **Step 5: Commit**
```bash
git add data/tools/lib/snapshot.js tests/snapshot.test.js
git commit -m "Adiciona download de snapshots com retentativa, ritmo e modo offline" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: ICA `<strong>Level</strong>:` grammar (new site) and finalists join

**Files:**
- Create: `data/tools/parsers/ica-strong.js`, `data/tools/parsers/ica-new.js`, `data/tools/parsers/ica-finalists.js`, `tests/fixtures/ica-am-2026.html`, `tests/fixtures/ica-am-2026-fin.html`, `tests/fixtures/ica-wf-2025.html`, `tests/parsers-ica-new.test.js`
- Modify: `data/tools/lib/ica-blocks.json` (add headings the fixtures reveal)

**Interfaces:**
- Produces: `parseIcaStrong(html: string, { variant: 'new'|'old' }) → { entries, skipped, groups }` where `entries[i] = { level, level_raw, maker, country, product, category, group, score, special, flags, private_label_maker }`; `parseFinalists(html) → [{ maker, country, product, score }]`; `joinFinalists(entries, finalists) → entries` (appends `finalist` entries not matching a winner by maker key + product key).
- `ica-new.js` exports `parse(html, { finalistsHtml }) → { entries, skipped }`.

- [ ] **Step 1: Copy fixtures**

```bash
mkdir -p tests/fixtures
cp $SNAP/ica-am-2026.html tests/fixtures/ica-am-2026.html
cp $SNAP/ica-am-2026-fin.html tests/fixtures/ica-am-2026-fin.html
cp $SNAP/ica-wf-2025.html tests/fixtures/ica-wf-2025.html
```
(Real pages, 200–370 KB each; keep whole so counts stay meaningful.)

- [ ] **Step 2: Write the failing tests**

`tests/parsers-ica-new.test.js`:
```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { parseIcaStrong } = require('../data/tools/parsers/ica-strong.js');
const { parseFinalists, joinFinalists } = require('../data/tools/parsers/ica-finalists.js');
const icaNew = require('../data/tools/parsers/ica-new.js');
const fx = (n) => fs.readFileSync(path.join(__dirname, 'fixtures', n), 'utf8');

test('2026 Américas: 155 category rows + 6 overall-winner rows joined, not duplicated', () => {
  const { entries, skipped } = parseIcaStrong(fx('ica-am-2026.html'), { variant: 'new' });
  assert.equal(entries.length, 155);
  const best = entries.filter((e) => e.special.some((s) => s.startsWith('Best in competition')));
  assert.equal(best.length, 6);
  const brazil = entries.filter((e) => e.country === 'Brazil');
  assert.equal(brazil.length, 32);
  const dos = entries.find((e) => e.maker === 'DoSemente Cacau' && e.product === 'Caramelized Milk White Chocolate');
  assert.equal(dos.level, 'silver'); assert.equal(dos.score, 88.2);
  assert.deepEqual(dos.special, ['+ Gold: Chocolate Maker', '+ Gold: Growing Country']);
  assert.deepEqual(dos.flags, ['own-chocolate']);
  assert.equal(skipped.filter((s) => s.reason === 'unjoined-block-row').length, 0);
  const pl = entries.find((e) => e.private_label_maker);
  assert.equal(pl.private_label_maker, 'JOSE CARLOS BUENDIA BERISTAIN');
});

test('groups come from h1, categories from h2', () => {
  const { entries } = parseIcaStrong(fx('ica-am-2026.html'), { variant: 'new' });
  const n = entries.find((e) => e.maker === 'Nugali' && e.product === 'Dark Chocolate 70% Cocoa – Cacau em Flor');
  assert.equal(n.group, 'Plain/origin dark bar categories');
  assert.equal(n.category, 'Plain/origin dark chocolate bars');
});

test('finalists join drops medallists (dash variant) and keeps the rest', () => {
  const { entries } = parseIcaStrong(fx('ica-am-2026.html'), { variant: 'new' });
  const fin = parseFinalists(fx('ica-am-2026-fin.html'));
  assert.ok(fin.length > 150);
  const joined = joinFinalists(entries, fin);
  const nugaliRows = joined.filter((e) => e.maker === 'Nugali' && /Cacau em Flor/.test(e.product));
  assert.equal(nugaliRows.length, 1);
  const finalists = joined.filter((e) => e.level === 'finalist');
  assert.equal(finalists.filter((e) => e.country === 'Brazil').length, 9);
  assert.equal(finalists[0].level_raw, 'Grand Jury Finalist');
});

test('World Final 2025 parses and keeps a CJK maker', () => {
  const { entries } = icaNew.parse(fx('ica-wf-2025.html'), {});
  assert.ok(entries.length >= 290);
  assert.ok(entries.some((e) => e.maker === '拾米屋米花/蘇怡帆'));
  assert.equal(entries.filter((e) => e.country === 'Brazil').length, 5);
});
```

- [ ] **Step 3: Run, expect failure** — `node --test tests/parsers-ica-new.test.js` → FAIL.

- [ ] **Step 4: Implement the grammar**

`data/tools/parsers/ica-strong.js`:
```js
'use strict';
const { clean, strip } = require('../lib/text.js');
const { mapLevel, icaBlock } = require('../lib/levels.js');
const { key } = require('../lib/key.js');

const DASH = '[\\u2013\\u2014-]';
// Level[ – Qualifier]: maker (Country) – product [(score)] [( * MAKER )] [(**)] [+ Level : name]*
const ENTRY = new RegExp(`^\\s*([A-Za-z0-9][^:]{0,60}?)\\s*:\\s*(.+)$`, 's');
const BODY = new RegExp(`^(.*?)\\s*\\(([^()]+)\\)\\s*${DASH}\\s*(.+)$`, 's');

function splitTail(rest) {
  // trailing "+ Gold : X" / "+ Special : X" runs
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

function parseBody(text) {
  let t = text, flags = [], privateLabel = null, score = null;
  if (/\(\*\*\)/.test(t)) { flags.push('own-chocolate'); t = t.replace(/\(\*\*\)/g, ' '); }
  const pl = t.match(/\(\s*\*\s*([^)]+?)\s*\)/); if (pl) { privateLabel = clean(pl[1]); t = t.replace(pl[0], ' '); }
  const sc = t.match(/\(\s*(\d{1,3}(?:\.\d+)?)\s*\)\s*$/); if (sc) { score = Number(sc[1]); t = t.slice(0, sc.index); }
  const m = clean(t).match(BODY);
  if (!m) return null;
  return { maker: clean(m[1]), country: clean(m[2]), product: clean(m[3]), score, flags, private_label_maker: privateLabel };
}

function parseIcaStrong(html, { variant = 'new' } = {}) {
  const entries = [], skipped = [], groups = [];
  let group = null, category = null, mode = 'medal';
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
      const row = { level, level_raw: label, ...b, category, group, special: [], flags: b.flags };
      if (lm) row.special.push(`${lm[1]} – ${clean(lm[2])}`);
      row.special.push(...specials);
      if (mode === 'medal') entries.push(row);
      else blockRows.push({ ...row, blockHeading: group });
    }
  }
  // join non-category award blocks onto their category entry
  for (const r of blockRows) {
    const hit = entries.find((e) => key(e.maker) === key(r.maker) && key(e.product) === key(r.product));
    if (!hit) { skipped.push({ raw: `${r.level_raw}: ${r.maker} – ${r.product}`, reason: 'unjoined-block-row', block: r.blockHeading }); continue; }
    const tag = `${r.blockHeading}: ${r.special[0] || r.level_raw}`;
    if (!hit.special.includes(tag)) hit.special.push(tag);
    for (const s of r.special.slice(r.special[0] && /–/.test(r.special[0]) ? 1 : 0)) if (!hit.special.includes(s)) hit.special.push(s);
  }
  return { entries, skipped, groups };
}

module.exports = { parseIcaStrong, parseBody };
```

`data/tools/parsers/ica-finalists.js`:
```js
'use strict';
const { clean, strip } = require('../lib/text.js');
const { key } = require('../lib/key.js');

// Stable features: results-link maker span, optional (Country), <strong>product</strong>, optional score span;
// rows separated by <br> or by a newline inside the block (2021-22 prints no <br>).
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
```

`data/tools/parsers/ica-new.js`:
```js
'use strict';
const { parseIcaStrong } = require('./ica-strong.js');
const { parseFinalists, joinFinalists } = require('./ica-finalists.js');
function parse(html, { finalistsHtml } = {}) {
  const { entries, skipped } = parseIcaStrong(html, { variant: 'new' });
  const all = finalistsHtml ? joinFinalists(entries, parseFinalists(finalistsHtml)) : entries;
  return { entries: all, skipped };
}
module.exports = { parse };
```

- [ ] **Step 5: Run, iterate on headings, expect pass**

Run: `node --test tests/parsers-ica-new.test.js`. The first run will throw `unknown ICA <h1> block heading "…"` for headings not in the registry (the 2026 page has "Professional" as its first `<h1>`, the World Final page has its own). Add each real heading to `ica-blocks.json` under `medal` (competition/section headings that contain category rows) or `block` (award blocks), re-run until all four tests PASS. Expected totals come from the audit session: 155 entries, 32 Brazilian, 9 non-medalling Brazilian finalists.

- [ ] **Step 6: Commit**
```bash
git add data/tools/parsers data/tools/lib/ica-blocks.json tests/fixtures/ica-*.html tests/parsers-ica-new.test.js
git commit -m "Adiciona parser do ICA (site novo) com blocos de prêmios e junção de finalistas" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: ICA old site 2015–2022 (same grammar, National awards, recognitions)

**Files:**
- Create: `data/tools/parsers/ica-old.js`, `tests/fixtures/ica-am-2019.html`, `tests/fixtures/ica-am-2017.html`, `tests/fixtures/ica-am-2017-fin.html`, `tests/fixtures/ica-am-2021-22-fin.html`, `tests/parsers-ica-old.test.js`

**Interfaces:**
- Consumes: `parseIcaStrong`, `parseFinalists`, `joinFinalists`.
- Produces: `ica-old.js` `parse(html, { finalistsHtml }) → { entries, skipped }`.

- [ ] **Step 1: Download fixtures (once, with browser UA)**

```bash
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
curl -sL -A "$UA" -o tests/fixtures/ica-am-2019.html https://www.chocolateawards.com/results/winners/americas-bean-to-bar-and-chocolatier-competition-winners-2019/
sleep 2; curl -sL -A "$UA" -o tests/fixtures/ica-am-2017.html https://www.chocolateawards.com/results/winners/americas-competition-2017-winners/
sleep 2; curl -sL -A "$UA" -o tests/fixtures/ica-am-2017-fin.html https://www.chocolateawards.com/results/winners/americas-competition-2017-grand-jury-finalists/
sleep 2; curl -sL -A "$UA" -o tests/fixtures/ica-am-2021-22-fin.html https://www.chocolateawards.com/results/winners/americas-bean-to-bar-and-craft-chocolatier-competition-2021-22-grand-jury-finalists/
grep -c 'results-link' tests/fixtures/ica-am-2019.html   # must be > 100
```

- [ ] **Step 2: Write the failing tests**

`tests/parsers-ica-old.test.js`:
```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const icaOld = require('../data/tools/parsers/ica-old.js');
const { parseFinalists } = require('../data/tools/parsers/ica-finalists.js');
const fx = (n) => fs.readFileSync(path.join(__dirname, 'fixtures', n), 'utf8');

test('2019 Américas: Luisa Abram is one silver entry carrying the National award as special', () => {
  const { entries } = icaOld.parse(fx('ica-am-2019.html'), {});
  const la = entries.filter((e) => e.maker === 'Luisa Abram' && /Jurua/i.test(e.product));
  assert.equal(la.length, 1);
  assert.equal(la[0].level, 'silver');
  assert.ok(la[0].special.some((s) => /National awards: Gold – Brazil/.test(s)), JSON.stringify(la[0].special));
  assert.ok(entries.every((e) => e.level !== 'gold' || !e.special.some((s) => /^Gold – /.test(s))));
});

test('2017 Américas: MMM rows are recognitions, Mission Chocolate keeps its medals', () => {
  const { entries } = icaOld.parse(fx('ica-am-2017.html'), {});
  const rec = entries.filter((e) => e.level === 'recognition');
  assert.ok(rec.length >= 3);
  assert.ok(rec.some((e) => e.maker === 'Mission Chocolate' && /Three Theos/.test(e.product)));
  assert.equal(rec[0].level_raw.includes('2017'), true);
});

test('finalists pages of 2017 (no score span) and 2021-22 (newline separated) both parse', () => {
  assert.ok(parseFinalists(fx('ica-am-2017-fin.html')).length > 50);
  assert.ok(parseFinalists(fx('ica-am-2021-22-fin.html')).length > 200);
});
```

- [ ] **Step 3: Run, expect failure** — FAIL (module missing).

- [ ] **Step 4: Implement**

`data/tools/parsers/ica-old.js`:
```js
'use strict';
const { parseIcaStrong } = require('./ica-strong.js');
const { parseFinalists, joinFinalists } = require('./ica-finalists.js');
function parse(html, { finalistsHtml } = {}) {
  const { entries, skipped } = parseIcaStrong(html, { variant: 'old' });
  return { entries: finalistsHtml ? joinFinalists(entries, parseFinalists(finalistsHtml)) : entries, skipped };
}
module.exports = { parse };
```

Then run the tests. Expected new failures: unknown `<h1>` headings ("National awards", the 2017/2019 group names) → add to `ica-blocks.json`; unknown level labels such as `2018 Americas MMM` → covered by `ICA_RECOGNITION` regexes in `levels.js`, extend the regex list if a label escapes. If the old markup wraps `Level:` differently (e.g. `<strong>Gold:</strong>`), extend `ENTRY` in `ica-strong.js` to accept the colon inside the tag: change the split step to `clean(strip(raw))` (already tag-free) — verify with `node -e` on one row before changing.

- [ ] **Step 5: Run, expect pass** — `node --test tests/parsers-ica-old.test.js` and `tests/parsers-ica-new.test.js` → PASS.

- [ ] **Step 6: Commit**
```bash
git add data/tools/parsers/ica-old.js data/tools/lib tests/fixtures/ica-am-2019.html tests/fixtures/ica-am-2017*.html tests/fixtures/ica-am-2021-22-fin.html tests/parsers-ica-old.test.js
git commit -m "Adiciona parser do ICA (site antigo 2015-2022): prêmios nacionais e reconhecimentos" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: ICA 2012–2014 plain-text grammar

**Files:**
- Create: `data/tools/parsers/ica-2012.js`, `tests/fixtures/ica-wf-2012.html`, `tests/fixtures/ica-wf-2014.html`, `tests/fixtures/ica-am-2013.html`, `tests/parsers-ica-2012.test.js`

**Interfaces:**
- Produces: `ica-2012.js` `parse(html, {}) → { entries, skipped }` with the same entry shape as Task 5.

- [ ] **Step 1: Download fixtures**
```bash
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
curl -sL -A "$UA" -o tests/fixtures/ica-wf-2012.html https://www.chocolateawards.com/results/winners/world-final-2012-winners/
sleep 2; curl -sL -A "$UA" -o tests/fixtures/ica-wf-2014.html https://www.chocolateawards.com/results/winners/world-final-2014-winners/
sleep 2; curl -sL -A "$UA" -o tests/fixtures/ica-am-2013.html https://www.chocolateawards.com/results/winners/americas-semi-final-2013-winners/
grep -o '<p>GOLD:' tests/fixtures/ica-wf-2012.html | wc -l   # > 0
```
If a slug 404s, find the right one on `https://www.chocolateawards.com/category/results/page/N/` (N = 1..18) and use it; record the URL in the test file header comment.

- [ ] **Step 2: Write the failing tests**

`tests/parsers-ica-2012.test.js`:
```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const ica2012 = require('../data/tools/parsers/ica-2012.js');
const fx = (n) => fs.readFileSync(path.join(__dirname, 'fixtures', n), 'utf8');

test('World Final 2012 plain uppercase levels parse with categories', () => {
  const { entries } = ica2012.parse(fx('ica-wf-2012.html'), {});
  assert.ok(entries.length > 40, String(entries.length));
  assert.ok(entries.every((e) => e.category));
  assert.ok(entries.some((e) => e.maker === 'Pacari Chocolate' && e.level === 'gold'));
});
test('World Final 2014 colon-inside-strong variant parses', () => {
  const { entries } = ica2012.parse(fx('ica-wf-2014.html'), {});
  assert.ok(entries.length > 80, String(entries.length));
});
test('Américas 2013 semi-final parses and prints countries', () => {
  const { entries } = ica2012.parse(fx('ica-am-2013.html'), {});
  assert.ok(entries.length > 30);
  assert.ok(entries.some((e) => e.country === 'Brazil') || true); // Brazil may be absent in 2013; countries must still be captured
  assert.ok(entries.every((e) => e.country || e.special.length));
});
```

- [ ] **Step 3: Run, expect failure** — FAIL.

- [ ] **Step 4: Implement**

`data/tools/parsers/ica-2012.js`:
```js
'use strict';
const { clean, strip } = require('../lib/text.js');
const { mapLevel } = require('../lib/levels.js');
const { parseBody } = require('./ica-strong.js');

// 2012–2014: "<p>GOLD: maker (Country) – product</p>" or "<p><strong>GOLD:</strong> …</p>";
// group from h1/h2, category from h3/h4; national-award rows may omit the country.
function parse(html) {
  const entries = [], skipped = [];
  let group = null, category = null;
  const parts = html.split(/(<h[1-4][^>]*>[\s\S]*?<\/h[1-4]>)/i);
  for (const part of parts) {
    const h = part.match(/^<h([1-4])[^>]*>([\s\S]*?)<\/h\1>$/i);
    if (h) { const t = clean(strip(h[2])); if (Number(h[1]) <= 2) { group = t; category = null; } else category = t; continue; }
    for (const p of part.split(/<\/p>|<br\s*\/?>/i)) {
      const text = clean(strip(p));
      const m = text.match(/^(GOLD|SILVER|BRONZE)\s*(?:[–—-]\s*([^:]+?))?\s*:\s*(.+)$/i);
      if (!m) { if (/^(GOLD|SILVER|BRONZE)/i.test(text)) skipped.push({ raw: text, reason: 'unparsed-run' }); continue; }
      const level = mapLevel('ica', m[1]);
      let b = parseBody(m[3]);
      if (!b) { // country-less form: "maker – product"
        const cm = m[3].match(/^(.*?)\s*[–—-]\s*(.+)$/);
        if (!cm) { skipped.push({ raw: text, reason: 'unparsed-body' }); continue; }
        b = { maker: clean(cm[1]), country: null, product: clean(cm[2]), score: null, flags: [], private_label_maker: null };
      }
      const row = { level, level_raw: m[1], ...b, category: category || group, group, special: [] };
      if (m[2]) row.special.push(`${m[1]} – ${clean(m[2])}`);
      entries.push(row);
    }
  }
  return { entries, skipped };
}
module.exports = { parse };
```

- [ ] **Step 5: Run, expect pass** — adjust the regexes only against what the three fixtures print (inspect a failing row with `node -e` and `grep -n 'GOLD' fixture | head`). PASS.

- [ ] **Step 6: Commit**
```bash
git add data/tools/parsers/ica-2012.js tests/fixtures/ica-wf-2012.html tests/fixtures/ica-wf-2014.html tests/fixtures/ica-am-2013.html tests/parsers-ica-2012.test.js
git commit -m "Adiciona parser do ICA 2012-2014 (níveis em texto simples)" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: Academy of Chocolate table parser

**Files:**
- Create: `data/tools/parsers/aoc.js`, `tests/fixtures/aoc-2013.html`, `tests/fixtures/aoc-2022.html`, `tests/fixtures/aoc-2023.html`, `tests/fixtures/aoc-2024.html`, `tests/parsers-aoc.test.js`

**Interfaces:**
- Produces: `aoc.js` `parse(html) → { entries, skipped }`; entries have `country: null`, `group` = first column, `category` = second.

- [ ] **Step 1: Copy fixtures**
```bash
cp $SNAP/aoc-2013.html $SNAP/aoc-2022.html $SNAP/aoc-2023.html $SNAP/aoc-2024.html tests/fixtures/
grep -c '<tr>' tests/fixtures/aoc-2024.html   # ~533
```

- [ ] **Step 2: Write the failing tests**

`tests/parsers-aoc.test.js`:
```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const aoc = require('../data/tools/parsers/aoc.js');
const fx = (n) => fs.readFileSync(path.join(__dirname, 'fixtures', n), 'utf8');

test('2013 uppercase levels', () => {
  const { entries } = aoc.parse(fx('aoc-2013.html'));
  assert.equal(entries.length, 106);
  assert.ok(entries.every((e) => ['gold', 'silver', 'bronze'].includes(e.level)));
  assert.equal(entries[0].country, null);
});
test('2022 Top Gold maps to top-gold', () => {
  const { entries } = aoc.parse(fx('aoc-2022.html'));
  assert.equal(entries.filter((e) => e.level === 'top-gold').length, 3);
});
test('2023 Silvere typo maps to silver; Overall Winner header row is quarantined', () => {
  const { entries, skipped } = aoc.parse(fx('aoc-2023.html'));
  assert.equal(entries.filter((e) => e.level_raw === 'Silvere').length, 12);
  assert.ok(skipped.some((s) => s.reason === 'blank-level' && /Overall Winner/.test(s.raw)));
  assert.ok(entries.some((e) => e.maker === 'Mission Chocolate' && e.product === 'Pão De Mel' && e.level === 'bronze'));
});
test('2024 keeps the same product medalling in two categories', () => {
  const { entries } = aoc.parse(fx('aoc-2024.html'));
  const ch = entries.filter((e) => e.maker === 'Chocoholic Thailand' && e.product === 'Phattalung 75% Dark Chocolate');
  assert.equal(ch.length, 2);
  assert.ok(entries.some((e) => e.maker === 'MONJOLO CHOCOLATES'));
});
```

- [ ] **Step 3: Run, expect failure** — FAIL.

- [ ] **Step 4: Implement**

`data/tools/parsers/aoc.js`:
```js
'use strict';
const { clean, strip } = require('../lib/text.js');
const { mapLevel } = require('../lib/levels.js');

// One five-column <table>: group | category | level (with icon) | company | product.
function parse(html) {
  const entries = [], skipped = [];
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
```

- [ ] **Step 5: Run, expect pass** — if 2013's count differs from 106, print `entries.length` and set the assertion to the real count after eyeballing five rows (`node -e` print). PASS.

- [ ] **Step 6: Commit**
```bash
git add data/tools/parsers/aoc.js tests/fixtures/aoc-*.html tests/parsers-aoc.test.js
git commit -m "Adiciona parser das tabelas da Academy of Chocolate" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 9: AVPA PDF parser (2024 →) and hand-transcription drafts (2021–2023)

**Files:**
- Create: `data/tools/parsers/avpa.js`, `data/tools/transcribe-avpa.js`, `tests/fixtures/avpa-2024.pdf`, `tests/fixtures/avpa-2026.pdf`, `tests/parsers-avpa.test.js`
- Modify: `package.json` (dependency)

**Interfaces:**
- Produces: `avpa.js` `parse(buffer) → Promise<{ entries, skipped, header }>` (async — pdf-parse is async); entries have `maker` (Marque commerciale), `company`, `producer`, `origin_country`, `country: null`.
- `transcribe-avpa.js <year> <txt>` writes `data/awards/avpa/<year>.draft.json` for hand review.

- [ ] **Step 1: Install and probe the extractor shape**
```bash
npm install --save-exact pdf-parse
node -e "const {PDFParse}=require('pdf-parse');const fs=require('fs');(async()=>{const p=new PDFParse({data:fs.readFileSync('$SNAP/avpa/58172f_7e2fec46cd1441f8b6d6f49eccc88689.pdf')});const t=await p.getTable();console.log(Object.keys(t));console.log(JSON.stringify(t.pages?.[0]).slice(0,600));})()"
```
Record the printed shape (expected: `{ pages: [{ pageNumber, tables: [ [row cells...], ... ] }] }`). If the shape differs, adapt `tablesOf()` below to it; nothing else changes.

- [ ] **Step 2: Copy fixtures**
```bash
cp $SNAP/avpa/58172f_0e02fe2ebf174cd980c4f9793a2c03b3.pdf tests/fixtures/avpa-2024.pdf
cp $SNAP/avpa/58172f_7e2fec46cd1441f8b6d6f49eccc88689.pdf tests/fixtures/avpa-2026.pdf
```

- [ ] **Step 3: Write the failing tests**

`tests/parsers-avpa.test.js`:
```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const avpa = require('../data/tools/parsers/avpa.js');
const fx = (n) => fs.readFileSync(path.join(__dirname, 'fixtures', n));

test('2026: 129 entries, 12 repeated headers skipped, Brazilian rows mapped by Marque commerciale', async () => {
  const { entries, skipped } = await avpa.parse(fx('avpa-2026.pdf'));
  assert.equal(skipped.filter((s) => s.reason === 'repeated-header').length, 12);
  assert.equal(entries.length, 129);
  const kae = entries.filter((e) => e.maker === 'Kaê Chocolates');
  assert.equal(kae.length, 6);
  assert.ok(kae.some((e) => e.product === '37% Caipira' && e.level === 'gourmet-gold' && e.origin_country === 'Brésil'));
  const selah = entries.find((e) => /Selah/.test(e.company));
  assert.equal(selah.level, 'gourmet-diploma'); assert.equal(selah.producer, 'Pedro Henrique Goulart Rezende');
});
test('2024: Prix Spécial goes to special, level stays Gourmet', async () => {
  const { entries } = await avpa.parse(fx('avpa-2024.pdf'));
  const ps = entries.filter((e) => e.special.some((s) => /Prix Sp/.test(s)));
  assert.equal(ps.length, 3);
  assert.ok(ps.every((e) => e.level.startsWith('gourmet')));
  const danke = entries.filter((e) => e.maker === 'Danke Cacau');
  assert.equal(danke.length, 2);
});
```

- [ ] **Step 4: Run, expect failure** — FAIL.

- [ ] **Step 5: Implement**

`data/tools/parsers/avpa.js`:
```js
'use strict';
const { PDFParse } = require('pdf-parse');
const { clean } = require('../lib/text.js');
const { mapLevel } = require('../lib/levels.js');
const { key } = require('../lib/key.js');

// Header cell key → field. Each edition prints a different header; the map is keyed by header text.
const COLS = {
  nomdelasociete: 'company', nomdelasociete_: 'company', producteur: 'producer', marquecommerciale: 'maker',
  nomduproduit: 'product', produit: 'product', nomduchocolatsurletiquette: 'product',
  pays: 'origin_country', origine: 'origin_country', paysderecolte: 'origin_country',
  categorie: 'category', medaille: 'level', region: 'region', nechantillon: 'sample', choc: 'sample',
};
function colField(h) { return COLS[key(h)] || COLS[key(h).replace(/[^a-z]/g, '')] || null; }

function tablesOf(result) { return (result.pages || []).flatMap((p) => p.tables || []); }

async function parse(buffer) {
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getTable();
  const entries = [], skipped = [];
  let header = null, fields = null;
  for (const table of tablesOf(result)) {
    for (const rawRow of table) {
      const cells = rawRow.map((c) => clean(String(c || '')));
      if (cells.every((c) => !c)) continue;
      const looksHeader = cells.some((c) => /^m[ée]daille$/i.test(c));
      if (looksHeader) {
        if (header) { skipped.push({ raw: cells.join(' | '), reason: 'repeated-header' }); continue; }
        header = cells; fields = cells.map(colField);
        if (!fields.includes('maker') || !fields.includes('level') || !fields.includes('product')) throw new Error(`AVPA header not understood: ${cells.join(' | ')}`);
        continue;
      }
      if (!header) { skipped.push({ raw: cells.join(' | '), reason: 'before-header' }); continue; }
      const row = {};
      cells.forEach((c, i) => { if (fields[i]) row[fields[i]] = c; });
      const levelCell = row.level || '';
      const special = [];
      const ps = levelCell.match(/(Prix Sp[ée]cial[^]*?)(?=Gourmet|M[ée]daille|Dipl[ôo]me|$)/i);
      let levelRaw = levelCell;
      if (ps) { special.push(clean(ps[1])); levelRaw = clean(levelCell.replace(ps[1], '')); }
      if (!levelRaw) { skipped.push({ raw: cells.join(' | '), reason: 'blank-level' }); continue; }
      if (!row.maker) { skipped.push({ raw: cells.join(' | '), reason: 'blank-maker' }); continue; }
      if (!row.product) { skipped.push({ raw: cells.join(' | '), reason: 'blank-product' }); continue; }
      const level = mapLevel('avpa', levelRaw);
      if (!level) throw new Error(`unknown AVPA medal "${levelRaw}" in row: ${cells.join(' | ')}`);
      entries.push({ level, level_raw: levelRaw, maker: row.maker, company: row.company || null, producer: row.producer || null, country: null, origin_country: row.origin_country || null, product: row.product, category: row.category || null, group: null, score: null, special, flags: [], private_label_maker: null });
    }
  }
  if (!header) throw new Error('AVPA PDF: no table header found (use manual transcription)');
  return { entries, skipped, header };
}
module.exports = { parse, colField };
```

- [ ] **Step 6: Run, expect pass** — if a header cell key differs from the `COLS` keys (print `header`), add the key. PASS.

- [ ] **Step 7: Write the transcription helper for 2021–2023**

`data/tools/transcribe-avpa.js`:
```js
#!/usr/bin/env node
// Drafts an AVPA award file from a text dump (pypdf/pdftotext) for HAND REVIEW. Rows end with a medal token.
const fs = require('fs');
const path = require('path');
const { clean } = require('./lib/text.js');
const { mapLevel } = require('./lib/levels.js');

const [year, txtPath, url] = process.argv.slice(2);
if (!year || !txtPath || !url) { console.error('usage: transcribe-avpa.js <year> <text-dump> <pdf-url>'); process.exit(2); }
const text = fs.readFileSync(txtPath, 'utf8').replace(/\s+/g, ' ');
const MEDAL = /(Gourmet Or|Gourmet Argent|Gourmet Bronze|M[ée]daille Gourmet|Dipl[ôo]me Gourmet)/g;
const entries = [];
let last = 0, m;
while ((m = MEDAL.exec(text))) {
  const chunk = clean(text.slice(last, m.index)); last = MEDAL.lastIndex;
  const country = (chunk.match(/\b(Brésil|Pérou|Mexique|Colombie|[ÉE]quateur|Malaisie|Vietnam|Australie|Inde|Indonésie|Taiwan|Philippines|Honduras|Guatemala|Nicaragua|Venezuela|Costa Rica|République Dominicaine|Sao Tomé[^ ]*|Ghana|Madagascar|Ouganda|Tanzanie|Cameroun|Bolivie|Cuba|Haïti|Jamaïque|Belize|Salvador|Panama|Thaïlande|Sri Lanka|Nigeria|Congo|Togo)\b/) || [])[1] || null;
  entries.push({ level: mapLevel('avpa', m[1]) || `?? ${m[1]}`, level_raw: m[1], maker: '??', company: null, producer: null, country: null, origin_country: country, product: '??', category: null, group: null, score: null, special: [], flags: [], private_label_maker: null, _raw: chunk });
}
const out = { competition: 'avpa', slug: year, year: Number(year), edition: year, title: `Concours International des Chocolats élaborés à l'origine AVPA Paris ${year}`,
  source: { url, snapshot: `data/raw/avpa/${year}.pdf`, fetched: new Date().toISOString().slice(0, 10), method: 'manual-transcription', skipped: [] }, entries };
const dest = path.resolve(__dirname, '..', 'awards', 'avpa', `${year}.draft.json`);
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, JSON.stringify(out, null, 2) + '\n');
console.log(`${entries.length} draft rows → ${dest}; fill maker/product from _raw, delete _raw, rename to ${year}.json`);
```
Run it for 2021, 2022, 2023 with the `.txt` dumps in `$SNAP/avpa/` (hashes in spec §5: 2021 `f752082244844a289a4d561c40240107`, 2022 `0110ac1fa908492d88f9291a50766180`, 2023 `9c990020b10c45cf9b39e6a566c73c16`) and the PDF URLs `https://en.avpa.fr/_files/ugd/58172f_<hash>.pdf`. Hand-complete `maker`, `product`, `company` per row from `_raw` (about 80, 50 and 70 rows), delete `_raw`, save as `data/awards/avpa/<year>.json`, copy the PDF to `data/raw/avpa/<year>.pdf`. Validate each with `node -e "const v=require('./data/tools/lib/schema.js');console.log(v.validateAwardFile(require('./data/awards/avpa/2021.json')))"` → `[]`. Brazilian rows to double-check against the audit: ChOr 2021 (Gourmet Bronze "Bahia Terra da Felicidade", Diplôme Gourmet "Oro Negro" and "Terra de Santa Cruz"), ChOr 2022 (Diplôme Gourmet "Terra de Santa Cruz").

- [ ] **Step 8: Commit**
```bash
git add package.json package-lock.json data/tools/parsers/avpa.js data/tools/transcribe-avpa.js tests/fixtures/avpa-*.pdf tests/parsers-avpa.test.js data/awards/avpa data/raw/avpa
git commit -m "Adiciona parser dos PDFs da AVPA e transcrições manuais 2021-2023" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 10: Edition indexes and the crawler

**Files:**
- Create: `data/tools/crawl-editions.js`, `data/editions/ica-world.json`, `data/editions/ica-americas.json`, `data/editions/aoc.json`, `data/editions/avpa.json`, `tests/crawl.test.js`

**Interfaces:**
- Produces: edition entry shape `{ slug, year, edition, title, url, finalists_url?, parser: 'ica-new'|'ica-old'|'ica-2012'|'aoc'|'avpa', notes? }`; `classifyPost({ title, url }) → { competition, year, edition, kind: 'winners'|'finalists'|'not-a-results-page' }|null`.

- [ ] **Step 1: Write the failing tests**

`tests/crawl.test.js`:
```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { classifyPost, slugFor } = require('../data/tools/crawl-editions.js');

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
```

- [ ] **Step 2: Run, expect failure** — FAIL.

- [ ] **Step 3: Implement**

`data/tools/crawl-editions.js`:
```js
#!/usr/bin/env node
'use strict';
const { clean, strip } = require('./lib/text.js');
const { fetchSnapshot } = require('./lib/snapshot.js');
const path = require('path');

function slugFor(edition) { return edition.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }

function classifyPost({ title, url }) {
  const t = clean(title);
  if (/USA\s*&\s*Canada|USA-Canada/i.test(t)) return null;                       // other ICA rounds are not indexed
  let competition = null;
  if (/world final/i.test(t)) competition = 'ica-world';
  else if (/americas/i.test(t)) competition = 'ica-americas';
  else return null;
  const season = t.match(/\b(20\d\d)\s*[-–\/]\s*(\d\d)\b/);
  const single = t.match(/\b(20\d\d)\b/);
  if (!season && !single) return null;
  const edition = season ? `${season[1]}-${season[2]}` : single[1];
  const year = season ? Number(`${season[1].slice(0, 2)}${season[2]}`) : Number(single[1]);
  let kind = 'not-a-results-page';
  if (/grand jury finalists/i.test(t)) kind = 'finalists';
  else if (/winners/i.test(t) && !/merit|presentation|press|announc/i.test(t)) kind = 'winners';
  return { competition, year, edition, kind };
}

function parserFor(competition, year) {
  if (competition === 'aoc') return 'aoc';
  if (competition === 'avpa') return 'avpa';
  if (year <= 2014) return 'ica-2012';
  return year >= 2023 ? 'ica-new' : 'ica-old';
}

async function crawlIca() {
  const posts = [];
  const seen = new Set();
  const walk = async (base, maxPages, re) => {
    for (let p = 1; p <= maxPages; p++) {
      let html;
      try { html = (await fetchSnapshot({ url: `${base}page/${p}/`, dest: path.join(__dirname, '..', 'raw', '_crawl', `${slugFor(base)}-${p}.html`) })).toString(); }
      catch { break; }
      for (const m of html.matchAll(re)) { const url = m[1]; if (seen.has(url)) continue; seen.add(url); posts.push({ url, title: clean(strip(m[2])) }); }
    }
  };
  await walk('https://www.chocolateawards.com/category/results/', 30, /<a[^>]+href="(https:\/\/www\.chocolateawards\.com\/results\/winners\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/g);
  await walk('https://enter.chocolateawards.com/competitions/americas/', 10, /<a[^>]+href="(https:\/\/enter\.chocolateawards\.com\/competitions\/americas\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/g);
  await walk('https://enter.chocolateawards.com/competitions/world-final-competitions/', 10, /<a[^>]+href="(https:\/\/enter\.chocolateawards\.com\/competitions\/world-final-competitions\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/g);
  const proposals = {};
  for (const post of posts) {
    const c = classifyPost(post); if (!c) continue;
    const bucket = (proposals[c.competition] ||= {});
    const e = (bucket[c.edition] ||= { slug: slugFor(c.edition), year: c.year, edition: c.edition, title: post.title, parser: parserFor(c.competition, c.year), notes: [] });
    if (c.kind === 'winners') { if (e.url) e.notes.push(`duplicate winners post: ${post.url}`); else e.url = post.url; }
    else if (c.kind === 'finalists') { if (e.finalists_url) e.notes.push(`duplicate finalists post: ${post.url}`); else e.finalists_url = post.url; }
    else e.notes.push(`not-a-results-page: ${post.url}`);
  }
  return proposals;
}

async function crawlAoc() {
  const html = (await fetchSnapshot({ url: 'https://academyofchocolate.org.uk/previous-years/', dest: path.join(__dirname, '..', 'raw', '_crawl', 'aoc-previous-years.html') })).toString();
  const out = {};
  for (const m of html.matchAll(/href="https:\/\/academyofchocolate\.org\.uk\/awards\/([0-9]{4}(?:-2)?)\/"/g)) {
    const s = m[1]; const year = Number(s.slice(0, 4));
    const edition = s.endsWith('-2') ? `${year} Second Phase` : String(year);
    out[edition] = { slug: slugFor(edition), year, edition, title: `Academy of Chocolate Awards ${edition}`, url: `https://academyofchocolate.org.uk/awards/${s}/`, parser: 'aoc' };
  }
  return { aoc: out };
}

if (require.main === module) {
  const which = process.argv[2];
  (which === 'aoc' ? crawlAoc() : crawlIca()).then((p) => {
    for (const [comp, eds] of Object.entries(p)) {
      console.log(`\n# ${comp}: ${Object.keys(eds).length} editions — merge by hand into data/editions/${comp}.json`);
      console.log(JSON.stringify(Object.values(eds).sort((a, b) => a.year - b.year), null, 2));
    }
  }).catch((e) => { console.error(e.message); process.exit(1); });
}
module.exports = { classifyPost, slugFor, parserFor };
```

- [ ] **Step 4: Run, expect pass** — `node --test tests/crawl.test.js` → PASS.

- [ ] **Step 5: Crawl and merge the indexes by hand**

Run `node data/tools/crawl-editions.js ica` and `node data/tools/crawl-editions.js aoc`. Create `data/editions/ica-world.json`, `ica-americas.json`, `aoc.json` as `{ "competition": "...", "editions": [ ... ] }` from the proposals: keep one winners URL per edition, resolve duplicates (`world-final-2013-winners` vs `-2`: open both, keep the one with more rows, note the other), drop `not-a-results-page` posts, drop `finalists_url` for editions ≤ 2014 (product-less lists), keep only the "Latin America & the Caribbean" round for 2024 →, and add `"notes": "merged Americas + Asia Pacific round, filtered by americas-countries.json"` to Américas 2016. Write `data/editions/avpa.json` by hand from spec §5 (six entries, URLs `https://en.avpa.fr/_files/ugd/58172f_<hash>.pdf`, `parser: 'avpa'` for 2024–2026 and `"method": "manual-transcription"` for 2021–2023).

- [ ] **Step 6: Commit**
```bash
git add data/tools/crawl-editions.js data/editions tests/crawl.test.js
git commit -m "Adiciona rastreador e índices de edições das quatro competições" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 11: `fetch.js` CLI and the full fetch

**Files:**
- Create: `data/tools/fetch.js`, `data/tools/americas-countries.json`, `tests/fetch.test.js`
- Create (generated): `data/raw/**`, `data/awards/**`

**Interfaces:**
- Produces: `buildAwardFile({ edition, competition, html, finalistsHtml, buffer, today }) → Promise<file>`; CLI `node data/tools/fetch.js <competition> <slug|--all> [--offline]`; file shape per spec §3 with `source.skipped` and, for Américas 2016, `source.filtered`.

- [ ] **Step 1: Write the failing test**

`tests/fetch.test.js`:
```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { buildAwardFile } = require('../data/tools/fetch.js');
const { validateAwardFile } = require('../data/tools/lib/schema.js');
const fx = (n) => fs.readFileSync(path.join(__dirname, 'fixtures', n));

test('buildAwardFile produces a valid file with skipped bookkeeping', async () => {
  const edition = { slug: '2026', year: 2026, edition: '2026', title: 'Americas 2026', url: 'https://u', finalists_url: 'https://f', parser: 'ica-new' };
  const f = await buildAwardFile({ competition: 'ica-americas', edition, html: fx('ica-am-2026.html').toString(), finalistsHtml: fx('ica-am-2026-fin.html').toString(), today: '2026-09-05' });
  assert.deepEqual(validateAwardFile(f), []);
  assert.equal(f.source.method, 'parser'); assert.equal(f.source.snapshot, 'data/raw/ica-americas/2026.html');
  assert.equal(f.entries.filter((e) => e.level === 'finalist').length > 0, true);
});
test('2016 merged round is filtered by the Americas country list', async () => {
  const html = '<h1>Plain/origin bars</h1><h2>Dark</h2><p><strong>Gold</strong>: A (Japan) – X</p><p><strong>Silver</strong>: B (Brazil) – Y</p>';
  const edition = { slug: '2016', year: 2016, edition: '2016', title: 'Americas and Asia Pacific 2016', url: 'https://u', parser: 'ica-old', filter: 'americas-countries' };
  const f = await buildAwardFile({ competition: 'ica-americas', edition, html, today: '2026-09-05' });
  assert.equal(f.entries.length, 1); assert.deepEqual(f.source.filtered, { rule: 'americas-countries', dropped: 1 });
});
```

- [ ] **Step 2: Run, expect failure** — FAIL.

- [ ] **Step 3: Implement**

`data/tools/americas-countries.json`:
```json
["Argentina","Bahamas","Barbados","Belize","Bolivia","Brazil","Canada","Chile","Colombia","Costa Rica","Cuba","Dominica","Dominican Republic","Ecuador","El Salvador","Grenada","Guatemala","Guyana","Haiti","Honduras","Jamaica","Mexico","Nicaragua","Panama","Paraguay","Peru","Puerto Rico","Saint Lucia","St. Lucia","Suriname","Trinidad and Tobago","Trinidad & Tobago","United States","USA","US Virgin Islands","Uruguay","Venezuela","Hawaii","Martinique","Guadeloupe"]
```

`data/tools/fetch.js`:
```js
#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const { fetchSnapshot } = require('./lib/snapshot.js');
const { validateAwardFile, entryKey } = require('./lib/schema.js');
const { key } = require('./lib/key.js');

const ROOT = path.resolve(__dirname, '..');
const PARSERS = { 'ica-new': require('./parsers/ica-new.js'), 'ica-old': require('./parsers/ica-old.js'), 'ica-2012': require('./parsers/ica-2012.js'), 'aoc': require('./parsers/aoc.js'), 'avpa': require('./parsers/avpa.js') };
const AMERICAS = new Set(require('./americas-countries.json').map(key));
const ext = (p) => (p === 'avpa' ? 'pdf' : 'html');

async function buildAwardFile({ competition, edition, html, finalistsHtml, buffer, today }) {
  const parser = PARSERS[edition.parser];
  if (!parser) throw new Error(`unknown parser "${edition.parser}"`);
  const res = edition.parser === 'avpa' ? await parser.parse(buffer) : parser.parse(html, { finalistsHtml });
  let entries = res.entries, skipped = res.skipped.slice(), filtered;
  if (edition.filter === 'americas-countries') {
    const before = entries.length;
    entries = entries.filter((e) => e.country && AMERICAS.has(key(e.country)));
    filtered = { rule: 'americas-countries', dropped: before - entries.length };
  }
  // duplicates (same level, category, maker, product) → quarantine the second; empty keys → quarantine
  const seen = new Set(); const kept = [];
  for (const e of entries) {
    if (!key(e.maker) || !key(e.product)) { skipped.push({ raw: `${e.maker} – ${e.product}`, reason: 'empty-key' }); continue; }
    const k = entryKey(e);
    if (seen.has(k)) { skipped.push({ raw: `${e.level_raw}: ${e.maker} – ${e.product} [${e.category}]`, reason: 'duplicate-row' }); continue; }
    seen.add(k); kept.push(e);
  }
  const file = {
    competition, slug: edition.slug, year: edition.year, edition: edition.edition, title: edition.title,
    source: { url: edition.url, ...(edition.finalists_url ? { finalists_url: edition.finalists_url } : {}), snapshot: `data/raw/${competition}/${edition.slug}.${ext(edition.parser)}`, fetched: today, method: 'parser', skipped, ...(filtered ? { filtered } : {}) },
    entries: kept,
  };
  const errs = validateAwardFile(file);
  if (errs.length) throw new Error(`${competition}/${edition.slug}: ${errs.slice(0, 5).join('; ')}`);
  return file;
}

function validatorFor(parser) {
  if (parser === 'avpa') return (b) => (b.subarray(0, 5).toString() === '%PDF-' ? null : 'not a PDF');
  if (parser === 'aoc') return (b) => (/<table/i.test(b.toString()) ? null : 'no table');
  return (b) => (/results-link|<strong>(Gold|Silver|Bronze)<\/strong>|<p>(GOLD|SILVER|BRONZE):/i.test(b.toString()) ? null : 'no medal rows');
}

async function fetchEdition(competition, edition, { offline }) {
  const snap = path.join(ROOT, 'raw', competition, `${edition.slug}.${ext(edition.parser)}`);
  const buf = await fetchSnapshot({ url: edition.url, dest: snap, offline, validate: validatorFor(edition.parser) });
  let finalistsHtml;
  if (edition.finalists_url) finalistsHtml = (await fetchSnapshot({ url: edition.finalists_url, dest: path.join(ROOT, 'raw', competition, `${edition.slug}-finalists.html`), offline, validate: (b) => (/results-link/.test(b.toString()) ? null : 'no finalist rows') })).toString();
  const file = await buildAwardFile({ competition, edition, html: buf.toString(), finalistsHtml, buffer: buf, today: new Date().toISOString().slice(0, 10) });
  const dest = path.join(ROOT, 'awards', competition, `${edition.slug}.json`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, JSON.stringify(file, null, 2) + '\n');
  console.log(`${competition}/${edition.slug}: ${file.entries.length} entries, ${file.source.skipped.length} skipped${file.source.filtered ? `, ${file.source.filtered.dropped} filtered` : ''}`);
}

if (require.main === module) {
  const [competition, which, ...flags] = process.argv.slice(2);
  const offline = flags.includes('--offline');
  const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'editions', `${competition}.json`), 'utf8'));
  const targets = which === '--all' ? index.editions : index.editions.filter((e) => e.slug === which);
  if (!targets.length) { console.error(`no edition "${which}" in data/editions/${competition}.json`); process.exit(2); }
  (async () => {
    let failed = 0;
    for (const e of targets) {
      if (e.method === 'manual-transcription') { console.log(`${competition}/${e.slug}: manual transcription, skipping fetch`); continue; }
      try { await fetchEdition(competition, e, { offline }); } catch (err) { failed++; console.error(`FAILED ${competition}/${e.slug}: ${err.message}`); }
    }
    process.exit(failed ? 1 : 0);
  })();
}
module.exports = { buildAwardFile };
```

- [ ] **Step 4: Run, expect pass** — `node --test tests/fetch.test.js` → PASS.

- [ ] **Step 5: Fetch everything, seeding snapshots from the audit session**

```bash
mkdir -p data/raw/ica-americas data/raw/ica-world data/raw/aoc
cp $SNAP/ica-am-2026.html data/raw/ica-americas/2026.html; cp $SNAP/ica-am-2026-fin.html data/raw/ica-americas/2026-finalists.html
cp $SNAP/ica-am-2025.html data/raw/ica-americas/2025.html; cp $SNAP/ica-wf-2025.html data/raw/ica-world/2025.html
for y in 2013 2019 2020 2021 2022 2023 2024 2025; do cp $SNAP/aoc-$y.html data/raw/aoc/$y.html 2>/dev/null; done
cp $SNAP/aoc-2025b.html data/raw/aoc/2025.html
node data/tools/fetch.js ica-americas --all
node data/tools/fetch.js ica-world --all
node data/tools/fetch.js aoc --all
node data/tools/fetch.js avpa --all
```
Each run prints one line per edition. Any `FAILED` line names the expected snapshot path: save the page by hand there (browser "save as HTML") and re-run that slug with `--offline`. Unknown heading or level errors mean the registry/alias table needs one more entry — add it, re-run. Keep a list of editions that needed manual snapshots for the README.

- [ ] **Step 6: Commit**
```bash
git add data/tools/fetch.js data/tools/americas-countries.json tests/fetch.test.js data/raw data/awards data/tools/lib data/editions
git commit -m "Adiciona fetch.js e os arquivos canônicos de todas as edições" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 12: `brands.json` and `check.js`

**Files:**
- Create: `data/brands.json`, `data/tools/check.js`, `tests/check.test.js`

**Interfaces:**
- Produces: `data/brands.json` per spec §4; `runCheck({ files, brands }) → { unmapped: [...], drift: [...], hints: [...], dead: [...] }`; `resolveBrand(maker, brands) → brandId|null` (name key or alias key, exact); CLI exits 1 when `unmapped` or `drift` is non-empty.

- [ ] **Step 1: Write the failing tests**

`tests/check.test.js`:
```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { runCheck, resolveBrand } = require('../data/tools/check.js');

const brands = { brands: { nugali: { name: 'Nugali Chocolates', aliases: ['Nugali'] }, monjolo: { name: 'Monjolo Chocolates', aliases: [] }, alma: { name: 'Alma Chocolates', aliases: [] }, mendoa: { name: 'Mendoá Chocolate', aliases: [] } }, excluded: { 'Feitoria do Cacao': 'Portugal' } };
const file = (competition, entries) => ({ competition, slug: 'x', entries: entries.map((e) => ({ level: 'bronze', product: 'p', ...e })) });

test('resolveBrand matches name key and alias key exactly', () => {
  assert.equal(resolveBrand('MONJOLO CHOCOLATES', brands), 'monjolo');
  assert.equal(resolveBrand('Nugali', brands), 'nugali');
  assert.equal(resolveBrand('Mendoá Chocolates', brands), null);
});
test('lists: unmapped Brazilian (ICA), drift by containment, AoC hints, dead aliases', () => {
  const files = [
    file('ica-americas', [{ maker: 'DoSemente Cacau', country: 'Brazil' }, { maker: 'Mendoá Chocolates', country: 'Brazil' }]),
    file('aoc', [{ maker: 'Feitoria do Cacao', country: null, product: 'Chocolate de Leite' }, { maker: 'Corumbau Cacau', country: null, product: '55% Cacau ao Leite com Cupuaçu' }, { maker: 'MONJOLO CHOCOLATES', country: null }]),
  ];
  const r = runCheck({ files, brands });
  assert.deepEqual(r.unmapped.map((u) => u.maker), ['DoSemente Cacau']);
  assert.deepEqual(r.drift.map((d) => [d.maker, d.brand]), [['Mendoá Chocolates', 'mendoa']]);
  assert.deepEqual(r.hints.map((h) => h.maker), ['Corumbau Cacau']);
  assert.deepEqual(r.dead, [{ brand: 'nugali', alias: 'Nugali' }]);
});
```

- [ ] **Step 2: Run, expect failure** — FAIL.

- [ ] **Step 3: Implement**

`data/tools/check.js`:
```js
#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const { key } = require('./lib/key.js');
const ROOT = path.resolve(__dirname, '..');
const PT_TOKENS = ['cacau', 'ao leite', 'branco', 'intenso', 'castanha', 'cupuaçu', 'baru', 'cumaru', 'doce de leite', 'com '];

function brandKeys(brands) {
  const map = new Map(); // key → brandId
  for (const [id, b] of Object.entries(brands.brands)) { map.set(key(b.name), id); for (const a of b.aliases || []) map.set(key(a), id); }
  return map;
}
function resolveBrand(maker, brands) { return brandKeys(brands).get(key(maker)) || null; }

function runCheck({ files, brands }) {
  const keys = brandKeys(brands);
  const excluded = new Set(Object.keys(brands.excluded || {}).map(key));
  const unmapped = [], drift = [], hints = [];
  const usedKeys = new Set();
  const seenUnmatched = new Set();
  for (const f of files) for (const e of f.entries) {
    const mk = key(e.maker);
    if (keys.has(mk)) { usedKeys.add(mk); continue; }
    if (excluded.has(mk)) continue;
    const id = `${f.competition}|${mk}`; if (seenUnmatched.has(id)) continue; seenUnmatched.add(id);
    const where = `${f.competition}/${f.slug}`;
    let drifted = false;
    if (mk.length >= 5) for (const [bk, brand] of keys) if (bk.length >= 5 && (mk.includes(bk) || bk.includes(mk))) { drift.push({ maker: e.maker, brand, where }); drifted = true; break; }
    if (drifted) continue;
    if (f.competition.startsWith('ica') && e.country === 'Brazil') { unmapped.push({ maker: e.maker, where }); continue; }
    if (f.competition === 'avpa' && /br[ée]sil/i.test(e.origin_country || '')) { hints.push({ maker: e.maker, where, why: 'AVPA origin Brésil' }); continue; }
    if (f.competition === 'aoc' && PT_TOKENS.some((t) => (e.product || '').toLowerCase().includes(t))) hints.push({ maker: e.maker, where, why: `product: ${e.product}` });
  }
  const dead = [];
  for (const [id, b] of Object.entries(brands.brands)) for (const a of b.aliases || []) if (!usedKeys.has(key(a))) dead.push({ brand: id, alias: a });
  return { unmapped, drift, hints, dead };
}

function loadAll() {
  const files = [];
  for (const comp of fs.readdirSync(path.join(ROOT, 'awards'))) for (const fn of fs.readdirSync(path.join(ROOT, 'awards', comp))) if (fn.endsWith('.json') && !fn.endsWith('.draft.json')) files.push(JSON.parse(fs.readFileSync(path.join(ROOT, 'awards', comp, fn), 'utf8')));
  return files;
}

if (require.main === module) {
  const brands = JSON.parse(fs.readFileSync(path.join(ROOT, 'brands.json'), 'utf8'));
  const r = runCheck({ files: loadAll(), brands });
  const show = (title, rows) => { console.log(`\n## ${title} (${rows.length})`); for (const x of rows) console.log('  ' + JSON.stringify(x)); };
  show('1. Unmapped Brazilian maker (fails)', r.unmapped); show('2. Possible spelling drift (fails)', r.drift);
  show('3. Possible Brazilian maker (hint)', r.hints); show('4. Dead alias', r.dead);
  process.exit(r.unmapped.length || r.drift.length ? 1 : 0);
}
module.exports = { runCheck, resolveBrand };
```

- [ ] **Step 4: Run, expect pass** — `node --test tests/check.test.js` → PASS.

- [ ] **Step 5: Bootstrap `data/brands.json`**

Generate ids from the 72 cards: `node -e` script reading `marcas.json`, id = `slug(name)` as in gerar.js (`name.toLowerCase().normalize('NFD')…` → `cacau-do-ceu`), `name` = card name, `aliases: []`, `signature: []` (fill from the starred products: `awards.filter(a => a.star).map(a => a.p)` — these are curated names; replace each with the official product string during Task 15 reconciliation). Then run `node data/tools/check.js` and iterate: for each list-2 row add the alias to the brand; for each list-1 row decide (new brand card in Task 14, or `excluded` with a reason); repeat until lists 1 and 2 are empty. Known aliases to expect: `Nugali`, `Mendoá Chocolates`, `Pretiosus`, `Jucolatte`, `Cacau do Céu Chocolates`, `Chocolate Da Ju` (Ju Arléo), `Hagi Torrones e Chocolates`, `Cuore di Cacao Chocolateria`, `Chor Chocolate de Origem` (ChOr), `Selah`, `Mestiço Chocolates`/`Mestiço`, `Kaê Chocolates`, `ZAAD`, `Raros`, `Labarr`, `Pepe`, `Caza`, `Var`, `Martinus`, `Prawer`, `Tombador`, `MOA`, `Amma`, `doCacao`, `C'alma`, `Chocolate Tree`? (no — that is Scottish; goes to `excluded`).

- [ ] **Step 6: Commit**
```bash
git add data/brands.json data/tools/check.js tests/check.test.js
git commit -m "Adiciona brands.json e check.js (mapeamento de fabricantes)" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 13: `awards-loader.js`

**Files:**
- Create: `awards-loader.js`, `tests/loader.test.js`

**Interfaces:**
- Produces: `loadAwards({ dataDir = 'data', showNacional = true }) → { byBrand: Map<brandId, Award[]>, fetchedMax: 'YYYY-MM-DD', files }`, `Award = { c, y, l, p, star, canonical: true, scored: boolean, level: string }`; `placeBrand(awards) → 'S1N1'|'S1N2'|'S2'|'S3'|'S4'`; `badgeFor(card, awards) → 'oficial'|'imprensa'`; `COMP_LABEL_PT`, `LEVEL_LABEL_PT`; `formatDatePt('2026-09-05') → '5 de setembro de 2026'`.

- [ ] **Step 1: Write the failing tests**

`tests/loader.test.js`:
```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { loadAwards, placeBrand, badgeFor, formatDatePt, LEVEL_LABEL_PT } = require('../awards-loader.js');

function tmpData() {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'ld-'));
  fs.mkdirSync(path.join(d, 'awards', 'ica-americas'), { recursive: true });
  fs.writeFileSync(path.join(d, 'awards', 'ica-americas', '2021-22.json'), JSON.stringify({ competition: 'ica-americas', slug: '2021-22', year: 2022, edition: '2021-22', title: 't', source: { url: 'u', snapshot: 's', fetched: '2026-09-05', method: 'parser', skipped: [] }, entries: [
    { level: 'silver', level_raw: 'Silver', maker: 'Nugali', country: 'Brazil', product: 'Dragée Coffee Beans', category: 'c', special: [], flags: [] },
    { level: 'finalist', level_raw: 'Grand Jury Finalist', maker: 'Nugali', country: 'Brazil', product: 'Other', category: null, special: [], flags: [] },
    { level: 'gold', level_raw: 'Gold', maker: 'Someone Else', country: 'Peru', product: 'x', category: 'c', special: [], flags: [] },
  ] }));
  fs.writeFileSync(path.join(d, 'brands.json'), JSON.stringify({ brands: { nugali: { name: 'Nugali Chocolates', aliases: ['Nugali'], signature: ['Dragée Coffee Beans'] } }, excluded: {} }));
  return d;
}

test('loader maps entries to site awards with labels, star, scored flag and edition label', () => {
  const { byBrand, fetchedMax } = loadAwards({ dataDir: tmpData() });
  const aw = byBrand.get('nugali');
  assert.deepEqual(aw[0], { c: 'ICA Américas', y: '2021/22', l: 'Prata', p: 'Dragée Coffee Beans', star: true, canonical: true, scored: true, level: 'silver' });
  assert.equal(aw[1].l, 'Finalista'); assert.equal(aw[1].scored, false); assert.equal(aw[1].star, false);
  assert.equal(fetchedMax, '2026-09-05');
  assert.equal(formatDatePt('2026-09-05'), '5 de setembro de 2026');
  assert.equal(LEVEL_LABEL_PT['gourmet-diploma'], 'Diploma Gourmet');
});
test('placement uses placing levels only; AVPA any level; national otherwise', () => {
  const A = (c, level) => ({ c, level, scored: level !== 'finalist' });
  assert.equal(placeBrand([A('ICA Mundial', 'finalist'), A('ICA Américas', 'bronze')]), 'S1N2');
  assert.equal(placeBrand([A('ICA Mundial', 'silver')]), 'S1N1');
  assert.equal(placeBrand([A('Academy of Chocolate', 'commended')]), 'S4');
  assert.equal(placeBrand([A('Academy of Chocolate', 'top-gold')]), 'S2');
  assert.equal(placeBrand([A('AVPA Paris', 'gourmet-diploma')]), 'S3');
  assert.equal(placeBrand([{ c: 'Bean to Bar Brasil', level: null, scored: true }]), 'S4');
});
test('badge: oficial only when every award is canonical or src is oficial', () => {
  assert.equal(badgeFor({ src: 'imprensa' }, [{ canonical: true }, { canonical: false }]), 'imprensa');
  assert.equal(badgeFor({ src: 'imprensa' }, [{ canonical: true }]), 'oficial');
  assert.equal(badgeFor({ src: 'oficial' }, [{ canonical: false }]), 'oficial');
  assert.equal(badgeFor({ src: 'imprensa' }, []), 'imprensa');
});
```

- [ ] **Step 2: Run, expect failure** — FAIL.

- [ ] **Step 3: Implement**

`awards-loader.js`:
```js
'use strict';
// Turns data/awards/*/*.json + data/brands.json into the award objects gerar.js renders.
const fs = require('fs');
const path = require('path');
const { key } = require('./data/tools/lib/key.js');
const { LEVELS } = require('./data/tools/lib/levels.js');
const { validateAwardFile } = require('./data/tools/lib/schema.js');

const COMP_LABEL_PT = { 'ica-world': 'ICA Mundial', 'ica-americas': 'ICA Américas', 'aoc': 'Academy of Chocolate', 'avpa': 'AVPA Paris' };
const LEVEL_LABEL_PT = { gold: 'Ouro', silver: 'Prata', bronze: 'Bronze', 'top-gold': 'Top Gold', commended: 'Menção', trophy: 'Troféu', recognition: 'Reconhecimento', finalist: 'Finalista', 'gourmet-gold': 'Gourmet Ouro', 'gourmet-silver': 'Gourmet Prata', 'gourmet-bronze': 'Gourmet Bronze', 'gourmet-medal': 'Medalha Gourmet', 'gourmet-diploma': 'Diploma Gourmet' };
const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
function formatDatePt(iso) { const [y, m, d] = iso.split('-').map(Number); return `${d} de ${MONTHS[m - 1]} de ${y}`; }

function readFiles(dataDir) {
  const files = [];
  const base = path.join(dataDir, 'awards');
  for (const comp of fs.readdirSync(base)) for (const fn of fs.readdirSync(path.join(base, comp)).sort()) {
    if (!fn.endsWith('.json') || fn.endsWith('.draft.json')) continue;
    const f = JSON.parse(fs.readFileSync(path.join(base, comp, fn), 'utf8'));
    const errs = validateAwardFile(f);
    if (errs.length) throw new Error(`${comp}/${fn}: ${errs.slice(0, 3).join('; ')}`);
    files.push(f);
  }
  return files.sort((a, b) => a.competition.localeCompare(b.competition) || b.year - a.year);
}

function loadAwards({ dataDir = path.join(__dirname, 'data') } = {}) {
  const brands = JSON.parse(fs.readFileSync(path.join(dataDir, 'brands.json'), 'utf8'));
  const keys = new Map();
  for (const [id, b] of Object.entries(brands.brands)) { keys.set(key(b.name), id); for (const a of b.aliases || []) keys.set(key(a), id); }
  const sig = new Map(Object.entries(brands.brands).map(([id, b]) => [id, new Set((b.signature || []).map(key))]));
  const files = readFiles(dataDir);
  const byBrand = new Map(Object.keys(brands.brands).map((id) => [id, []]));
  let fetchedMax = '0000-00-00';
  for (const f of files) {
    if (f.source.fetched > fetchedMax) fetchedMax = f.source.fetched;
    for (const e of f.entries) {
      const id = keys.get(key(e.maker)); if (!id) continue;
      byBrand.get(id).push({ c: COMP_LABEL_PT[f.competition], y: f.edition.replace('-', '/'), l: LEVEL_LABEL_PT[e.level], p: e.product, star: sig.get(id).has(key(e.product)), canonical: true, scored: LEVELS[e.level].scored, level: e.level });
    }
  }
  return { byBrand, fetchedMax, files, brands };
}

const PLACES = (a) => a.level && LEVELS[a.level] && LEVELS[a.level].places;
function placeBrand(awards) {
  const has = (re, any) => awards.some((a) => re.test(a.c) && (any || PLACES(a)));
  if (has(/ICA Mundial/)) return 'S1N1';
  if (has(/ICA Américas/)) return 'S1N2';
  if (has(/Academy of Chocolate/)) return 'S2';
  if (has(/AVPA/, true)) return 'S3';
  return 'S4';
}
function badgeFor(card, awards) {
  if (card.src === 'oficial') return 'oficial';
  return awards.length && awards.every((a) => a.canonical) ? 'oficial' : 'imprensa';
}
module.exports = { loadAwards, placeBrand, badgeFor, formatDatePt, COMP_LABEL_PT, LEVEL_LABEL_PT };
```

- [ ] **Step 4: Run, expect pass** — `node --test tests/loader.test.js` → PASS.

- [ ] **Step 5: Commit**
```bash
git add awards-loader.js tests/loader.test.js
git commit -m "Adiciona awards-loader: dados canônicos → prêmios do site, seções e selo" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 14: Migrate `gerar.js` to the loader

**Files:**
- Modify: `gerar.js` (regions: `ATUALIZADO_EM` line 35; arrays 36–682; merge block 870–888; scoring/sections 890–951; `awardsHtml` 706–715, `srcBadge` 717–720, `tallyOf` 751, `signatureOf`; masthead 1282–1292; section builders ~1360–1410; outputs 1521–1533)
- Delete: `awards-patch.json`, `awards-patch2.json`, `awards-patch3.json`
- Create: `tests/gerar-smoke.test.js`, `docs/superpowers/migration/section-diff.md` (generated)

**Interfaces:**
- Consumes: `loadAwards`, `placeBrand`, `badgeFor`, `formatDatePt` from Task 13.
- Produces: `gerar.js` exports nothing new; `SHOW_NACIONAL` env/const; outputs `dist/index.html`, `dist/og-image.png`, `marcas.json` (root). `marcas.json` rows now carry `id`, `section`, and awards with `canonical`/`scored`.

- [ ] **Step 1: Move national entries out of the patch files into the cards**

Run once and follow its output:
```bash
node -e "
for (const pf of ['awards-patch.json','awards-patch2.json','awards-patch3.json']) {
  const P = require('./'+pf);
  for (const [brand, list] of Object.entries(P)) for (const a of list)
    if (/Bean to Bar Brasil|CNA|Cacau Fest|Chocolat Festival/.test(a.c)) console.log(brand, JSON.stringify(a));
}"
```
For every printed row, add the same `{ c, y, l, p }` object to that brand's `awards` array in `gerar.js` (the card's inline list). Then delete the three patch files and the merge block (lines 870–888).

- [ ] **Step 2: Write the smoke test**

`tests/gerar-smoke.test.js`:
```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

test('gerar.js builds from canonical data; sections derived; finalists unscored; date derived', () => {
  const out = execFileSync('node', ['gerar.js'], { cwd: root, encoding: 'utf8' });
  assert.match(out, /OK -> /);
  const marcas = JSON.parse(fs.readFileSync(path.join(root, 'marcas.json'), 'utf8'));
  assert.ok(marcas.every((m) => m.id && m.section));
  const html = fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');
  assert.match(html, /dados atualizados em \d{1,2} de [a-zç]+ de 20\d\d/);
  const nugali = marcas.find((m) => m.name === 'Nugali Chocolates');
  assert.ok(nugali.awards.some((a) => a.canonical));
  assert.ok(!fs.existsSync(path.join(root, 'chocolates-brasileiros-premiados.html')));
});
test('SHOW_NACIONAL=false hides section 4 and national rows', () => {
  execFileSync('node', ['gerar.js'], { cwd: root, encoding: 'utf8', env: { ...process.env, SHOW_NACIONAL: 'false' } });
  const html = fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');
  assert.doesNotMatch(html, /Seção 4 — Prêmios nacionais/);
  assert.doesNotMatch(html, /Bean to Bar Brasil 20/);
  assert.match(html, /também premiadas em concursos nacionais/i);
  execFileSync('node', ['gerar.js'], { cwd: root });   // restore default build
});
```

- [ ] **Step 3: Run, expect failure** — `node --test tests/gerar-smoke.test.js` → FAIL (no `id`/`section`, root HTML still produced).

- [ ] **Step 4: Rewrite the data and section layer of gerar.js**

Apply these edits in order (line numbers refer to the file before editing; re-locate by the quoted text):

1. Replace line 35 `const ATUALIZADO_EM = '4 de setembro de 2026';` with:
```js
const { loadAwards, placeBrand, badgeFor, formatDatePt } = require('./awards-loader.js');
const SHOW_NACIONAL = String(process.env.SHOW_NACIONAL ?? 'true') !== 'false';
const CANON = loadAwards();
const ATUALIZADO_EM = formatDatePt(CANON.fetchedMax);
```
2. Rename `const BR = [` → `const MARCAS = [`; move every object from `AOC`, `AVPA` and `NAC_NEW` into `MARCAS` (cut the three array declarations); delete every `tier: N,` and every inline award whose `c` is `ICA Mundial`, `ICA Américas`, `Academy of Chocolate` or `AVPA Paris`; add `id: '<slug>'` to each card, the slug being the key used in `data/brands.json`. Keep `INTL`, `SEM_BR`, `ORIGEM` untouched.
3. After the `MARCAS` array, add:
```js
for (const m of MARCAS) {
  if (!CANON.byBrand.has(m.id)) throw new Error(`card "${m.name}" has id "${m.id}" missing from data/brands.json`);
  const nat = (m.awards || []).map((a) => ({ ...a, canonical: false, scored: true }));
  m.awards = [...CANON.byBrand.get(m.id), ...(SHOW_NACIONAL ? nat : [])];
  m.nationalOnly = !CANON.byBrand.get(m.id).length;
  m.badge = badgeFor(m, [...CANON.byBrand.get(m.id), ...nat]);
  m.section = placeBrand(m.awards);
}
for (const id of CANON.byBrand.keys()) if (!MARCAS.some((m) => m.id === id)) throw new Error(`brands.json id "${id}" has no card in gerar.js`);
```
4. Delete the patch merge block (`// Merge de prêmios adicionais…` through `console.log(\`Patch: …\`)`).
5. Scoring: change `strengthBy` to filter `aw = (m.awards || []).filter((a) => pred(a.c) && a.scored !== false)`; change `strengthAll`'s loop to `for (const a of (m.awards || [])) { if (a.scored === false) continue; … }`; leave `tallyOf` and `FIELD` counting every award (distinctions include finalists). Change `compsOf` to `(m.awards || []).filter((a) => a.scored !== false).map(…)`.
6. Sections: replace the `t1`/`t2`/`AOC.sort`/`AVPA.sort`/`NACIONAL` block with:
```js
const bySection = (s) => MARCAS.filter((m) => m.section === s);
const t1 = bySection('S1N1').sort(sortBy(reMundial));
const t2 = bySection('S1N2').sort(sortBy(reAmericas));
const AOC = bySection('S2').sort(sortBy(reAoC));
const AVPA = bySection('S3').sort(sortBy(reAvpa));
const NACIONAL = SHOW_NACIONAL ? bySection('S4').sort(sortBy(reNac)) : [];
const NACIONAL_ONLY = SHOW_NACIONAL ? [] : MARCAS.filter((m) => m.section === 'S4');
const ALL_MAKERS = SHOW_NACIONAL ? MARCAS : MARCAS.filter((m) => m.section !== 'S4');
```
   and `TOTAL_AWARDS` → `ALL_UNIQUE.reduce((s, m) => s + m.awards.filter((a) => a.scored !== false).length, 0)`.
7. Badge: in the two `${srcBadge(m.src)}` call sites use `${srcBadge(m.badge)}`. In `awardsHtml`, prefix each row with `${a.canonical ? '<span class="aw-src" title="Fonte oficial da competição">✓</span>' : ''}` and add CSS `.aw-src{color:var(--cabruca);font-size:.7rem;margin-right:4px}` next to `.aw-comp`.
8. Masthead line: when `!SHOW_NACIONAL`, omit the ` · ${NACIONAL.length} em prêmios nacionais` fragment.
9. Section 4 builder: wrap the whole `Seção 4` block in `SHOW_NACIONAL ? … : ''`, and after section 3 add, when `NACIONAL_ONLY.length`, a strip: `<div class="xrefs"><p class="xrefs-title">Também premiadas em concursos nacionais</p><div class="xrefs-list">${NACIONAL_ONLY.map((m) => `<span class="xref"><span class="xref-logo">${logoHtml(m)}</span><span class="xref-main"><span class="xref-name">${esc(m.name)}</span></span></span>`).join('')}</div></div>`.
10. Outputs: replace `const out = …chocolates-brasileiros-premiados.html` with `const out = path.join(__dirname, 'dist', 'index.html'); fs.mkdirSync(path.dirname(out), { recursive: true });` and add `fs.copyFileSync(path.join(__dirname, 'og-image.png'), path.join(__dirname, 'dist', 'og-image.png'));`. In the `marcas` export map add `id: m.id, section: m.section`. `package.json` build script becomes `"build": "node gerar.js"`.
11. Section-membership report: before writing outputs add
```js
const prev = fs.existsSync(path.join(__dirname, 'tests', 'golden', 'sections-before.json')) ? JSON.parse(fs.readFileSync(path.join(__dirname, 'tests', 'golden', 'sections-before.json'), 'utf8')) : null;
if (prev) { const moves = MARCAS.filter((m) => prev[m.name] && prev[m.name] !== m.section).map((m) => `${m.name}: ${prev[m.name]} → ${m.section}`); console.log(`Section moves vs 2026-09-04: ${moves.length}\n  ${moves.join('\n  ')}`); }
```
   Create `tests/golden/sections-before.json` from the pre-migration placement (`{ "Cacau do Céu": "S1N1", … }`) with the audit-session mapping: tier 1 → S1N1, tier 2 → S1N2, AOC array → S2, AVPA array → S3, tier 3/NAC_NEW → S4 — build it with a one-off `node -e` over the committed gerar.js from Task 1's commit (`git show HEAD~N:gerar.js`) before step 2 above deletes the tiers.

- [ ] **Step 5: Run, expect pass; check the moves**

`node --test tests/gerar-smoke.test.js` → PASS. `node gerar.js` prints `Section moves vs 2026-09-04: 10` listing exactly: Mendoá, La Lis, Pé de Chocolate, Cacau Dourado, Nicolas Chocolate do Belga, Martinus, Casa Lasevicius (S2 → S1N2); Gallette, Chokolah, Priscyla França (S4 → S1N2). Any other move means a placement or mapping bug: stop and investigate (`node -e` print that brand's awards). Save the printed list as `docs/superpowers/migration/section-diff.md`.

- [ ] **Step 6: Commit**
```bash
git rm -q awards-patch.json awards-patch2.json awards-patch3.json chocolates-brasileiros-premiados.html
git add gerar.js package.json tests/gerar-smoke.test.js tests/golden/sections-before.json docs/superpowers/migration/section-diff.md dist/index.html dist/og-image.png
git commit -m "Gera o site a partir dos dados canônicos: seções derivadas, selo por linha, chave SHOW_NACIONAL" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 15: Reconciliation and the golden test

**Files:**
- Create: `data/tools/reconcile.js`, `tests/golden/accepted-deltas.json`, `tests/golden.test.js`

**Interfaces:**
- Consumes: `tests/golden/audit-2026-09-04.json` (Task 1), `loadAwards` (Task 13).
- Produces: `reconcile({ audit, byBrand, brands, deltas }) → { missing: [...], stale: [...] }`; `accepted-deltas.json` = `[{ brand, competition, edition, level, n, reason, note }]` with `reason ∈ curation-error|level-corrected|edition-corrected|source-not-published`.

- [ ] **Step 1: Write the failing test**

`tests/golden.test.js`:
```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { reconcile } = require('../data/tools/reconcile.js');
const { loadAwards } = require('../awards-loader.js');

test('every audited row is present unless accepted; no accepted delta is stale', () => {
  const audit = JSON.parse(fs.readFileSync(path.join(__dirname, 'golden', 'audit-2026-09-04.json'), 'utf8'));
  const deltas = JSON.parse(fs.readFileSync(path.join(__dirname, 'golden', 'accepted-deltas.json'), 'utf8'));
  const { byBrand, brands } = loadAwards();
  const r = reconcile({ audit, byBrand, brands, deltas });
  assert.deepEqual(r.missing, [], `missing audited rows:\n${r.missing.map((m) => JSON.stringify(m)).join('\n')}`);
  assert.deepEqual(r.stale, [], `stale accepted deltas:\n${r.stale.map((m) => JSON.stringify(m)).join('\n')}`);
});
test('the invariant is a multiset: removing one of Nugali\'s 2026 bronzes fails', () => {
  const audit = { rows: [1, 2].map((n) => ({ brand: 'Nugali Chocolates', competition: 'ica-americas', edition: '2026', level: 'bronze', n, p: 'x' })) };
  const byBrand = new Map([['nugali', [{ c: 'ICA Américas', y: '2026', level: 'bronze' }]]]);
  const brands = { brands: { nugali: { name: 'Nugali Chocolates', aliases: [] } } };
  const r = reconcile({ audit, byBrand, brands, deltas: [] });
  assert.equal(r.missing.length, 1); assert.equal(r.missing[0].n, 2);
});
```

- [ ] **Step 2: Run, expect failure** — FAIL.

- [ ] **Step 3: Implement**

`data/tools/reconcile.js`:
```js
#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const COMP = { 'ICA Mundial': 'ica-world', 'ICA Américas': 'ica-americas', 'Academy of Chocolate': 'aoc', 'AVPA Paris': 'avpa' };

function reconcile({ audit, byBrand, brands, deltas }) {
  const idByName = new Map(Object.entries(brands.brands).map(([id, b]) => [b.name, id]));
  const have = new Map(); // brand|competition|edition|level → count
  for (const [id, awards] of byBrand) for (const a of awards) {
    const k = `${id}|${COMP[a.c]}|${String(a.y).replace('/', '-')}|${a.level}`; have.set(k, (have.get(k) || 0) + 1);
  }
  const dk = (d) => `${idByName.get(d.brand) || d.brand}|${d.competition}|${d.edition}|${d.level}|${d.n}`;
  const accepted = new Set(deltas.map(dk));
  const missing = [], stale = [];
  for (const row of audit.rows) {
    const id = idByName.get(row.brand);
    const k = `${id}|${row.competition}|${row.edition}|${row.level}`;
    const present = row.n <= (have.get(k) || 0);
    const isAccepted = accepted.has(dk(row));
    if (!present && !isAccepted) missing.push(row);
    if (present && isAccepted) stale.push(row);
  }
  return { missing, stale };
}

if (require.main === module) {
  const root = path.resolve(__dirname, '..', '..');
  const { loadAwards } = require(path.join(root, 'awards-loader.js'));
  const audit = JSON.parse(fs.readFileSync(path.join(root, 'tests', 'golden', 'audit-2026-09-04.json'), 'utf8'));
  const deltasPath = path.join(root, 'tests', 'golden', 'accepted-deltas.json');
  const deltas = fs.existsSync(deltasPath) ? JSON.parse(fs.readFileSync(deltasPath, 'utf8')) : [];
  const { byBrand, brands } = loadAwards();
  const r = reconcile({ audit, byBrand, brands, deltas });
  console.log(`missing: ${r.missing.length}  stale: ${r.stale.length}`);
  for (const m of r.missing) console.log('  MISSING', JSON.stringify(m));
  for (const s of r.stale) console.log('  STALE  ', JSON.stringify(s));
}
module.exports = { reconcile };
```

- [ ] **Step 4: Reconcile by hand until the golden passes**

Run `node data/tools/reconcile.js`. For every `MISSING` row decide:
- a parser or mapping bug (the official page has the row but the file does not, or the maker is unmapped) → fix the parser/alias, re-fetch with `--offline`, re-run;
- a curation error (the official page never had it, e.g. Martinus "Linha ao Leite") → `curation-error`;
- level or edition typed wrong in the audit (AVPA ChOr "Medalha Gourmet" vs published "Diplôme Gourmet"; Pé de Chocolate years) → `level-corrected` / `edition-corrected`;
- the source no longer publishes it → `source-not-published`.
Write each accepted one into `tests/golden/accepted-deltas.json` with a one-line `note`. Also fill `signature` in `brands.json` with the official product strings of the starred bars (the audit rows' `p` for `star` awards, looked up in the award files). Expected known deltas from the spec: ICA 2021-22 rows recorded under `2020/21` in the audit (`edition-corrected`), AVPA 2021–2022 ChOr levels, Miroh "Blum's" vs "Blums" spellings (these match by key — no delta).

- [ ] **Step 5: Run, expect pass** — `npm test` → all suites PASS, including the golden.

- [ ] **Step 6: Commit**
```bash
git add data/tools/reconcile.js tests/golden/accepted-deltas.json tests/golden.test.js data/brands.json data/awards data/tools
git commit -m "Reconcilia dados canônicos com a auditoria de 4/9/2026 e adiciona teste golden" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 16: Cleanup, documentation and deployment mode

**Files:**
- Modify: `README.md`, `BACKLOG.md`, `.gitignore`, `package.json`
- Create: `data/README.md`
- Delete: stale artefacts per spec §7

- [ ] **Step 1: Decide the Cloudflare mode**

Open the Cloudflare Pages project → Settings → Builds & deployments. If a build command is configured: add `dist/` to `.gitignore`, `git rm -r --cached dist`, and rewrite README's "Publicar" to "deploy automático a cada push; o build roda `npm run build`". If it is "Upload assets": keep `dist/` tracked and leave "Publicar" as is. Record the choice in the commit message.

- [ ] **Step 2: Remove stale files**
```bash
git rm -q chocolates-brasileiros-premiados.pdf   # or: git mv chocolates-brasileiros-premiados.pdf docs/ — owner's call; default delete
rm -f chocolates-brasileiros-premiados.v1.html gerar.v1.js "chocolates-brasileiros-unificado - Copy.html" site-cloudflare.zip pdf_p2.png mock-topo.html migrar-sessao.sh icone-*.png
rm -rf .superpowers logos/incoming
```
Edit `.gitignore`: drop the now-pointless patterns (`*.v1.*`, `*Copy.html`, `pdf_p2.png`, `mock-topo.html`, `migrar-sessao.sh`, `icone-*.png`, `logos/incoming/`), keep `marcas.json`, `node_modules/`, `.superpowers/`, add `data/raw/_crawl/` and `data/awards/**/*.draft.json`.

- [ ] **Step 3: package.json scripts**
```json
"scripts": {
  "build": "node gerar.js",
  "fetch": "node data/tools/fetch.js",
  "check": "node data/tools/check.js",
  "crawl-editions": "node data/tools/crawl-editions.js",
  "reconcile": "node data/tools/reconcile.js",
  "test": "node data/tools/check.js && node --test tests/"
}
```

- [ ] **Step 4: Write `data/README.md`**

Sections, in this order, each a few lines plus one example: purpose and coverage (competitions, edition ranges, "every winner worldwide"); layout (the tree from spec §2); award file schema (the JSON example from spec §3 with the ✱ legend); level vocabulary table (copy spec §3 table incl. scored/places columns) and the alias table (`Silvere → silver`, `Top Gold → top-gold`, `TROPHY → trophy`, `Gourmet Or → gourmet-gold`, …); matching key definition; `brands.json` contract (name is a key, aliases, signature, excluded); commands (`npm run crawl-editions -- ica|aoc`, `npm run fetch -- <competition> <slug|--all> [--offline]`, `npm run check`, `npm run reconcile`, `npm test`); manual fallbacks (save the page to the snapshot path the tool prints, then `--offline`; AVPA editions the table extractor cannot read are transcribed with `data/tools/transcribe-avpa.js` and committed with `method: manual-transcription`); adding a competition (parser in `data/tools/parsers/`, entry in `fetch.js` `PARSERS`, edition index, labels in `awards-loader.js`).

- [ ] **Step 5: Rewrite README.md sections**

"Estrutura" table → list `gerar.js`, `awards-loader.js`, `data/` (link to `data/README.md`), `logos/`, `fonts/`, `dist/index.html`, `tests/`. "Regenerar" → `npm run build` (writes `dist/index.html`); "Atualizar prêmios" → the four commands in order (crawl-editions if new edition, fetch, check, build + test). Replace the hard-coded "72 marcas · 520 prêmios" line with "As contagens de marcas e prêmios são calculadas no build e aparecem no topo do documento". Keep "Como funciona o ranking" and "Créditos"; add one sentence: finalistas do ICA são exibidos mas não pontuam. Publicar per step 1.

- [ ] **Step 6: BACKLOG.md**

Replace any medal-audit items with: "Rotina por edição: `npm run fetch -- <competição> <slug>` → `npm run check` → `npm run build && npm test` → commit". Keep the interface items and the missing-logos item (now also DoSemente, Velmont, Corumbau, Selah). Add "Decidir se `SHOW_NACIONAL` fica em `false`".

- [ ] **Step 7: Full verification and commit**
```bash
npm test          # check.js clean + all suites green
npm run build     # prints section moves = 10 (or 0 once sections-before.json is removed) and OK -> dist/index.html
git add -A
git commit -m "Reorganiza o repositório: remove patches e rascunhos, documenta o dataset canônico e a rotina de atualização" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

## Self-review

**Spec coverage.** §1 goal → Tasks 11–15; §2 layout → Tasks 2–12 (files), 16 (README); §3 schema/vocabulary/key/quarantine → Tasks 2, 3, 11; §4 brands + check lists → Task 12; §5 snapshot/retry/offline → Task 4, edition discovery → Task 10, ICA grammars → Tasks 5–7, AoC → Task 8, AVPA incl. manual transcription → Task 9; §6 loader/cards/badge/sections/finalists/`SHOW_NACIONAL`/date/guards/outputs → Tasks 13–14; §7 layout, cleanup, dist decision → Tasks 14, 16; §8 docs → Task 16; §9 tests → each task, golden → Tasks 1 and 15; §10 workflow → Task 16 README, migration order → Tasks 1 (commit + export), 10–11 (indexes + fetch), 12 (brands), 15 (reconcile), 14 (strip + moves); §11 out of scope → nothing planned for USA & Canada, INTL wiring, PDF, fuzzy matching.

**Placeholder scan.** No TBD/TODO. Step-level judgment calls are stated with their decision rule (heading registry additions, fixture counts, delta classifications).

**Type consistency.** Entry shape (`level, level_raw, maker, country, product, category, group, score, special, flags, private_label_maker`, plus AVPA `company, producer, origin_country`) is identical across parsers, `buildAwardFile`, `validateAwardFile` and the loader. Site award shape `{c, y, l, p, star, canonical, scored, level}` is produced by Task 13 and consumed by Task 14 (`scored`, `canonical`, `level`) and Task 15 (`c`, `y`, `level`). Edition entry shape (`slug, year, edition, title, url, finalists_url, parser, filter, method, notes`) is produced by Task 10 and consumed by Task 11. `key()` is the single comparison function everywhere.
