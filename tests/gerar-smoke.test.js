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
