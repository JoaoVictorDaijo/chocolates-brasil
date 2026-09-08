# 📋 Backlog — Chocolates Brasileiros Premiados

Tarefas pendentes e ideias. Atualizar conforme avança.

---

## 🔄 Rotina por edição nova

`npm run fetch -- <competição> <slug>` → `npm run check` → `npm run build && npm test`
→ commit. Detalhes e fallbacks manuais em [`data/README.md`](data/README.md).

---

## 🔜 Próximos passos

### 1. Interface — trazer informações-chave para o topo
O site ficou longo e o que está no rodapé se perde (legenda das medalhas, "como foi
feito", créditos). Trazer para perto do topo o essencial — em especial a **legenda** e
o card **"Como o índice de prestígio é calculado"** (que já agrada). A definir na
conversa de design: o que sobe, para onde, e o que pode virar algo recolhível.

### 2. Interface — legenda do ✓ e de "Finalista"
A ficha imprime dois sinais que a página não explica: o **✓** antes do nome da
competição, que marca a linha lida na lista oficial do concurso, e o nível
**"Finalista"**, que aparece na medalheira mas não é medalha — não pontua no índice e
não coloca a marca numa seção. Acrescentar as duas entradas à legenda (ou ao glossário
do rodapé), junto com as das medalhas.

### 3. Interface — colapsar os cards de forma elegante (desktop + mobile)
Reduzir o comprimento da página deixando cada ficha de marca recolhível/condensada,
com solução boa tanto no desktop quanto no mobile. A discutir: estado padrão
(aberto/fechado), o que fica visível no card fechado, expandir-um vs expandir-todos.

### 4. Post no Reddit
- **Hospedagem:** já no ar em https://chocolates-brasil.pages.dev/
- **Tabela markdown** do top 15-20 (rank · marca · cidade · nº de medalhas · pontos).
- **Título + TL;DR** em PT e em inglês.
- **Subreddits:** r/chocolate (inglês, principal) · r/brasil e r/saopaulo (PT) ·
  r/InternetIsBeautiful (versão interativa).
- **Enquadramento:** gratuito, sem fins lucrativos, metodologia aberta, créditos à
  Chocólatras Online / Zélia Frangioni.
- (Opcional) imagem-resumo do top 10 como thumbnail do post.

---

## 🍫 Marcas e curadoria
- **Fichas novas escritas por pesquisa na web (Google AI Mode, sem fonte primária):**
  Melangeria Dimaggio, Adoleta, Bacio di Latte, Brüksel, Carolate, Nuscaa Chocolate,
  Vila Chocolat e Kakaw Spices (hoje Legria). Conferir cidade, ano de fundação, canais e
  situação atual (Adoleta e Brüksel podem estar inativas) antes de dar os dados como certos. Issue: #2.
- **Confirmar a origem da Billy&Bugga Handcrafted Chocolates** — coleção "Brasil em
  Aquarelas" com menção na AoC 2020 (Brand Experience); nenhuma pesquisa localizou a marca. Issue: #3.
- **Confirmar a origem da Echocolate** — o Google AI Mode aponta Shenzhen, China (sem
  fonte primária); segue excluída, e os três bronzes da AoC 2024–2025 saíram da ficha da Odle. Issue: #3.
- **Logos faltantes:** JUCOLATTE, Nicolas Chocolate do Belga, DoSemente Cacau, Velmont,
  Corumbau Cacau, Selah, Melangeria Dimaggio, Adoleta, Bacio di Latte, Brüksel, Carolate,
  Nuscaa Chocolate, Vila Chocolat e Kakaw Spices ainda em monograma.

## 🗃️ Dados canônicos — linhas ainda não recuperadas
- **AVPA 2024, linha 63** (Aprochok, Médaille Gourmet) — perdida pelo extrator de tabela
  do PDF (`page-rows-incomplete`). Acrescentar à mão se o extrator melhorar.
- **ICA Mundial 2017** — 11 reconhecimentos Triple M.M.M em quarentena `unparsed-body`:
  a página não imprime o país, e o `ica-strong` não tem fallback sem país.
- **ICA Mundial 2019** — 26 prêmios de degustadores em quarentena `unjoined-block-row`.
- **AoC 2022 2ª fase** — 2 troféus do bloco BRAND EXPERIENCE, sem categoria e sem
  produto, em quarentena `blank-product`.
- **Reconhecimento sem produto não tem como ser guardado**: o esquema exige `product`.
  Rever se aparecer uma competição que premia só o fabricante.

## ⚙️ Infraestrutura e decisões pendentes
- **Competições nacionais como fonte canônica** — `SHOW_NACIONAL` está desligada por
  padrão porque as 98 linhas nacionais curadas (Bean to Bar Brasil 2017–2026, CNA 2019 e
  2021, Cacau Fest 2025, Chocolat Festival) não têm fonte oficial conferida pelas
  ferramentas. Próximo passo: definir quais concursos publicam resultados completos por
  edição (o Bean to Bar Brasil publica 2025 e 2026; 2017–2022 a confirmar), indexá-los em
  `data/editions/`, escrever o parser e reconciliar as linhas curadas como se fez com as
  internacionais — só então religar a flag. Issue: #1.
- **`source.fetched` guarda a data do parse, não a do download** — é ela que vira a data
  de atualização do site. Rever se um dia importar a diferença.
- **Barra-assinatura** — `signatureOf` resolve empate de manchete pela ordem dos
  arquivos (os dois ouros da Odle no ICA Américas 2023). E a lista de anos da manchete é
  por competição (`a.c === star.c`), então a linha do mesmo produto em outra competição
  fica de fora: o Cacau Fest Brasil 2025 da Selah não entra na manchete do Diploma
  Gourmet da AVPA 2026, e o Bean to Bar Brasil 2024 da Priscyla França não entra na
  manchete do CNA Brasil Artesanal 2021.
- **`tests/golden/sections-before.json`** pode ser apagado quando as 15 mudanças de seção
  aceitas não valerem mais a impressão a cada build.

---

## 💡 Melhorias possíveis (nice-to-have)
- **PDF compacto** (~30 págs): só a medalheira por card, sem as listas detalhadas.

---

## ✅ Concluído
- Documento HTML autocontido — 72 marcas, 5 competições
- **Conjunto canônico de prêmios** em `data/`: 51 edições buscadas das páginas oficiais
  do ICA, da Academy of Chocolate e da AVPA, com snapshot, esquema e testes
- Logo da MOA corrigida
- **Favicon** (tablete de chocolate com ranhuras 3×3 + estrela de ouro, cantos
  arredondados) embutido — SVG + apple-touch-icon. Alternativa com mordida na
  diagonal (variação C1) guardada em `docs/design/favicon-c1-mordida.svg`.
- **Preview de link (Open Graph)** com imagem 1200×630 — funciona no WhatsApp, Telegram etc.
- Projeto no **Git** + repositório **público no GitHub** (JoaoVictorDaijo/chocolates-brasil)
- **Cloudflare Pages** com deploy automático a cada push na `main`
- Sessão do Claude Code migrada para a pasta do projeto
