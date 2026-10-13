# `data/` — o conjunto canônico de prêmios

Todos os prêmios internacionais que o site mostra vêm daqui. Cada linha é rastreável
até a página ou o PDF oficial da competição: o `data/raw/` guarda a fonte como ela foi
publicada, e o arquivo em `data/awards/` é o que o parser leu dela. Nada aqui importa
código do site — a pasta pode ser levada inteira para outro repositório.

**Cobertura** — toda edição publicada, todo premiado do mundo (o recorte brasileiro do
site acontece depois, no mapeamento de marcas):

| Competição | id | Edições | Período |
|---|---|---|---|
| ICA World Final | `ica-world` | 13 | 2012–2025 |
| ICA Américas | `ica-americas` | 14 | 2012–2026 |
| Academy of Chocolate | `aoc` | 18 | 2005–2025 |
| AVPA Paris (Chocolats élaborés à l'origine) | `avpa` | 6 | 2021–2026 |

São 51 arquivos e 14.125 prêmios. Os prêmios **nacionais** (Bean to Bar Brasil, CNA,
Cacau Fest, Chocolat Festival) não estão aqui: continuam curados à mão nas fichas de
`gerar.js`.

## Layout

```
data/
  README.md                       este arquivo
  brands.json                     nome oficial do fabricante → id da marca
  editions/
    ica-world.json                uma entrada por edição publicada: slug, year,
    ica-americas.json             edition, title, url, finalists_url, parser, notes
    aoc.json
    avpa.json                     ano → URL do PDF (URLs Wix com hash de conteúdo)
  awards/
    ica-world/<slug>.json         2012.json … 2020-21.json … 2025.json
    ica-americas/<slug>.json      2012.json … 2021-22.json … 2026.json
    aoc/<slug>.json               2005.json … 2022-second-phase.json … 2025.json
    avpa/<slug>.json              2021.json … 2026.json
  raw/
    <competição>/<slug>.<ext>     a fonte, salva literalmente (HTML ou PDF)
    ica-*/<slug>-finalists.html   a página de finalistas, quando a edição tem uma
  tools/
    fetch.js                      baixa, faz o parse e grava o arquivo de prêmios
    check.js                      saúde do mapeamento fabricante → marca
    crawl-editions.js             propõe os índices de edições a partir dos sites
    reconcile.js                  confere o conjunto canônico contra a auditoria
    transcribe-avpa.js            rascunho de transcrição manual dos PDFs da AVPA
    export-audit.js               congela o `marcas.json` curado como auditoria
    lib/                          snapshot, esquema, chave, níveis, texto (text.js)
                                  e os blocos do ICA (ica-blocks.json)
    parsers/                      ica-new, ica-old, ica-2012, ica-strong,
                                  ica-finalists, aoc, avpa
    americas-countries.json       filtro da rodada de 2016 (Américas + Ásia-Pacífico)
```

**Slug e ano.** O nome do arquivo é o slug da edição. Edição de um ano só tem o ano por
slug (`2018`); temporada mantém o rótulo publicado (`2020-21`, `2021-22`) e seu `year`
inteiro é o ano de fechamento; uma segunda edição no mesmo ano ganha sufixo
(`2022-second-phase`, ano 2022). `edition` guarda o rótulo como publicado; `year` só
serve de ordenação.

Os índices em `editions/` são dados **revisados à mão**: `crawl-editions.js` propõe, uma
pessoa mescla — o arquivo do ICA tem posts duplicados e as URLs da AVPA mudam quando um
PDF é reenviado.

## Esquema do arquivo de prêmios

Um arquivo por edição. Os campos marcados com ✱ são obrigatórios; o resto é opcional e
depende da fonte.

```json
{
  "competition": "ica-americas",          ✱ ica-world | ica-americas | aoc | avpa
  "slug": "2026",                         ✱ nome do arquivo sem extensão
  "year": 2026,                           ✱ inteiro, chave de ordenação
  "edition": "2026",                      ✱ rótulo publicado ("2021-22", "2022 Second Phase")
  "title": "Americas – Latin America & the Caribbean … 2026 – Winners",
  "source": {
    "url": "https://enter.chocolateawards.com/…",   ✱
    "finalists_url": "…/grand-jury-finalists/",     só ICA, quando existe
    "snapshot": "data/raw/ica-americas/2026.html",  ✱
    "fetched": "2026-09-07",                        ✱ data ISO
    "method": "parser",                             ✱ parser | manual-transcription
    "skipped": [ { "raw": "…", "reason": "blank-level" } ],
    "filtered": { "rule": "americas-countries", "dropped": 76 }
  },
  "entries": [
    {
      "level": "gold",                    ✱ vocabulário fechado, ver abaixo
      "level_raw": "Gold",                ✱ a grafia publicada
      "maker": "Cacao Hunters",           ✱ literal, não vazio
      "product": "Arhuacos 72%",          ✱ literal, não vazio
      "country": "Colombia",              só ICA; null na AoC e na AVPA
      "origin_country": "Brésil",         só AVPA (origem do cacau, não do fabricante)
      "company": "Nugali Chocolates Ind. e Com. LTDA",   só AVPA
      "producer": "Cacauicultor Gilmar",  só AVPA
      "category": "Plain/origin dark chocolate bars",
      "group": "Plain/origin bars",
      "score": 90.8,                      só ICA
      "special": ["+ Gold: Chocolate Maker", "Best in competition overall winners: …"],
      "flags": ["own-chocolate"],
      "private_label_maker": null         marcador "( * NOME )" do ICA
    }
  ]
}
```

Um arquivo com zero entradas é erro, nunca um arquivo vazio. A normalização de texto se
limita a decodificar entidades HTML, colapsar espaços e aparar as pontas: nada de
tradução, nada de mudança de caixa. Saída determinística: as entradas mantêm a ordem da
fonte, JSON com 2 espaços e não-ASCII preservado.

`source.fetched` é a data em que o arquivo foi **gerado pelo parser** (é ela que vira a
data de atualização do site), não a data em que o snapshot foi baixado.

### `flags`

| flag | quando |
|---|---|
| `own-chocolate` | marcador `(**)` do ICA: o chocolate é feito pelo próprio fabricante |
| `maker-level` | prêmio da AoC dado ao fabricante numa categoria, não a um produto — o `product` é o texto da categoria ("Best Milk Chocolate Bar") |

## Vocabulário de níveis

Lista fechada: qualquer outra palavra reprova na validação. `disc` é o disco que o site
desenha (g/s/b/o), `scored` diz se a linha soma pontos no índice de prestígio e `places`
diz se ela é capaz de colocar a marca numa seção mais forte.

| level | usado por | disc | scored | places |
|---|---|---|---|---|
| `gold` | ICA, AoC | g | sim | sim |
| `silver` | ICA, AoC | s | sim | sim |
| `bronze` | ICA, AoC | b | sim | sim |
| `top-gold` | AoC ("Top Gold", o melhor ouro da categoria) | g | sim | sim |
| `commended` | AoC | o | sim | não |
| `trophy` | AoC 2022 Second Phase ("TROPHY") | o | sim | não |
| `recognition` | rótulos não-medalha do ICA ("2018 Americas MMM", "Biome-to-bar Recognition", "World Gold M.M.M") | o | sim | não |
| `finalist` | listas de grand jury do ICA, só para quem não medalhou | o | **não** | não |
| `gourmet-gold` | AVPA | g | sim | sim |
| `gourmet-silver` | AVPA | s | sim | sim |
| `gourmet-bronze` | AVPA | b | sim | sim |
| `gourmet-medal` | AVPA ("Médaille Gourmet") | o | sim | sim |
| `gourmet-diploma` | AVPA ("Diplôme Gourmet") | o | sim | sim |

Os finalistas aparecem na ficha da marca como "Finalista", mas não somam ponto nenhum e
nunca promovem a marca de seção. O `level_raw` deles é `"Grand Jury Finalist"`, porque a
página de finalistas não imprime palavra de nível.

### Tabela de apelidos (`tools/lib/levels.js`)

A grafia publicada sempre sobrevive em `level_raw`; o `level` sai desta tabela. A
comparação usa a chave de comparação (abaixo), então caixa, acentos e pontuação já
dobram sozinhos — `GOLD`, `Gold` e `gold` são a mesma entrada.

| fonte | grafia publicada | level |
|---|---|---|
| AoC | `Gold` | `gold` |
| AoC | `Top Gold` | `top-gold` |
| AoC | `Silver` | `silver` |
| AoC | `Silvere` (erro de digitação da fonte, AoC 2023) | `silver` |
| AoC | `Bronze` | `bronze` |
| AoC | `Commended` | `commended` |
| AoC | `TROPHY` | `trophy` |
| ICA | `Gold` / `Silver` / `Bronze` | `gold` / `silver` / `bronze` |
| AVPA | `Gourmet Or` | `gourmet-gold` |
| AVPA | `Gourmet Argent` | `gourmet-silver` |
| AVPA | `Gourmet Bronze` | `gourmet-bronze` |
| AVPA | `Médaille Gourmet` | `gourmet-medal` |
| AVPA | `Diplôme Gourmet` | `gourmet-diploma` |

**Regra de reconhecimento do ICA:** um rótulo que não esteja na tabela e contenha `MMM`,
`M.M.M`, `Recognition`, `Bean-to-bar Chocolatier` ou `Biome-to-bar` vira `recognition`.
Qualquer outro rótulo desconhecido **aborta** a edição, para que a tabela cresça de
propósito e não por acidente.

## Chave de comparação

Só para comparar; nunca é gravada. Definição (`tools/lib/key.js`): minúsculas, NFD com
as marcas de combinação removidas, todo traço Unicode (U+2010–U+2015, U+2212) dobrado
para `-` e, por fim, todo caractere fora de letras e dígitos Unicode removido
(`[^\p{L}\p{N}]` com a flag `u`, para que nomes em CJK e cirílico continuem com chave
não vazia).

Assim `"Dark Chocolate 70% Cocoa – Cacau em Flor"` e `"… - Cacau em Flor"` têm a mesma
chave; `"Ju Arléo chocolates"` e `"Ju Arléo Chocolates"` também. `"Nugali"` e
`"Nugali Chocolates"` **não** — nada de comparação aproximada, em lugar nenhum.

A chave é o que une fabricante a marca, finalista a vencedor, linha de bloco a entrada,
e o que detecta duplicata. Fabricante ou produto cuja chave sai vazia é posto de
quarentena, nunca unido.

## Quarentena: `source.skipped`

Uma linha que o parser não conseguiu ler não some nem derruba a edição: fica em
`source.skipped` com o texto cru e o motivo, para que a perda seja visível.

| motivo | o que é |
|---|---|
| `blank-level` | linha da tabela sem palavra de nível: separador ("BARS", "FILLED CHOCOLATES"), categoria sem premiado ("No Awards Given") e a linha de cabeçalho "Overall Winner" da AoC 2023 |
| `blank-maker` | linha com nível, sem fabricante |
| `blank-product` | linha com nível e fabricante, sem produto; na AoC só quando a categoria também está vazia, porque a linha sem produto mas com categoria é prêmio ao fabricante (`maker-level`) e o produto guardado é a categoria |
| `repeated-header` | a linha de cabeçalho que o extrator de PDF repete em toda página (AVPA) |
| `duplicate-row` | a fonte publicou o mesmo (nível, categoria, fabricante, produto) duas vezes |
| `empty-key` | fabricante ou produto cuja chave de comparação é vazia |
| `unparsed-run` | trecho que começa como linha de medalha mas não fecha a gramática |
| `unparsed-body` | nível reconhecido, corpo `fabricante (País) – produto` ilegível |
| `unjoined-block-row` | linha de bloco de prêmio especial que não achou entrada correspondente |
| `unlevelled-finalist-row` | linha de finalista sem nível nas páginas de 2012–2014 |
| `page-rows-incomplete` | a página do PDF tem menos linhas de tabela que medalhas impressas (AVPA) |

`crawl-editions.js` usa um motivo parecido nas suas anotações — `not-a-results-page`,
para o post do arquivo do ICA que não é lista de vencedores nem de finalistas. Ele fica
no `notes` da proposta de edição, não em `source.skipped`.

### Limitações de cobertura

- **AVPA 2024:** falta a linha 63 (Aprochok, Médaille Gourmet); a primeira página
  registra 13 linhas extraídas para 14 medalhas impressas (`page-rows-incomplete`).
- **ICA Mundial 2017:** 11 reconhecimentos Triple M.M.M ficam em `unparsed-body`,
  porque a fonte omite o país e a gramática do `ica-strong` exige esse campo.
- **ICA Mundial 2019:** 26 prêmios de degustadores ficam em `unjoined-block-row` por
  não encontrarem uma entrada de medalha correspondente.
- **AoC 2022 2ª fase:** os troféus de Table e Cartografie no bloco BRAND EXPERIENCE
  ficam em `blank-product`, sem categoria nem produto. O esquema exige `product`;
  na AoC a categoria pode ocupar esse campo em prêmios ao fabricante, mas ambos vazios
  impedem guardar a linha.

Essas perdas estão registradas em `source.skipped`; o conjunto canônico não representa
essas linhas como prêmios.

## Blocos de prêmios do ICA

O `ica-strong` classifica cada título `<h1>` pelo registro `tools/lib/ica-blocks.json`;
um título desconhecido aborta a edição, para que um bloco novo não vire medalha por
engano. Blocos de prêmios especiais são unidos à medalha pelo fabricante e produto e
guardados em `special`, sem criar outra medalha. Reconhecimentos são entradas próprias
e não servem de alvo dessa união.

Duas linhas com o mesmo nível, categoria, chave de fabricante e chave de produto são
duplicatas: a repetição fica em `duplicate-row`. O mesmo produto premiado em categorias
diferentes continua sendo duas entradas.

## `data/brands.json`

Liga a grafia que a fonte publica à ficha do site.

```json
{
  "brands": {
    "cacau-do-ceu": {
      "name": "Cacau do Céu",
      "aliases": ["Cacau do Céu Chocolates"],
      "signature": ["Chocolate Branco Maracujá Cacau do Céu"]
    },
    "alma-chocolates": { "name": "Alma Chocolates", "aliases": [], "signature": [] }
  },
  "excluded": {
    "Feitoria do Cacao": "Portugal",
    "Adoleta": "Brasil — sem card no site; ICA Américas 2020/21 (bronze)"
  }
}
```

- **`name`** é sempre uma chave de busca: uma marca cujo nome já bate com todas as
  grafias da fonte tem `aliases` vazio.
- **`aliases`** acrescenta as outras grafias que as fontes imprimem, comparadas por
  chave. Marca que se renomeou lista o nome antigo.
- **`signature`** guarda os nomes de produto, **exatamente como a fonte os grafa**, que
  ganham a ★ de barra assinatura na ficha. O loader só compara com os produtos dos
  arquivos de prêmios, então um `signature` que nomeia produto de premiação nacional não
  tem efeito nenhum aqui: as sete fichas nesse caso trazem `star: true` na própria linha
  do card, em `gerar.js`.
- **`excluded`** são fabricantes que o `check.js` acusaria, cada um com o motivo numa
  linha. Fabricante brasileiro sem ficha no site segue a convenção
  `"Brasil — sem card no site; <edição> (<medalhas>)"`, para que a exclusão seja um
  lembrete de card faltando, e não um sumiço.

`awards-loader.js` aborta se duas marcas reivindicarem a mesma grafia, e `gerar.js`
aborta se um `id` de ficha não existir no `brands.json` (ou vice-versa).

## Comandos

```bash
npm run crawl-editions -- ica          # ou: aoc — imprime índices propostos, para mesclar à mão
npm run fetch -- ica-americas 2026     # uma edição
npm run fetch -- aoc --all             # todas as edições do índice
npm run fetch -- aoc 2025 --offline    # sem baixar: lê o snapshot já salvo
npm run check                          # saúde do mapeamento fabricante → marca
npm run reconcile                      # confere o conjunto canônico contra a auditoria
npm test                               # check.js + as suítes de teste
npm run build                          # regenera dist/index.html
```

`npm run fetch` baixa primeiro para `data/raw/<competição>/<slug>.<ext>` e só então faz o
parse, a partir do disco. Um download só é aceito se a resposta validar (HTTP 200, sem
página de bloqueio do WAF, com linhas de medalha legíveis); senão o snapshot que já
estava lá fica intocado. Edição a edição: uma que falha custa só ela mesma, e as outras
seguem. O site da Academy of Chocolate fica atrás de um WAF por taxa, então as
requisições levam cabeçalhos de navegador, esperam dois segundos entre chamadas e
tentam três vezes com backoff.

`npm run check` imprime quatro listas e sai com erro quando **qualquer uma** das duas
primeiras listas não estiver vazia: (1) fabricante brasileiro sem marca e sem exclusão;
(2) provável variação de grafia — chave que contém, ou está contida em, a chave de uma
marca; (3) pista de fabricante possivelmente brasileiro (origem Brésil na AVPA, produto
com palavra em português na AoC); (4) apelido morto, que nenhum arquivo grafa.

## Quando o automático não dá conta

**Página que não desce.** Quando o download falha, a mensagem de erro nomeia o caminho
exato do snapshot que ele esperava. Salve a página nesse caminho pelo navegador e rode
de novo com `--offline`:

```bash
npm run fetch -- aoc 2021           # falhou: a mensagem nomeia data/raw/aoc/2021.html
# salve a página em data/raw/aoc/2021.html
npm run fetch -- aoc 2021 --offline
```

**AVPA 2021–2023.** Nesses três PDFs a extração de tabela devolve células vazias ou
tabela nenhuma, então as edições são transcritas à mão. O `transcribe-avpa.js` faz o
rascunho — quebra o texto nas palavras de medalha e deixa `maker` e `product` como `??`
ao lado do trecho cru. O dump é a camada de texto do próprio PDF, extraída com o
`getText()` do `pdf-parse`:

```bash
node -e "const fs=require('fs'),{PDFParse}=require('pdf-parse');(async()=>{const p=new PDFParse({data:fs.readFileSync('data/raw/avpa/2021.pdf')});fs.writeFileSync('dump.txt',(await p.getText()).text);await p.destroy();})()"
node data/tools/transcribe-avpa.js 2021 dump.txt <url-do-pdf>   # → data/awards/avpa/2021.draft.json
# preencha cada linha a partir de `_raw`, apague `_raw`, salve como 2021.json
```

O arquivo final vai com `"method": "manual-transcription"` no `source` e a edição ganha
o mesmo campo no índice, para que o `fetch` a deixe em paz. Ele valida e é testado como
qualquer outro. Os `*.draft.json` são ignorados pelo git, pelo loader e pelo `check.js`.

## A rede de segurança: auditoria congelada

A migração dos prêmios digitados à mão para os dados canônicos é conferida por dois
arquivos em `tests/golden/`:

- **`audit-2026-09-04.json`** — exportação congelada do `marcas.json` de antes da
  migração: cada prêmio internacional curado como (marca, competição, edição, nível, n),
  onde `n` é a ordem da linha entre as que compartilham as quatro primeiras chaves.
  **Nunca é regerado** (`export-audit.js` o produziu uma vez).
- **`accepted-deltas.json`** — cada linha auditada que os dados canônicos não reproduzem,
  com o motivo. Os valores permitidos são `curation-error` (a ficha errou),
  `level-corrected` (a fonte publica outro nível), `edition-corrected` (a fonte publica
  outra edição) e `source-not-published` (a fonte não publica a linha). `parser-bug`
  **não** é um valor permitido: erro de parser se conserta.

`npm run reconcile` compara os dois e imprime `missing: 0  stale: 0` quando está tudo em
ordem — `missing` é linha auditada que sumiu sem delta que a explique, `stale` é delta
cuja linha voltou a aparecer e que portanto precisa ser removido. O teste golden
(`tests/golden.test.js`) faz a mesma conferência na suíte. Linha nova que os dados
canônicos acrescentam nunca é falha.

## Como acrescentar uma competição

1. **Parser** em `data/tools/parsers/<nome>.js`, exportando `parse()` que devolve
   `{ entries, skipped }` na forma do esquema acima.
2. **Registro** do id da competição em `COMPETITIONS` (`data/tools/lib/schema.js`) e do
   parser em `PARSERS` (`data/tools/fetch.js`), mais o `ext()` do mesmo arquivo se a
   fonte não for HTML.
3. **Níveis**: acrescente a fonte à tabela `ALIASES` de `data/tools/lib/levels.js`; se a
   competição trouxer níveis novos, acrescente-os a `LEVELS` com `disc`, `scored` e
   `places`.
4. **Índice de edições** em `data/editions/<competição>.json`, à mão ou a partir de um
   crawler novo em `crawl-editions.js`.
5. **Rótulos** em `awards-loader.js`: `COMP_LABEL_PT` para a competição e
   `LEVEL_LABEL_PT` para cada nível novo, e a regra de seção em `placeBrand()`. Em
   `gerar.js`, o rótulo tem de virar chave em `compKey()` e entrar em `COMP_LABEL` e
   `COMP_ORDER`, com o peso da competição no `CW`. E o mesmo rótulo entra no `COMP` de
   `data/tools/reconcile.js` e de `data/tools/export-audit.js`, senão a auditoria e a
   reconciliação ignoram a competição nova.
6. **Fixture e teste** em `tests/fixtures/` e `tests/parsers-<nome>.test.js`: uma página
   real, aparada, com as contagens esperadas de entradas e de quarentena e três a cinco
   linhas conhecidas.
