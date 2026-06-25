# 🍫 Chocolates Brasileiros Premiados

Diretório curado e ranqueado por **prestígio** das marcas brasileiras de chocolate
fino (bean-to-bar / tree-to-bar / chocolatier), com prêmios verificados e fontes.

**Documento final:** [`chocolates-brasileiros-premiados.html`](chocolates-brasileiros-premiados.html)
— também em [PDF](chocolates-brasileiros-premiados.pdf). É um arquivo **único e
autocontido** (logos e fonte embutidos em base64): abre direto no navegador e pode ser
compartilhado sem dependências.

**68 marcas · 401 prêmios · 5 competições** (ICA Mundial, ICA Américas, Academy of
Chocolate, AVPA Paris e prêmios nacionais).

## Como funciona o ranking

Índice de prestígio ponderado pela dificuldade da competição. Pesos por competição:
**ICA Mundial 10 · ICA Américas 3,5 · Academy of Chocolate 3 · AVPA Paris 2,5 ·
Nacional 1,5**; e por medalha: **Ouro > Prata > Bronze > Outros**. O documento traz
duas seções — *reconhecimento internacional* e *reconhecimento nacional* — que nunca
são ranqueadas uma contra a outra. A metodologia completa está dentro do próprio HTML.

## Estrutura

| Arquivo | O que é |
|---|---|
| `gerar.js` | **Gerador.** Lê dados + patches + logos + fonte e produz o HTML autocontido. |
| `awards-patch.json` / `awards-patch2.json` | Prêmios adicionais verificados, mesclados na geração. |
| `logos/*.bin` | Logos das marcas (embutidos em base64 na geração). |
| `logos/bg-manifest.json` | Logos claros que precisam de fundo escuro (detecção por luminância). |
| `fonts/fraunces.woff2` | Fonte de display (Fraunces), embutida no documento. |
| `chocolates-brasileiros-premiados.html` | **Documento final** (saída). |
| `chocolates-brasileiros-premiados.pdf` | Versão em PDF. |
| `dist/index.html` | Cópia do documento como `index.html`, pronta para publicar. |

## Regenerar

```bash
node gerar.js
```

Produz `chocolates-brasileiros-premiados.html`. Para atualizar a versão publicável:

```bash
cp chocolates-brasileiros-premiados.html dist/index.html
```

## Publicar (grátis)

O documento é um único HTML autocontido — basta subir `dist/index.html` (com o nome
`index.html`) em qualquer host estático:

- **Netlify Drop** — `app.netlify.com/drop`: arrasta o arquivo e recebe a URL na hora.
- **Cloudflare Pages** — Create → aba **Pages** → **Upload assets** (não *Workers*).

## Créditos

- Lista-semente e curadoria das marcas: **Zélia Frangioni** — [Chocólatras Online](https://chocolatrasonline.com.br/chocomarcas/).
- Ranking, verificação de prêmios e desenvolvimento: **João Victor Daijó**.

Prêmios verificados preferencialmente nas páginas oficiais das competições
(International Chocolate Awards, Academy of Chocolate, AVPA Paris, Cocoa of Excellence).
