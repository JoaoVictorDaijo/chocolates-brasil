# Especificações de design

As especificações registram decisões de design e suas alternativas como histórico;
o código é a fonte de verdade e a documentação corrente descreve o comportamento
atual.

Salve as specs em `docs/specs/YYYY-MM-DD-<area>-<topic>.md`, em kebab-case minúsculo.
A data é a de aprovação do design; para uma spec antiga sem data, use a data em que
o Git a adicionou pela primeira vez. A área identifica o módulo ou domínio alterado.

Todo arquivo de spec começa com front matter YAML com estes campos:

```yaml
---
title: Título da decisão
status: proposed
date: 2026-09-04
areas: [data, site]
prs: []
issues: []
superseded_by: null
summary: Uma frase sobre a decisão, no idioma da spec.
---
```

Os status são `proposed`, `implemented`, `partial`, `superseded` e `abandoned`.
`prs` e `issues` contêm números; `superseded_by` contém o nome da spec posterior ou
o número da PR que a substituiu, ou `null`.

Inclua a spec como `proposed` na PR que a implementa e, nessa PR, atualize o status
para `implemented` e preencha `prs` assim que o número existir. Se uma mudança
posterior substituir o design, altere apenas os metadados para `superseded` e
preencha `superseded_by`. Preserve o corpo histórico, sem reescrevê-lo para refletir
o código posterior. A documentação corrente pode apontar para a spec por trás de
uma decisão.

O front matter é o índice. Para pesquisar:

```sh
grep -l '^status: implemented' docs/specs/*.md
grep -l 'areas:.*data' docs/specs/*.md
grep -H '^summary:' docs/specs/*.md
```

Specs são versionadas em `docs/specs/` com front matter. Planos, registros de revisão,
ledgers de IAR, handoffs e notas de sessão ficam sem rastreamento em
`.code/docs/<task>/` na raiz do repositório principal.
