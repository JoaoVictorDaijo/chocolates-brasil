# 📋 Backlog — Chocolates Brasileiros Premiados

Inventário corrente de ideias e pendências sem outro tracker. Itens com issue são
acompanhados no GitHub.

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
- [Conferir os dados das fichas pesquisadas sem fonte primária — issue #2](https://github.com/JoaoVictorDaijo/chocolates-brasil/issues/2).
- [Confirmar a origem de Billy&Bugga e Echocolate — issue #3](https://github.com/JoaoVictorDaijo/chocolates-brasil/issues/3).
- **Logos faltantes:** JUCOLATTE, Nicolas Chocolate do Belga, DoSemente Cacau, Velmont,
  Corumbau Cacau, Selah, Melangeria Dimaggio, Adoleta, Bacio di Latte, Brüksel, Carolate,
  Nuscaa Chocolate, Vila Chocolat e Kakaw Spices ainda em monograma.

## ⚙️ Infraestrutura e dados
- [Competições nacionais como fonte canônica — issue #1](https://github.com/JoaoVictorDaijo/chocolates-brasil/issues/1).
- Limitações de cobertura e linhas em quarentena: [`data/README.md`](data/README.md#limitações-de-cobertura).
- Limitação da manchete da barra assinatura: [`README.md`](README.md#como-funciona-o-ranking).
- Avaliar a retirada da comparação com `tests/golden/sections-before.json`, que
  imprime as mudanças de seção a cada build.

---

## 💡 Melhorias possíveis (nice-to-have)
- **PDF compacto** (~30 págs): só a medalheira por card, sem as listas detalhadas.
