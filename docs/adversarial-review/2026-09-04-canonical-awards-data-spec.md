# IAR ledger — canonical awards data spec

Target: `docs/superpowers/specs/2026-09-04-canonical-awards-data-design.md` (spec, pre-implementation)
Skill: moveusp-standards 2.9.0 · Mechanism: self-authored Workflow · Reviewers/refuters: Opus, extra-high effort
Scratch root: `/tmp/iar-chocolates-brasil-spec/` (rsync copies without `.git`; spec is uncommitted)

| Round | Mode | Raw | Verified (after refutation) | Fixed | Surviving | Decision |
|---|---|---|---|---|---|---|
| 1 | full, 4 lenses (repo claims, source claims, consistency, migration risk), 22 agent runs | 62 (46 C/I, 16 Minor) | 10 clusters | 10 (8 auto-fixed; #5 finalists stored but unscored, #7 moves accepted — owner decisions applied to the spec) | 0 | owner chose round 2 (lite, delta-scoped) |
| 2 | lite, 2 lenses (grammar-and-data, golden-and-check), 16 agent runs | 18 (14 C/I, 4 Minor) | 7 clusters | 7 auto-fixed in spec | 0 | converged; new text is small and rule-level — owner to confirm stop |

## Round 2 — surviving clusters and their resolution

| # | Cluster | Severity | Action | Acceptance criterion carried into the spec |
|---|---|---|---|---|
| 1 | ICA non-category award blocks ("National awards" etc.) turned into medals (cluster 2) | Critical | auto-fix: entries only from medal-listing groups; committed `lib/ica-blocks.json` heading registry; block rows joined as `special`; unknown heading aborts | §9 ICA 2019 fixture: Luisa Abram one silver with "National awards: Gold – Brazil" |
| 2 | Uniqueness assertion aborts on legitimate cross-category duplicates | Critical | auto-fix: key gains `category`; identical rows quarantined `duplicate-row` | §9 AoC 2024 fixture: same product bronze in two categories → two entries |
| 3 | Pre-2015 ICA markup is a different grammar | Critical | auto-fix: third parser `ica-2012` (plain-text levels), fixtures for WF 2012, WF 2014, Américas 2013; manual-transcription fallback | §9 fixtures |
| 4 | Finalists-page markup description matches only the new site | Important | auto-fix: stable features stated; `<br>` or newline separation; pre-2015 product-less lists not indexed | §9 finalists fixtures 2017 and 2021-22 |
| 5 | Golden key is set-valued, dropped duplicate rows pass | Critical | auto-fix: multiset with ordinal `n` per (brand, competition, edition, level) | §9 golden section |
| 6 | Ju Arléo list-2 example is a case-only variant the key folds | Important | auto-fix: example removed; key folding stated | §9 check.js test over the three remaining examples |
| 7 | Brand `name` never stated as a matching key; Monjolo empty-alias example loses its AoC 2024 bronze | Important | auto-fix: `name` is always a key; example replaced by Alma Chocolates | §9 loader/check test: "MONJOLO CHOCOLATES" resolves with no alias |

Minors folded: AVPA repeated header rows quarantined; matching key uses `[^\p{L}\p{N}]u` and empty keys are quarantined; crawl classification gains `not-a-results-page`; §6 states which counters are award counts vs distinction tallies.

## Round 1 — surviving clusters and their resolution

| # | Cluster | Severity | Action | Acceptance criterion carried into the spec |
|---|---|---|---|---|
| 1 | AoC level tokens outside vocabulary abort editions (cluster 4) | Critical | auto-fix: `top-gold`, `trophy`, alias table incl. `Silvere`, quarantine of blank rows into `source.skipped` | §9 AoC 2022/2023 fixtures; `fetch aoc --all --offline` completes for every indexed edition |
| 2 | Year ranges instead of committed edition indexes (cluster 7) | Critical | auto-fix: `data/editions/*.json` for all four competitions, slug-named files, `crawl-editions.js`, 2016 merged round filtered by country list | §9 schema test; §10 step 1 |
| 3 | ICA row grammar mis-described (cluster 6) | Critical | auto-fix: `<h1>` group, run-terminated entries, `Level – Qualifier :` prefix, `+ Gold/Special` appended, `recognition` level, overall-winner join, no-duplicate assertion | §9 ICA new/old fixtures |
| 4 | Finalist↔winner dedupe key undefined | Important | auto-fix: matching key defined in §3 (dash folding) | §9 finalists join fixture with dash variant |
| 5 | Finalist rows scored/placed like medals; no `level_raw` | Important | needs owner decision (scoring); placement excluded provisionally; `level_raw` = "Grand Jury Finalist" | §9 loader test: brand whose only ICA row is a finalist |
| 6 | AVPA: no index, per-edition columns, no maker column (cluster 4) | Critical | auto-fix: `avpa.json` index, table extraction with per-edition column map, `maker` = Marque commerciale, hand transcription for 2021–2023, Prix Spécial → `special` | §9 AVPA 2024/2026 fixtures |
| 7 | Derived placement moves cards silently (cluster 3) | Critical | needs owner decision (accept moves); placement restricted to placing levels; moves enumerated in §10 step 4 | §10 step 4 membership diff asserted |
| 8 | check.js blind to AoC drift (cluster 3) | Critical | auto-fix: containment rule replaces word overlap; Portuguese-token hint list for AoC; check runs in `npm test` | §9 check.js test over §4 examples |
| 9 | Badge overclaims after dropping `src` (cluster 3) | Important | auto-fix: `src` kept; per-row marker; card badge rule stated | §9 loader badge test |
| 10 | Golden asserts equality the migration must break (cluster 2) | Critical | auto-fix: frozen audit export + `accepted-deltas.json`, presence invariant | §9 golden section |

## Refutation kills (round 1)

| Round | Cluster | Category | Variants folded |
|---|---|---|---|
| 1 | ICA 2012–2014 is a different markup family, "same engine" false | misread | 2 (duplicate) |
| 1 | Finalists pages have a level-less grammar the parser cannot read | misread | 1 |
| 1 | Season editions have no year/filename/label rule | misread | 3 (duplicate) — fact retained as Minor, fixed in §2 |
| 1 | `excluded` map has no reachable trigger | misread | 2 (duplicate) |
| 1 | Golden window 2020–2026 leaves pre-2020 rows unprotected | already-handled | 1 — superseded by the golden redesign in §9 |
| 1 | ★ signature matched verbatim against varying official names | misread | 2 (duplicate) |
| 1 | §7 gitignores dist/ with no step producing og-image.png | misread | 1 |

Dedup: 46 C/I findings → 17 clusters (29 variants folded as `duplicate`).

## Refutation kills (round 2)

| Round | Cluster | Category | Variants folded |
|---|---|---|---|
| 2 | Blank-product quarantine makes the `trophy` level unreachable | already-handled | 1 |
| 2 | check.js list 2 has no exclusion clause, foreign makers wedge CI | already-handled | 1 (the `excluded` map covers it) |
| 2 | Step 4 membership diff ignores cards the migration must add | misread | 1 |
| 2 | Star signature has no migration step / dead-signature check | misread | 1 (example string is a verbatim official name) |
| 2 | "fonte: oficial" badge vacuously true for a zero-award card | already-handled | 1 |
| 2 | AoC drift nets miss real makers (5-char floor, token list) | already-handled | 1 (golden + reconciliation catch them) |

Dedup: 14 C/I findings → 13 clusters (1 variant folded as `duplicate`).

## Minor findings (round 1, 16) folded into the revision

awards-patch3 untracked (×3) · Cloudflare mode unverified · outputs list vs §7 (×2) · season slug rule · `assets/` undefined (×2) · `product` required vs fail-loudly · WAF not challenge · pdf-parse text/API · ≥3-word rule undefined · dead aliases for national-only cards · INTL cards exempt · ICA 2016 merged round.

## Handoff documents

- Round 1 workflow transcripts: `~/.claude/projects/-home-mainframe-chocolates-brasil/1990d141-c19e-4885-b480-1a8682b782c6/subagents/workflows/wf_3c85cca1-e6e/`
- Round 1 structured result: scratchpad `iar-round1.json`
- Round 2 workflow transcripts: `~/.claude/projects/-home-mainframe-chocolates-brasil/1990d141-c19e-4885-b480-1a8682b782c6/subagents/workflows/wf_9a2976fc-d43/`
- Round 2 structured result: scratchpad `iar-round2.json`
