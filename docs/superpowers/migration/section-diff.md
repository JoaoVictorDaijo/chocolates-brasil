# Mudanças de seção na migração para os dados canônicos

Colocação anterior: `tests/golden/sections-before.json`, a conferência manual de
2026-09-04 (tier 1 → S1N1, tier 2 → S1N2, array AoC → S2, array AVPA → S3,
tier 3 e NAC_NEW → S4). Colocação nova: `placeBrand()` sobre as linhas canônicas
de `data/awards/` — prêmios nacionais não têm `level` e por isso nunca promovem.

Saída de `node gerar.js`:

```
Section moves vs 2026-09-04: 15
  Baianí Chocolates: S1N2 → S1N1
  Mission Chocolate: S1N2 → S1N1
  Mestiço Chocolates: S1N2 → S1N1
  Nugali Chocolates: S1N2 → S1N1
  Chocolat du Jour: S1N2 → S1N1
  Priscyla França Chocolates: S4 → S1N2
  Mendoá Chocolate: S2 → S1N2
  La Lis Chocolates: S2 → S1N2
  Pé de Chocolate: S2 → S1N2
  Cacau Dourado Chocolates: S2 → S1N2
  Martinus Chocolates: S2 → S1N2
  Nicolas Chocolate do Belga: S2 → S1N2
  Casa Lasevicius: S2 → S1N2
  Chokolah: S4 → S1N2
  Gallette Chocolates: S4 → S1N2
```

As dez mudanças previstas na especificação (§10 passo 4) saíram todas: Mendoá,
La Lis, Pé de Chocolate, Cacau Dourado, Nicolas Chocolate do Belga, Martinus e
Casa Lasevicius (S2 → S1N2); Gallette, Chokolah e Priscyla França (S4 → S1N2).

## As cinco mudanças não previstas

Todas são S1N2 → S1N1: a ficha escrita à mão não listava a medalha de final
mundial que o conjunto canônico traz. A promoção vem de linhas `ICA Mundial`
com medalha (não finalista), o que é exatamente o critério de `placeBrand`.

- **Baianí Chocolates** — ICA Mundial 2024, Prata, *White Chocolate – Brazilian Spices* (a ficha registrava a mesma barra só na etapa das Américas).
- **Mission Chocolate** — ICA Mundial 2018 Ouro (*Brazil Biomes: Cupuaçu 72%*), 2018 Prata, 2019 Prata e 2020/21 Ouro (*Three Theos*).
- **Mestiço Chocolates** — ICA Mundial 2023, Prata (*Hidromel 77%*) e Bronze (*Crema 45% ao leite*).
- **Nugali Chocolates** — ICA Mundial 2016, 2017, 2018 e 2022, quatro Bronzes.
- **Chocolat du Jour** — ICA Mundial 2016 Prata (*Almond Chocolate*), 2016 Bronze (*Macadamia Chocolate*) e 2022 Bronze (*Caramel Scotch Bonbon*).

A distribuição resultante — S1N1 12 · S1N2 25 · S2 21 · S3 3 · S4 11 — é a mesma
medida sobre os dados reais nas tarefas 12 e 13.
