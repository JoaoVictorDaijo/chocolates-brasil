# 📋 Backlog — Chocolates Brasileiros Premiados

Tarefas pendentes e ideias. Atualizar conforme avança.

---

## 🔜 Próximos passos

### 1. Ícone da página (favicon)
Desenhar um favicon coerente com a identidade visual (verde cabruca + serif Fraunces).

- **Ideias de conceito:** barra de chocolate estilizada · fruto/amêndoa de cacau · a
  estrela ★ da "barra-assinatura" · monograma "CB".
- **Formatos a gerar:** SVG (nítido em qualquer tela), PNG 32×32 (aba do navegador) e
  180×180 (`apple-touch-icon`, atalho no celular).
- **Onde plugar:** no `gerar.js`, dentro do `<head>` da função `shell()`, adicionar a
  tag `<link rel="icon" ...>`.

### 2. Adicionar o ícone na Cloudflare Pages
Depende de como o favicon for embutido (decidir na tarefa 1):

- **Recomendado — embutido como data URI** (`<link rel="icon" href="data:image/svg+xml;base64,...">`):
  mantém o `index.html` autocontido e **não exige nada a mais no Cloudflare** — o ícone
  viaja dentro do próprio arquivo. Só re-subir o `dist/index.html`.
- **Alternativa — arquivo separado** (`favicon.ico`/`.png` + `<link rel="icon" href="/favicon.ico">`):
  é preciso subir o arquivo do ícone **junto, na raiz** do upload do Cloudflare Pages
  (mesmo nível do `index.html`) e fazer re-deploy.
- ⚠️ O navegador costuma **cachear favicon** com força — se não aparecer após o deploy,
  testar em aba anônima ou dar hard-refresh.

### 3. Post no Reddit
- **Hospedar** o `dist/index.html` (Netlify Drop ou Cloudflare Pages) → obter a URL.
- **Tabela markdown** do top 15-20 (rank · marca · cidade · nº de medalhas · pontos).
- **Título + TL;DR** em PT e em inglês.
- **Subreddits:** r/chocolate (inglês, principal) · r/brasil e r/saopaulo (PT) ·
  r/InternetIsBeautiful (só com a versão interativa hospedada).
- **Enquadramento:** gratuito, sem fins lucrativos, metodologia aberta, créditos à
  Chocólatras Online / Zélia Frangioni — para evitar a reação anti-autopromoção.
- (Opcional) imagem-resumo do top 10 como thumbnail do post.

---

## 💡 Melhorias possíveis (nice-to-have)
- **PDF compacto** (~30 págs): só a medalheira por card, sem as listas detalhadas de
  prêmios — versão mais leve para compartilhar.
- **Logos faltantes:** JUCOLATTE e Nicolas Chocolate do Belga ainda usam monograma —
  trocar se achar uma fonte boa.
- **Publicar no GitHub** (`git push`) — repo local já está pronto.

---

## ✅ Concluído
- Documento HTML autocontido — 68 marcas, 401 prêmios, 5 competições
- Versão em PDF (72 páginas)
- Logo da MOA corrigida
- Projeto inicializado no Git (commit inicial na branch `main`)
- Sessão do Claude Code migrada para a pasta do projeto
