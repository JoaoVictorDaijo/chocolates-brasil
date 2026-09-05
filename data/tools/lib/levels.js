'use strict';

const { key, foldDashes } = require('./key.js');

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
// Tested against the label with dashes folded and whitespace runs collapsed, so the
// hyphen and spacing variants the source prints all resolve; the fragments keep the
// punctuation "M.M.M" needs, which a matching key would strip.
const ICA_RECOGNITION = [/\bmmm\b/i, /m\.m\.m/i, /recognition/i, /bean-to-bar chocolatier/i, /biome-to-bar/i];

function mapLevel(source, raw) {
  const k = key(raw);
  const hit = (ALIASES[source] || {})[k];
  if (hit) return hit;
  if (source === 'ica') {
    const label = foldDashes(raw).replace(/\s+/g, ' ');
    if (ICA_RECOGNITION.some((re) => re.test(label))) return 'recognition';
  }
  return null;
}

// The registry carries every published spelling of a heading (ICA prints both
// "flavour" and "flavor" across editions); the matching key folds only case,
// accents and punctuation, never wording.
const BLOCKS = require('./ica-blocks.json');
const BLOCK_KEYS = { medal: new Set(BLOCKS.medal.map(key)), block: new Set(BLOCKS.block.map(key)) };

function icaBlock(heading) {
  const k = key(heading);
  if (BLOCK_KEYS.block.has(k)) return 'block';
  if (BLOCK_KEYS.medal.has(k)) return 'medal';
  return null;
}

module.exports = { LEVELS, mapLevel, icaBlock };
