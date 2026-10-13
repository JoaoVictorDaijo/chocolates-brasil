# 🍫 Chocolates Brasileiros Premiados

Diretório curado e ranqueado por **prestígio** das marcas brasileiras de chocolate
fino (bean-to-bar / tree-to-bar / chocolatier), com prêmios verificados e fontes.

**Documento final:** [`dist/index.html`](dist/index.html) — um arquivo **único e
autocontido** (logos e fonte embutidos em base64): abre direto no navegador e pode ser
compartilhado sem dependências. No ar em <https://chocolates-brasil.pages.dev/>.

Os prêmios de ICA Mundial, ICA Américas, Academy of Chocolate e AVPA Paris vêm do
conjunto canônico em [`data/`](data/README.md), buscado das páginas oficiais das
competições: 51 edições, de 2005 a 2026. Os prêmios nacionais (Bean to Bar Brasil, CNA,
Cacau Fest, Chocolat Festival) continuam curados à mão nas fichas das marcas e, por não
terem fonte oficial conferida pelas ferramentas, ficam fora do documento publicado até
entrarem no conjunto canônico (ver [issue #1](https://github.com/JoaoVictorDaijo/chocolates-brasil/issues/1)).

As contagens de marcas e prêmios são calculadas no build e aparecem no topo do
documento — assim como a data de atualização, que é a mais recente entre os `fetched`
dos arquivos de prêmios.

## Como funciona o ranking

Índice de prestígio ponderado pela dificuldade da competição. Pesos por competição:
**ICA Mundial 10 · ICA Américas 3,5 · Academy of Chocolate 3 · AVPA Paris 2,5 ·
Nacional 1,5**; e por medalha: **Ouro > Prata > Bronze > Outros**. Com os prêmios
nacionais ligados, o documento traz duas seções — *reconhecimento internacional* e
*reconhecimento nacional* — que nunca são ranqueadas uma contra a outra; no build padrão
só a primeira existe. Os finalistas do ICA são exibidos na ficha da marca,
mas não pontuam nem promovem a marca de seção. A metodologia completa está dentro do
próprio HTML.

A manchete da barra assinatura reúne os anos apenas da competição escolhida, mesmo
que o produto tenha prêmios em outras. Em empate de medalha, competição e ano, vale a
primeira linha na ordem dos dados.

## Estrutura

| Arquivo | O que é |
|---|---|
| `gerar.js` | **Gerador.** Lê as fichas, os dados canônicos, os logos e a fonte, e produz o HTML autocontido. |
| `awards-loader.js` | Fronteira entre `data/` e o site: valida os arquivos de prêmios, liga fabricante a marca e devolve os prêmios de cada ficha. |
| [`data/`](data/README.md) | **Conjunto canônico de prêmios** — esquema, vocabulário, índices de edições, snapshots e as ferramentas de busca e conferência. |
| `logos/*.bin` | Logos das marcas (embutidos em base64 na geração). |
| `logos/bg-manifest.json` | Logos claros que precisam de fundo escuro (detecção por luminância). |
| `fonts/fraunces.woff2` | Fonte de display (Fraunces), embutida no documento. |
| `dist/index.html` | **Documento final** (saída), pronto para publicar. |
| `tests/` | Suítes do `node:test`: parsers, esquema, loader, `check.js` e o golden da migração. |

## Regenerar

```bash
npm run build
```

Grava `dist/index.html` (e `dist/og-image.png`), além do `marcas.json` na raiz — um
dump das marcas e prêmios, fora do git, usado para conferência.

Por padrão o build omite os prêmios nacionais (`SHOW_NACIONAL` desligado): eles não
pontuam, não promovem marca e a seção nacional não existe; as marcas que só têm prêmio
nacional aparecem numa tira sob a seção 3. `SHOW_NACIONAL=true npm run build` gera o
documento com eles.

## Atualizar prêmios

Uma edição nova de cada vez, na ordem:

```bash
npm run crawl-editions -- ica          # só se a edição ainda não estiver no índice; mescle à mão
npm run fetch -- ica-americas 2026     # baixa, faz o parse e grava data/awards/ica-americas/2026.json
npm run check                          # fabricantes brasileiros sem marca, variações de grafia
npm run build && npm test              # regenera o documento e roda as suítes
```

Depois, commit. A data no topo do documento se atualiza sozinha. O detalhamento — os
fallbacks manuais, o contrato do `brands.json`, como acrescentar uma competição — está
em [`data/README.md`](data/README.md).

## Publicar (grátis)

O repositório está ligado ao **Cloudflare Pages**: um push na `main` publica o
`dist/index.html` como `index.html` do site. Por isso o `dist/` é versionado. Se o
projeto no Cloudflare tiver um build command configurado, ele deve ser `npm run build`.

Para que outras branches não gerem build, em **Workers & Pages → chocolates-brasil → Settings → Builds → Branch control**, mantenha **Production branch** em `main` com os deploys automáticos ativos e escolha **Preview branch: Custom branches**, com apenas `develop` em **Include**. Trabalho novo entra por PR em `develop`, que gera a prévia em `develop.chocolates-brasil.pages.dev`; `main` recebe `develop` por PR de promoção. Commits com `[CF-Pages-Skip]` na mensagem não geram build. As regras para agentes estão em [AGENTS.md](AGENTS.md).

O documento é um único HTML autocontido, então também serve em qualquer host estático —
o **Netlify Drop** (`app.netlify.com/drop`), por exemplo, aceita o arquivo arrastado.

## Créditos

- Lista-semente e curadoria das marcas: **Zélia Frangioni** — [Chocólatras Online](https://chocolatrasonline.com.br/chocomarcas/).
- Ranking, verificação de prêmios e desenvolvimento: **João Victor Daijó**.

Prêmios verificados nas páginas oficiais das competições (International Chocolate
Awards, Academy of Chocolate, AVPA Paris).
