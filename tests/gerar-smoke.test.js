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

  // Every apostrophe variant of "Blum's" the sources print is the one bar, newest first.
  assert.deepEqual(signatureLine(html, 'miroh-chocolate-makers'),
    { p: 'Chocolate ao Leite com Café Blums', sub: 'ICA Américas 2026 · 2025 · 2023 · 2022 · 2021/22' });
});

test('SHOW_NACIONAL=false hides section 4 and national rows', () => {
  execFileSync('node', ['gerar.js'], { cwd: root, encoding: 'utf8', env: { ...process.env, SHOW_NACIONAL: 'false' } });
  const html = fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');
  assert.doesNotMatch(html, /Seção 4 — Prêmios nacionais/);
  assert.doesNotMatch(html, /Bean to Bar Brasil 20/);
  assert.match(html, /também premiadas em concursos nacionais/i);
  execFileSync('node', ['gerar.js'], { cwd: root });   // restore default build
});
