'use strict';

/**
 * Matching key: comparisons only, never stored. Folds case, accents and every
 * non-alphanumeric character so the spelling variants three sources print for
 * one name collapse, while CJK and Cyrillic names keep a non-empty key.
 * Definition: docs/superpowers/specs/2026-09-04-canonical-awards-data-design.md §3.
 */
function key(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/\p{M}/gu, '')
    .replace(/[‐-―−]/g, '-')
    .replace(/[^\p{L}\p{N}]/gu, '');
}

module.exports = { key };
