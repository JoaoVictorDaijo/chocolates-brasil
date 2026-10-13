---
title: Canonical competition results as the source of truth
status: implemented
date: 2026-09-04
areas: [data, site]
prs: []
issues: []
superseded_by: null
summary: Official competition results form a standalone canonical dataset that supplies the site's international awards and determines brand placement.
---

# Canonical competition results as the source of truth

**Status:** draft for review (IAR round 1 applied, owner decisions recorded) ·
**Date:** 2026-09-04 · **Scope:** one implementation plan

## 1. Goal

Replace the hand-typed award lists in `gerar.js` (plus the three `awards-patch*.json`
files) with a canonical, machine-fetched dataset of competition results, so that:

- every ICA, Academy of Chocolate and AVPA award shown on the site traces back to an
  official results page or PDF;
- a new competition edition is added by running one command, not by retyping;
- the dataset is reusable by future projects without depending on the site code.

Competitions in scope: **ICA World Final**, **ICA Américas**, **Academy of Chocolate**,
**AVPA Paris "Chocolats élaborés à l'origine"**. National prizes (Prêmio Bean to Bar
Brasil, CNA, Cacau Fest, Chocolat Festival) stay hand-curated on the brand cards; they
are out of scope for the fetchers.

Coverage: every edition the competitions have published, every winner worldwide. The
site keeps its Brazilian focus through the brand mapping (§4). Editions are enumerated
in committed index files (§2), not derived from year ranges, because the sources have
gaps, split seasons and second-phase editions.

## 2. Data layout

```
data/
  README.md                       schema, level vocabulary, commands
  brands.json                     official maker names → brand id (§4)
  editions/
    ica-world.json                one entry per published edition: slug, year, edition
    ica-americas.json             label, title, winners URL, finalists URL, notes
    aoc.json
    avpa.json                     year → PDF URL (Wix content-hash URLs, see §5)
  awards/
    ica-world/<slug>.json         e.g. 2012.json … 2019.json, 2020-21.json, 2023.json …
    ica-americas/<slug>.json      e.g. 2012.json … 2019.json, 2020-21.json, 2021-22.json, 2023.json …
    aoc/<slug>.json               e.g. 2005.json … 2022.json, 2022-second-phase.json, 2023.json …
    avpa/<slug>.json              2021.json … 2026.json
  raw/
    <competition>/<slug>.<ext>    verbatim source snapshots (HTML or PDF)
  tools/
    fetch.js                      CLI: fetch.js <competition> <slug|--all> [--offline]
    check.js                      mapping health report (§4)
    crawl-editions.js             rebuilds data/editions/*.json from the sites (§5)
    lib/                          snapshot, retry, schema validation, key normalisation,
                                  level aliases
    parsers/ica-new.js            enter.chocolateawards.com (2023 →)
    parsers/ica-old.js            chocolateawards.com (2015 → 2022)
    parsers/ica-2012.js           chocolateawards.com (2012 → 2014, plain-text levels)
    lib/ica-blocks.json           registry of ICA <h1> headings: medal groups vs award blocks
    parsers/aoc.js                academyofchocolate.org.uk tables
    parsers/avpa.js               AVPA palmarès PDFs (2024 →), see §5 for 2021–2023
    americas-countries.json       country list used to filter the merged 2016 round
```

**Slug and year.** The file name is the edition slug. A single-year edition's slug is
the year (`2018`). A season edition keeps the published label (`2020-21`, `2021-22`)
and its integer `year` is the closing year (2021, 2022). A second edition in one year
gets a suffix (`2022-second-phase`, year 2022). `edition` (§3) holds the label as
published; `year` is only a sort key.

Nothing under `data/` imports from the site code. The folder can be lifted into its
own repository unchanged. The edition index files are committed, reviewed data:
`crawl-editions.js` proposes them, a human merges them, because the ICA archive has
duplicate posts and the AVPA URLs change when a PDF is re-uploaded.

## 3. Award file schema

One file per competition edition. Fields marked ✱ are required.

```json
{
  "competition": "ica-americas",          ✱ ica-world | ica-americas | aoc | avpa
  "slug": "2026",                         ✱ file name without extension
  "year": 2026,                           ✱ integer, sort key (season → closing year)
  "edition": "2026",                      ✱ label as published ("2021-22", "2022 Second Phase")
  "title": "Americas – Latin America & the Caribbean … 2026",
  "source": {
    "url": "https://enter.chocolateawards.com/…",   ✱
    "finalists_url": "…/grand-jury-finalists/",     ICA only, when it exists
    "snapshot": "data/raw/ica-americas/2026.html",  ✱
    "fetched": "2026-09-04",                         ✱ ISO date
    "method": "parser",                              ✱ parser | manual-transcription
    "skipped": [ { "index": 12, "raw": "…", "reason": "blank level" } ],
    "filtered": { "rule": "americas-countries", "dropped": 68 }
  },
  "entries": [
    {
      "level": "silver",                  ✱ see vocabulary
      "level_raw": "Silver",              ✱ wording as published
      "maker": "Cacau do Céu Chocolates", ✱ verbatim, non-empty
      "product": "Catongo Variety 80% Dark Chocolate",  ✱ verbatim, non-empty
      "country": "Brazil",                ICA only; null for AoC and AVPA
      "origin_country": "Brésil",         AVPA only (cocoa origin, not company country)
      "company": "Nugali Chocolates Indústria e Comércio LTDA",  AVPA only
      "producer": "Cacauicultor Gilmar",  AVPA only
      "category": "Plain/origin dark chocolate bars",
      "group": "Plain/origin dark bar categories",
      "score": 88.5,                      ICA only
      "special": ["+ Gold: Chocolate Maker", "Best in competition: Overall winner"],
      "flags": ["own-chocolate"],         ICA "(**)" marker
      "private_label_maker": null         ICA "( * NAME )" marker
    }
  ]
}
```

**Level vocabulary** (closed list; anything else fails validation). Parsers map the
published wording to it through a per-source alias table in `lib/levels.js`; the
published wording always survives in `level_raw`.

| level | used by | site disc | scored? | places a brand (§6)? |
|---|---|---|---|---|
| `gold`, `silver`, `bronze` | ICA, AoC | g / s / b | yes | yes |
| `top-gold` | AoC ("Top Gold", the category's best gold) | g | yes | yes |
| `commended` | AoC | o | yes | no |
| `trophy` | AoC 2022 Second Phase ("TROPHY") | o | yes | no |
| `recognition` | ICA non-medal labels: "2018 Americas MMM", "2017 Americas Biome-to-bar Recognition", "World Gold M.M.M" … | o | yes | no |
| `finalist` | ICA grand-jury lists, only for entries that did not medal | o | **no** | no |
| `gourmet-gold`, `gourmet-silver`, `gourmet-bronze` | AVPA | g / s / b | yes | yes |
| `gourmet-medal`, `gourmet-diploma` | AVPA ("Médaille Gourmet", "Diplôme Gourmet") | o | yes | yes (AVPA section) |

Known aliases the table must carry: AoC `GOLD/Gold/Top Gold/SILVER/Silver/Silvere
(source typo)/BRONZE/Bronze/COMMENDED/Commended/TROPHY`; ICA `Gold – <qualifier>` prefixes
(§5); AVPA `Gourmet Or/Argent/Bronze`, `Médaille Gourmet`, `Diplôme Gourmet`.

**Finalist rows** (owner decision, 2026-09-04): stored and displayed on the card as
"Finalista", but they contribute nothing to the prestige index and never place a
brand. The loader emits them with `scored: false` and the scoring functions in
`gerar.js` skip them; the medal tally lists them under distinctions. `level_raw` for
finalist rows is `"Grand Jury Finalist"` (the page title), since the finalists page
prints no level word. If finalists are ever scored, the owner's constraint is: a World
Final finalist must outweigh an Américas finalist, which must outweigh an Academy of
Chocolate Commended. Under the current weights (class `o` = 15 × competition weight)
that gives 150 / 52.5 / 45, so the switch is a single flag, not a new formula; on the
2026-09-04 data it would move Luzz Cacau up two places and Mission and Mestiço up one.

**Text normalisation** of stored strings is limited to HTML-entity decoding, whitespace
collapse and trim. No translation, no case changes.

**Matching key** (used only for comparisons, never stored): lowercase, NFD with
combining marks removed, every Unicode dash (U+2010–U+2015, U+2212) folded to `-`,
then every character outside Unicode letters and digits removed (`[^\p{L}\p{N}]` with
the `u` flag, so CJK and Cyrillic names keep a non-empty key). `"Dark Chocolate 70%
Cocoa – Cacau em Flor"` and `"Dark Chocolate 70% Cocoa - Cacau em Flor"` share a key;
`"Ju Arléo chocolates"` and `"Ju Arléo Chocolates"` share a key; `"Nugali"` and
`"Nugali Chocolates"` do not. The key is used for brand matching (§4), the
finalist↔winner join, the block join and the duplicate rule (§5). A maker or product
whose key is empty is quarantined, never joined.

**Rows without a level, maker or product** are not aborts and not entries: the parser
records them in `source.skipped` with the raw text and a reason (`separator-row`,
`blank-level`, `blank-product`, `repeated-header`, `duplicate-row`,
`unjoined-block-row`, `empty-key`). A file with zero entries still aborts.

## 4. Brand mapping and check

`data/brands.json`:

```json
{
  "brands": {
    "cacau-do-ceu": {
      "name": "Cacau do Céu",
      "aliases": ["Cacau do Céu Chocolates"],
      "signature": ["Chocolate Branco Maracujá Cacau do Céu"]
    },
    "ju-arleo": { "name": "Ju Arléo Chocolates", "aliases": ["Chocolate Da Ju"] },
    "alma": { "name": "Alma Chocolates", "aliases": [] }
  },
  "excluded": {
    "Feitoria do Cacao": "Portugal"
  }
}
```

- **name** is always a matching key; **aliases** add the other spellings the sources
  print, compared by matching key (§3). No fuzzy matching. A brand that renamed itself
  lists the old name. A brand whose name already matches every source spelling has an
  empty list (Alma Chocolates holds only national awards; Monjolo's AoC row
  "MONJOLO CHOCOLATES" matches its name key without an alias).
- **signature**: verbatim product names (from the award files) that receive the ★.
- **excluded**: makers the check would otherwise report, with a one-line reason.

`node data/tools/check.js` prints four lists and exits non-zero when list 1 or 2 is
non-empty:

1. **Unmapped Brazilian maker** — ICA entries with `country` = Brazil whose maker key
   matches no alias key and is not excluded.
2. **Possible spelling drift** — any unmatched maker (all four competitions) whose key
   contains an alias key or is contained by one, either side at least five characters.
   This catches "Nugali" vs "Nugali Chocolates", "Mendoá Chocolates" vs "Mendoá
   Chocolate", "Pretiosus" vs "Pretiosus Chocolate Artesanal". Case and accent
   variants never reach this list; the key already folds them.
3. **Possible Brazilian maker** (non-failing hint list) — AVPA entries with
   `origin_country` = Brésil and an unmatched maker; AoC entries with an unmatched maker
   whose product text contains any of a committed Portuguese token list (`cacau`,
   `ao leite`, `branco`, `intenso`, `castanha`, `cupuaçu`, `baru`, `cumaru`, `doce de
   leite`, `com `). AoC has no country column, so this is the discovery net there.
4. **Dead alias** — an alias matching no entry in any file. Brands with an empty alias
   list are exempt.

The check runs in `npm test` as well, so a silent drop cannot pass CI.

## 5. Fetchers

`node data/tools/fetch.js <competition> <slug>` or `--all` (every slug in the
competition's edition index). `node data/tools/crawl-editions.js <competition>` prints
a proposed edition index for a human to merge.

Shared behaviour (`lib/`):

- **Snapshot first.** Download to `data/raw/<competition>/<slug>.<ext>`, then parse from
  disk. `--offline` skips the download. A download is accepted only if the response
  validates (HTTP 200, expected `<title>`, at least one parseable row); otherwise the
  existing snapshot is left untouched and the script prints the snapshot path it
  expects, so the page can be saved there by hand and the run repeated with
  `--offline`. This is the manual-scrape fallback.
- **Retry and pacing.** academyofchocolate.org.uk sits behind a rate-based WAF that
  returns a Cloudflare block page intermittently; requests carry browser headers, wait
  two seconds between calls, and retry three times with backoff. A block page is
  detected by its `<title>` and never overwrites a snapshot.
- **Fail loudly, quarantine locally.** Zero entries, or an unknown level word after the
  alias table, aborts the run without writing the JSON and prints the offending raw
  row. A row with a blank level, maker or product is quarantined into `source.skipped`
  (§3). Entry and skipped counts are printed per edition.
- **Post-parse rules.** Two rows with the same (level, category, maker key, product
  key) are a source duplicate: the second is quarantined as `duplicate-row`. The same
  product medalling in two categories (AoC prints this every year) is two entries. The
  file validates against the schema.
- **Deterministic output.** Entries keep source order; 2-space JSON, non-ASCII kept.

**Edition discovery** (`crawl-editions.js`):

- Old ICA site: walk `https://www.chocolateawards.com/category/results/page/1..N/`
  (18 pages on 2026-09-04; `/results/page/N/` is broken and must not be used), collect
  `/results/winners/<slug>/` posts, classify by title into competition, year, edition
  label, winners vs finalists vs `not-a-results-page`. A post is a results page only
  if it contains at least one parseable medal row; merit-award posts, presentation
  lists, press-link posts and competition announcements are reported and never
  proposed as editions. Duplicate posts (`world-final-2013-winners` and
  `…-winners-2`) are resolved by hand in the committed index with a `notes` field.
  Pre-2015 finalists lists print maker and country only (no product); they are not
  indexed as `finalists_url`.
- New ICA site: walk `https://enter.chocolateawards.com/competitions/<slug>/page/1..N/`
  for `americas` and `world-final-competitions`; from 2024 only the "Latin America &
  the Caribbean" round is `ica-americas`.
- AoC: parse `academyofchocolate.org.uk/previous-years/` for `/awards/<slug>/` links.
  Years without a page (2007, 2010, 2012, 2014) simply do not appear. `2022-2` is the
  "2022 Second Phase" edition (145 rows, including Miroh! and Gaudens bronzes).
- AVPA: parse `en.avpa.fr/palmaresannuel` anchor blocks for the chocolate contest's
  PDF per year. Each PDF is confirmed by its first line (or by hand for 2023 and 2024,
  whose PDFs carry no title line) before it enters the index.

**ICA parsers** — three markup families, one output:

- `ica-new` (enter.chocolateawards.com, 2023 →) and `ica-old` (chocolateawards.com,
  2015 → 2022) share the `<strong>Level</strong>:` grammar below.
- `ica-2012` (chocolateawards.com, 2012 → 2014) prints the level as plain uppercase
  text inside a `<p>` (`<p>GOLD: Pacari Chocolate (Ecuador) – 70% Raw…</p>`), in
  World Final 2014 sometimes as `<strong>GOLD:</strong>` with the colon inside;
  group and category come from `<h1>`–`<h4>` headings; national-award rows may omit
  the country. It has its own fixtures (§9). An edition that still defies the
  grammar is committed as `manual-transcription`, like AVPA 2021–2023.

Grammar for the `<strong>Level</strong>:` families:

- `<h1>` gives `group`, `<h2>` gives `category`. **Entries come only from medal-listing
  groups.** Every `<h1>` heading is classified against a committed registry
  (`lib/ica-blocks.json`, matched on the heading's matching key so "flavour"/"flavor"
  and apostrophe variants fold): medal-listing groups, and non-category award blocks —
  "'Best in competition' overall winners", "Special flavour ingredient recognition",
  "Chocolate Tasters' Special Prizes", "National awards", "Special awards", "World
  Regional awards". A heading in neither list aborts the run so a new block type is
  handled deliberately.
- An entry is a run starting with `<strong>Level</strong>:` and ending at the next
  `<br>` or `</p>`, whether or not it sits inside a `<p>`. Grammar:
  `Level[ – Qualifier]: maker (Country) – product [(score)] [( * MAKER )] [(**)]`
  followed by zero or more `+ Level : name` or `+ Special : name` runs.
- Rows inside a non-category award block never become entries: they are joined to
  the existing entry by (maker key, product key) and recorded as `special` values
  (`"National awards: Gold – Brazil"`, `"Best in competition: <heading>"`). Luisa
  Abram's 2019 row is therefore one `silver` entry carrying that special, not a gold.
  A block row with no matching entry is quarantined as `unjoined-block-row`.
- A `Level – Qualifier :` prefix inside a medal-listing group (2016 "Gold – USA",
  "Gold – Chocolate Maker") maps to `level` = Level and appends the qualifier to
  `special`. It never starts a separate entry.
- `+ Gold : X` and `+ Special : X` runs are appended to `special` of the preceding
  entry; they never create entries.
- Non-medal labels ("2018 Americas MMM", "2017 Americas Bean-to-bar Chocolatier",
  "2017 Americas Biome-to-bar Recognition", "2017 World Gold M.M.M") map to
  `recognition` with the label in `level_raw`. An unknown label aborts (fail loudly)
  so the alias table is extended deliberately.
- Finalists pages are parsed when the index lists one. Their stable features: a
  `results-link` maker span, an optional country parenthetical, a `<strong>` product,
  an optional score span; rows are separated by `<br>` or by a newline inside the
  block (2021-22 prints no `<br>`). Rows whose (maker key, product key) match a winner
  are dropped; the rest become `finalist` entries with `level_raw`
  `"Grand Jury Finalist"`.
- 2016 "Americas and Asia Pacific" merged round: fetched into `ica-americas/2016.json`
  keeping only entries whose `country` is in `americas-countries.json`; the dropped
  count is recorded in `source.filtered`.

**AoC parser:** the single five-column `<table>` (group, category, level, company,
product). Level words through the alias table; separator rows (blank level and
product, e.g. "BARS", "FILLED CHOCOLATES") and the 2023 "Overall Winner" header row
are quarantined. A blank product with a real maker and level is quarantined too.

**AVPA:**

- 2024, 2025, 2026: `pdf-parse` (pinned to the major version the fixtures are
  generated with; it pulls the native `@napi-rs/canvas`) with its table extraction.
  A per-edition column map keyed by the header row assigns columns: `maker` = "Marque
  commerciale"; `company` = "Nom de la société"; `producer` = "Producteur" when
  present; `product` = "Nom du produit" / "Produit"; `origin_country` = "Pays" /
  "Origine" / "Pays de récolte". A "Prix Spécial …" token in the medal column goes to
  `special`; the row's level is the Gourmet token that follows. The extractor repeats
  the header row on every page; a row identical to the header is quarantined as
  `repeated-header` before level mapping (2026: 12 of 141 rows).
- 2021, 2022, 2023: table extraction returns empty cells or no table at all, so these
  three editions are **hand-transcribed** into the schema from the PDF snapshot and
  committed with `source.method` = `manual-transcription`. They are still validated
  and tested like any other file. (2021: 6 tables / 96 rows; 2022: 53 rows; 2023: no
  detectable table.)

## 6. Generator changes

- **`awards-loader.js`** (site root) reads `data/awards/*/*.json` and `data/brands.json`,
  validates each file against the schema, matches makers to brand ids by key, and
  returns `Map<brandId, Award[]>` in the shape the rest of `gerar.js` already uses:
  `{ c, y, l, p, star, canonical: true, scored }` (`scored` is false only for
  `finalist`). Unscored rows contribute no points in `strengthAll` and `strengthBy`,
  are excluded from `TOTAL_AWARDS`, `OG_DESC` and `compsOf`, and are counted in the
  `o` bucket by `tallyOf` and the masthead `FIELD` tally, which are tallies of
  distinctions, not award counts. Label tables live here: competition →
  `ICA Mundial | ICA Américas | Academy of Chocolate | AVPA Paris`; level → `Ouro |
  Prata | Bronze | Top Gold | Menção | Troféu | Reconhecimento | Finalista | Gourmet
  Ouro | Gourmet Prata | Gourmet Bronze | Medalha Gourmet | Diploma Gourmet`; `y` is
  the edition label with `-` shown as `/` (`2021/22`).
- **Brand cards** keep prose, `year`, `loc`, `site`, `logo`, `src`, `nota`, `highlight`
  and their national awards, and gain `id`. Their ICA/AoC/AVPA awards are removed.
  `awards-patch.json`, `awards-patch2.json`, `awards-patch3.json` are deleted after
  their national entries move to the cards (§10 step 0 commits them first).
- **Badge.** `src` stays and keeps its current meaning for the hand-curated rows.
  Canonical rows carry a per-row "oficial" marker in the award list. The card badge
  reads "fonte: oficial" only when every award on the card is canonical or the card's
  `src` is `oficial`; otherwise it reads "fonte: imprensa" as today. No card can claim
  official verification for a hand-curated row.
- **Sections derived from data.** BR, AOC, AVPA and NAC_NEW collapse into one `MARCAS`
  array without `tier`. Placement uses only levels marked "places a brand" in §3,
  evaluated in order: ICA Mundial → section 1 tier 1; ICA Américas → section 1 tier 2;
  AoC → section 2; AVPA (any AVPA level) → section 3; otherwise section 4 (national).
  Ordering inside sections is unchanged. INTL, SEM_BR and ORIGEM stay as they are:
  INTL cards are foreign brands, keep their hand-typed awards and are not wired to the
  canonical data.
  On today's data this rule moves 10 cards, listed in §10 step 4, and changes the
  masthead counts; the owner accepted the moves on 2026-09-04 as the correct,
  data-driven placement.
- **National awards behind a switch.** `gerar.js` reads one build-time flag,
  `SHOW_NACIONAL` (default `true`, settable as an environment variable and as a
  constant). When `false`: hand-curated national rows are not rendered, contribute
  no points, do not place a brand, and section 4 plus the masthead's "em prêmios
  nacionais" count disappear; brands whose only awards are national are still
  listed, in a short "também premiadas em concursos nacionais" strip under section
  3, so they can be plugged back in with the flag alone. The data on the cards is
  untouched either way, and the golden test runs with the flag `true`. Flipping the
  flag is the owner's decision; the spec only guarantees it is a one-line change.
- **`ATUALIZADO_EM`** is derived: the newest `source.fetched` across award files,
  formatted in Portuguese. Shown in the masthead and footer as today.
- **Build guards** (abort with a message): a card `id` absent from `brands.json`; a
  `brands.json` id without a card; a schema-invalid award file. Unmapped makers are
  check.js's job, not the build's.
- **Outputs:** `dist/index.html`, `dist/og-image.png` (copied from the repo root),
  and `marcas.json` at the repo root (gitignored, as today). The root-level
  `chocolates-brasileiros-premiados.html` is no longer produced.

## 7. Repository layout and cleanup

Target layout:

```
gerar.js  awards-loader.js  package.json  .nvmrc  README.md  BACKLOG.md
logos/  fonts/  favicon.svg  favicon-180.png  og-image.png     (unchanged)
data/     (see §2)
dist/     build output only: index.html, og-image.png
docs/     design/  superpowers/specs/  adversarial-review/
tests/    node:test suites (§9)
```

`package.json` scripts: `build`, `fetch`, `check`, `test`, `crawl-editions`.

**dist/ tracking.** README.md's "Publicar" section documents Cloudflare "Upload
assets" mode, BACKLOG.md says builds run on push, and `dist/index.html` has been
committed by hand in every commit since `package.json` gained a build script. Before
touching `.gitignore`: open the Pages project → Settings → Builds & deployments. If a
build command is configured, `dist/` is gitignored and README's Publicar section is
rewritten; otherwise `dist/` stays tracked and README stays. The migration PR records
which branch was taken.

Cleanup list:

| File | Action | Why |
|---|---|---|
| `awards-patch.json`, `awards-patch2.json` | delete (tracked) | replaced by `data/awards` |
| `awards-patch3.json` | commit first (§10 step 0), then delete | never committed; holds 116 curated awards |
| `chocolates-brasileiros-premiados.html` (root) | delete (tracked) | now `dist/index.html` |
| `chocolates-brasileiros-premiados.pdf` (4 MB, tracked) | **decide**: delete, or move to `docs/` | stale since today's update; no script regenerates it |
| `chocolates-brasileiros-premiados.v1.html`, `gerar.v1.js`, `*Copy.html` | delete (ignored) | git history has them |
| `site-cloudflare.zip`, `pdf_p2.png`, `mock-topo.html`, `icone-*.png` | delete (ignored) | one-off artefacts |
| `migrar-sessao.sh` | delete (ignored) | one-off session migration, already done |
| `logos/incoming/` | delete | empty |
| `.superpowers/` | delete (ignored) | brainstorm mockups |
| `marcas.json` | keep, ignored, repo root | generated snapshot; input to §9 |

## 8. Documentation

- **README.md**: rewrite "Estrutura" and "Regenerar" around `data/`, the commands,
  and the brand-card contract; state coverage (competitions and editions) and that
  counts on the page are computed at build time; keep credits and the ranking
  explanation; fix the Publicar section per §7.
- **data/README.md**: schema (§3), level vocabulary and alias table, matching key,
  `brands.json` contract, edition indexes, fetch/check/crawl commands, manual-snapshot
  and manual-transcription fallbacks, how to add a competition (a parser, an edition
  index, labels in the loader).
- **BACKLOG.md**: replace medal-audit tasks with the routine in §10.

## 9. Testing

`node --test tests/` (Node 22 per `.nvmrc`, built-in runner, no framework):

- **Parsers**: committed fixtures (real pages, trimmed) with expected entry and
  skipped counts and 3–5 known rows each: ICA new (2026 Américas: overall-winner
  block joined, `+ Gold` run, private-label marker, finalists join with a dash
  variant; 2025 World Final: a CJK maker with a non-empty key), ICA old 2015–2022
  family (2019 Américas: Luisa Abram one silver entry with the "National awards"
  special; 2017: a "MMM" recognition row; 2017 and 2021-22 finalists pages, `<br>` and
  newline separated), ICA 2012–2014 family (World Final 2012 plain uppercase, World
  Final 2014 colon-inside-strong, Américas 2013), AoC 2013 (uppercase levels), AoC
  2022 (Top Gold), AoC 2023 (Silvere, Overall Winner header row), AoC 2024 (the same
  product bronze in two categories → two entries), AVPA 2026 (wrapped name cells,
  Diplôme Gourmet, 12 repeated headers skipped), AVPA 2024 (Prix Spécial). AVPA
  fixtures are generated with the pinned `pdf-parse`, never with another extractor.
- **Schema validator**: accepts every committed award file; rejects an unknown level, a
  missing maker, a non-integer year, a duplicate (level, category, maker key, product
  key), and an entry whose maker or product key is empty.
- **Loader**: key normalisation (accents, case, dashes, punctuation), signature star,
  edition label mapping, placement rule including a brand whose only ICA row is a
  finalist, finalist rows contribute zero points and are counted as distinctions,
  badge rule for a card mixing canonical and hand-curated rows, and `SHOW_NACIONAL`
  false: national rows render nowhere, score nothing, and a national-only brand
  appears in the strip.
- **check.js**: the four lists over a small fixture; each of the three §4 drift
  examples is reported when its alias is removed; a name-key match (Monjolo, AoC 2024)
  resolves with no alias and appears on no list.
- **Golden — two artefacts.** `tests/golden/audit-2026-09-04.json` is a frozen export
  of today's `marcas.json`: every Brazilian ICA/AoC/AVPA row as (brand, competition,
  edition, level, n) where `n` is the row's ordinal among audited rows sharing the
  first four values (Nugali holds five ICA Américas 2026 bronzes, so n runs 1–5), plus
  the curated product name for human triage only. It is never regenerated.
  `tests/golden/accepted-deltas.json` lists every audited row the canonical data does
  not reproduce, each with a classification (`parser-bug` is not an allowed value —
  those get fixed; allowed: `curation-error`, `level-corrected`, `edition-corrected`,
  `source-not-published`). The golden test is a multiset check: for every audited
  (brand, competition, edition, level) the loader must supply at least as many rows
  as the audit, minus the accepted deltas for that key; and no accepted delta may be
  stale (its row reappears). New rows the canonical data adds are not failures. This
  is the proof that the migration lost nothing it did not consciously drop.

## 10. Workflow

Routine update, per new edition:

1. `npm run crawl-editions -- <competition>` if the edition is not yet in the index;
   merge the proposed entry.
2. `npm run fetch -- <competition> <slug>` (or save the page manually and `--offline`;
   for AVPA editions the table extractor cannot read, transcribe by hand).
3. `npm run check` → add aliases, or a new card for a Brazilian maker.
4. `npm run build` and `npm test`; the date on the page updates itself.
5. Commit; deploy per §7.

One-time migration, in order:

0. Commit today's audited state (including `awards-patch3.json`) so every curated
   award is in history before anything is deleted; export
   `tests/golden/audit-2026-09-04.json` from it.
1. Crawl and merge the four edition indexes. Fetch all editions. Hand-transcribe AVPA
   2021–2023. Editions that fail to download go on a list for manual scraping.
2. Bootstrap `brands.json` from the 72 cards and the aliases matched on 2026-09-04
   ("Chocolate Da Ju", "Hagi Torrones e Chocolates", "Cuore di Cacao Chocolateria",
   "Nugali", "JUCOLATTE"/"Jucolatte", "Pretiosus", "Cacau do Céu Chocolates",
   "Mendoá Chocolates", "Mission Chocolate", …). Run check.js until list 1 and 2 are
   empty.
3. Reconciliation: diff loader output against the frozen audit, per brand and
   edition. Every difference is classified into `accepted-deltas.json` or fixed in a
   parser. Known differences to expect: ICA 2021-22 has 19 Brazilian rows vs 7 curated;
   AVPA 2021–2022 ChOr rows are "Diplôme Gourmet", curated as "Medalha Gourmet"; AoC
   2022 Second Phase adds Miroh! and Gaudens bronzes; 2026 Américas adds finalist rows.
4. Strip inline awards and patches, derive sections, regenerate. Expected section
   moves on today's data (accepted by the owner): Mendoá, La Lis, Pé de Chocolate,
   Cacau Dourado, Nicolas Chocolate do Belga, Martinus, Casa Lasevicius from section 2
   to section 1 tier 2 (they hold ICA Américas medals); Gallette, Chokolah, Priscyla
   França from section 4 to section 1 tier 2. Masthead counts change accordingly. The
   migration PR includes the before/after membership diff for all cards and asserts it
   equals this list. Run the golden test. Publish.

## 11. Out of scope

- National prizes fetchers (Chocólatras Online is slow and rate-limits; stays manual).
- The "USA & Canada" ICA round and other ICA regional rounds (the parser can handle
  them; they are not in the indexes).
- Wiring INTL (foreign) cards to the canonical data.
- Regenerating the PDF.
- Fuzzy name matching of any kind; the containment rule in §4 is exact-key containment.
