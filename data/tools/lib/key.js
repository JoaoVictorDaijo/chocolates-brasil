'use strict';

/**
 * Matching key: comparisons only, never stored. Folds case, accents and every
 * non-alphanumeric character so the spelling variants three sources print for
 * one name collapse, while CJK and Cyrillic names keep a non-empty key.
 * Definition: data/README.md (Chave de comparação).
 */
function key(s) {
  return foldDashes(String(s || '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, ''))
    .replace(/[^\p{L}\p{N}]/gu, '');
}

/** Folds every Unicode dash (U+2010–U+2015, U+2212) to ASCII `-`. */
function foldDashes(s) {
  return String(s || '').replace(/[‐-―−]/g, '-');
}

module.exports = { key, foldDashes };
