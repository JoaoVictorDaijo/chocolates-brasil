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

const marcasPath = path.join(root, 'marcas.json');

/** The `<article>` of one card, by its `id`. */
function cardOf(html, id) {
  return new RegExp(`<article class="card" id="${id}"[\\s\\S]*?</article>`).exec(html)[0];
}

/** The `★ barra-assinatura` line of one card: `{ p, sub }`. */
function signatureLine(html, id) {
  const card = new RegExp(`<article class="card" id="${id}"[\\s\\S]*?</article>`).exec(html);
  const sig = /<span class="sig-p">(.*?)<\/span><span class="sig-s">(.*?)<\/span>/.exec(card[0]);
  return { p: sig[1], sub: sig[2] };
}

test('the signature line names the best award and every edition of that bar', () => {
  execFileSync('node', ['gerar.js'], { cwd: root, encoding: 'utf8' });
  const html = fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');

  // The gold outranks the ICA Mundial silver of the same bar, so the Portuguese
  // spelling heads the card instead of the Academy of Chocolate's all-caps one.
  assert.deepEqual(signatureLine(html, 'moa-chocolates'), { p: '70% Com Cupuaçu', sub: 'ICA Américas 2023' });

  // No signature bar: the fallback weighs the medal first, so the ICA Américas gold
  // outranks the Academy of Chocolate 2015 gold for a box.
  assert.deepEqual(signatureLine(html, 'chocolat-du-jour'), { p: 'Caramel Scotch Bonbon', sub: 'Ouro · ICA Américas 2021/22' });

  // Every apostrophe variant of "Blum's" the ICA Américas prints is the one bar, newest
  // first; the bar's Academy of Chocolate and ICA Mundial editions belong to those lines.
  assert.deepEqual(signatureLine(html, 'miroh-chocolate-makers'),
    { p: 'Chocolate ao Leite com Café Blums', sub: 'ICA Américas 2026 · 2025 · 2023 · 2021/22' });
});

test('no signature line claims a year its competition did not award the card', () => {
  execFileSync('node', ['gerar.js'], { cwd: root, encoding: 'utf8' });
  const html = fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');
  const marcas = JSON.parse(fs.readFileSync(path.join(root, 'marcas.json'), 'utf8'));
  // `<competition> <year>[ · <year>]` for a signature bar, `<level> · <competition> <year>`
  // without one, so the competition is the last segment before the years.
  const YEARS = /^(.*?) ((?:\d{4}(?:\/\d{2})?)(?: · \d{4}(?:\/\d{2})?)*)$/;
  const claims = [];
  for (const m of marcas) {
    const [, prefix, years] = YEARS.exec(signatureLine(html, m.id).sub);
    const comp = prefix.split(' · ').pop();
    const awarded = new Set(m.awards.filter((a) => a.c === comp).map((a) => a.y));
    for (const y of years.split(' · ')) if (!awarded.has(y)) claims.push(`${m.id}: ${comp} ${y}`);
  }
  assert.deepEqual(claims, []);
});

/** The brand names of the `Também premiadas em concursos nacionais` strip, in page order. */
function nacionalStripNames(html) {
  const strip = /Também premiadas em concursos nacionais<\/p><div class="xrefs-list">([\s\S]*?)<\/div><\/div>/.exec(html);
  return [...strip[1].matchAll(/xref-name">(.*?)<\/span>/g)].map((m) => m[1]).sort();
}

test('the default build hides section 4 (SHOW_NACIONAL off) but keeps the card of a brand with a canonical award', () => {
  execFileSync('node', ['gerar.js'], { cwd: root, env: { ...process.env, SHOW_NACIONAL: 'true' } });
  const shown = fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');
  assert.match(shown, /<h2[^>]*>Reconhecimento nacional<\/h2>/);
  // A curated national row is shown without the ✓ that marks rows read from an official list.
  const inventoShown = [...cardOf(shown, 'invento-chocolates').matchAll(/<li>[\s\S]*?<\/li>/g)].map((m) => m[0]);
  assert.doesNotMatch(inventoShown.find((r) => /Bean to Bar Brasil 2022/.test(r)), /class="aw-src"/);
  const all = JSON.parse(fs.readFileSync(marcasPath, 'utf8'));
  const s4 = all.filter((m) => m.section === 'S4');
  const withCanon = s4.filter((m) => m.awards.some((a) => a.canonical)).map((m) => m.name).sort();
  const noCanon = s4.filter((m) => !m.awards.some((a) => a.canonical)).map((m) => m.name).sort();
  assert.ok(withCanon.length, 'the split is only meaningful while some S4 brand holds a canonical award');

  execFileSync('node', ['gerar.js'], { cwd: root, encoding: 'utf8' });   // default: SHOW_NACIONAL off
  try {
    const html = fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');
    assert.doesNotMatch(html, /<h2[^>]*>Reconhecimento nacional<\/h2>/);
    assert.doesNotMatch(html, /Bean to Bar Brasil 20/);
    assert.match(html, /também premiadas em concursos nacionais/i);

    // Only a scoring award places a card, so an S4 brand can still hold a canonical one.
    // It keeps a full card; the strip is for the brands that have no canonical award at all.
    assert.deepEqual(nacionalStripNames(html), noCanon);
    const invento = cardOf(html, 'invento-chocolates');
    assert.match(invento, /ICA Américas 2023/);
    assert.match(invento, /Finalista/);
    assert.match(html, /Finalistas em competições internacionais/);

    const kept = JSON.parse(fs.readFileSync(marcasPath, 'utf8'));
    assert.deepEqual(kept.filter((m) => m.section === 'S4').map((m) => m.name).sort(), withCanon);
    for (const name of noCanon) assert.ok(!kept.some((m) => m.name === name), `${name} has no card and must not be in marcas.json`);
  } finally {
    execFileSync('node', ['gerar.js'], { cwd: root });   // restore default build
  }
});

test('a card shows every award it lists, marks the canonical ones and scores only the scoring ones', () => {
  const out = execFileSync('node', ['gerar.js'], { cwd: root, encoding: 'utf8' });
  const html = fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');
  const marcas = JSON.parse(fs.readFileSync(marcasPath, 'utf8'));

  // The ✓ marks the rows read from the competition's own list; a curated national row has none.
  // Nugali lists many rows; a single-award card renders no list at all.
  const rows = [...cardOf(html, 'nugali-chocolates').matchAll(/<li>[\s\S]*?<\/li>/g)].map((m) => m[0]);
  const canonRow = rows.find((r) => /ICA Américas 2026/.test(r));
  assert.match(canonRow, /class="aw-src"/);
  assert.ok(!rows.some((r) => /Bean to Bar Brasil/.test(r)), 'national rows are hidden in the default build');

  // A finalist is shown but never places, so it scores nothing: a brand whose only canonical
  // award is one stays in S4, the section for a card with no placing international award.
  const finalists = marcas.flatMap((m) => m.awards.filter((a) => a.canonical && a.l === 'Finalista'));
  assert.ok(finalists.length && finalists.every((a) => a.scored === false));
  const invento = marcas.find((m) => m.id === 'invento-chocolates');
  assert.deepEqual(invento.awards.filter((a) => a.canonical).map((a) => a.l), ['Finalista']);
  assert.equal(invento.section, 'S4');

  // `data-comps` drives the competition filter, so it lists what the card shows — the
  // finalist included — even though that award never reaches the prestige index.
  assert.match(cardOf(html, 'invento-chocolates'), /data-comps="[^"]*americas/);
  assert.match(html, /content="As marcas brasileiras de chocolate fino mais premiadas — 70 marcas e 511 prêmios verificados/);

  // The badge follows the sources of the rows, not the card's own `src`.
  assert.match(fs.readFileSync(path.join(root, 'gerar.js'), 'utf8'), /id: 'utopia-tropical'.*src: 'imprensa'/);
  const utopia = marcas.find((m) => m.id === 'utopia-tropical');
  assert.ok(utopia.awards.length && utopia.awards.every((a) => a.canonical));
  assert.match(cardOf(html, 'utopia-tropical'), /fonte: oficial/);

  assert.match(out, /^ICA Mundial 12 · Américas 29 · AoC 23 · AVPA 3 · Nacional 0$/m);
});
