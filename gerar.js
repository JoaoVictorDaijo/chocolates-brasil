// Gera um HTML autocontido (logos embutidos em base64) — em pt-BR.
const fs = require('fs');
const path = require('path');

const LOGO_DIR = path.join(__dirname, 'logos');
const DARK_BG = new Set(JSON.parse(fs.readFileSync(path.join(LOGO_DIR, 'bg-manifest.json'), 'utf8')));

function dataUri(file) {
  if (!file) return null;
  const p = path.join(LOGO_DIR, file);
  if (!fs.existsSync(p)) return null;
  const buf = fs.readFileSync(p);
  if (buf.length < 200) return null; // arquivo inválido/placeholder
  let mime = 'image/png';
  if (buf[0] === 0xff && buf[1] === 0xd8) mime = 'image/jpeg';
  else if (buf[0] === 0x89 && buf[1] === 0x50) mime = 'image/png';
  else {
    const head = buf.slice(0, 400).toString('utf8').toLowerCase();
    if (head.includes('<svg') || head.includes('<?xml')) mime = 'image/svg+xml';
    else if (head.startsWith('riff') || head.includes('webp')) mime = 'image/webp';
  }
  return `data:${mime};base64,${buf.toString('base64')}`;
}

function medalClass(level) {
  const l = (level || '').toLowerCase();
  if (l.includes('ouro') || l.includes('gold') || l.includes('1º') || l.includes('oro')) return 'g';
  if (l.includes('prata') || l.includes('silver')) return 's';
  if (l.includes('bronze')) return 'b';
  return 'o';
}

// ---------------- DADOS ----------------
const BR = [
  // ===== TIER 1 — ICA World Final =====
  { tier: 1, logo: '01_miroh.bin', name: 'Miroh! Chocolate Makers', year: '2021', loc: 'Gramado, RS', site: 'https://www.mirohchocolate.com.br',
    pos: 'Bean-to-bar premium do chef chocolatier Ricardo Campos, com ateliê em frente ao Lago Negro, em Gramado. Aposta em chocolates ao leite autorais e infusões. Artesanal, em micro-lotes.',
    lines: 'Linha ao leite com infusões e drágeas de café.',
    highlight: "“Café Blum's” — medalhou no Mundial do ICA em 2023 e 2025, além de Ouro regional em 2025.",
    src: 'oficial',
    awards: [
      { c: 'ICA Mundial', y: '2025', l: 'Prata', p: "Chocolate ao Leite com Café Blum's", star: true },
      { c: 'ICA Mundial', y: '2025', l: 'Prata', p: '42% Leite com Banana e Castanha de Caju' },
      { c: 'ICA Américas', y: '2025', l: 'Ouro', p: "Chocolate ao Leite com Café Blum's", star: true },
      { c: 'ICA Mundial', y: '2023', l: 'Bronze', p: "Chocolate ao Leite com Café Blum's", star: true },
      { c: 'ICA Mundial', y: '2023', l: 'Bronze', p: 'Drágea de Café' },
    ] },
  { tier: 1, logo: '02_moa.bin', name: 'MOA Chocolates', year: '2020', loc: 'Fortaleza, CE', site: 'https://www.moachocolates.com.br',
    pos: 'Primeiro bean-to-bar do Ceará, da arquiteta-chocolatier Giovanna Mondardo. Foco em cacau de origem amazônica e combinações com frutas brasileiras. Artesanal, premium.',
    lines: 'Barras de origem amazônica; destaque para o “70% Com Cupuaçu”.',
    highlight: '“70% Com Cupuaçu” — a mesma barra levou Prata no Mundial e Ouro duplo regional em 2023.',
    src: 'oficial',
    awards: [
      { c: 'ICA Mundial', y: '2023', l: 'Prata', p: '70% Com Cupuaçu', star: true },
      { c: 'ICA Américas', y: '2023', l: 'Ouro', p: '70% Com Cupuaçu', star: true },
    ] },
  { tier: 1, logo: '03_luzz.bin', name: 'Luzz Cacau', year: '2020', loc: 'Iguaí, BA', site: 'https://luzzcacau.com.br',
    pos: 'Tree-to-bar familiar de Josiane Luz Santana, erguido sobre a lavoura de cacau da própria família, no centro-sul da Bahia. Do grão à barra, artesanal.',
    lines: 'Barras ao leite de origem e brancos com inclusões (doce de leite, coco).',
    src: 'oficial',
    awards: [
      { c: 'ICA Mundial', y: '2023', l: 'Prata', p: '52% Ao Leite' },
      { c: 'ICA Mundial', y: '2023', l: 'Bronze', p: 'Doce de Leite com Coco' },
    ] },
  { tier: 1, logo: '04_cacaudoceu.bin', name: 'Cacau do Céu', year: '2011', loc: 'Ilhéus, BA', site: 'https://cacaudoceu.com.br',
    pos: 'Bean-to-bar de Marcela Tavares, no coração da região cacaueira de Ilhéus. Combinações ousadas com ingredientes brasileiros (queijo canastra, maracujá). Artesanal.',
    lines: 'Barras autorais com inclusões regionais.',
    src: 'oficial',
    nota: 'O nível da medalha do “Branco Maracujá” (Prata/Bronze) varia entre a imprensa e a classificação por categoria do ICA.',
    awards: [
      { c: 'ICA Mundial', y: '2025', l: 'Bronze', p: '40% com Queijo Canastra e Doce de Leite' },
      { c: 'ICA Mundial', y: '2025', l: 'Prata', p: 'Chocolate Branco Maracujá' },
    ] },
  { tier: 1, logo: '05_jucolatte.bin', name: 'JUCOLATTE', year: '2023', loc: 'Cajamar, SP', site: 'https://www.instagram.com/jucolatte',
    pos: 'Bean-to-bar jovem da chocolate maker Juliana, com fábrica em Cajamar (SP). Brancos e doces de leite autorais. Novato premiado, artesanal.',
    lines: 'Brancos bean-to-bar; “33% Doce de Leite”.',
    src: 'oficial',
    awards: [
      { c: 'ICA Mundial', y: '2025', l: 'Prata', p: '33% Doce de Leite Bean to Bar' },
    ] },
  { tier: 1, logo: '06_luisaabram.bin', name: 'Luisa Abram', year: '~2014', loc: 'São Paulo, SP', site: 'https://luisaabram.com',
    pos: 'Referência internacional em cacau selvagem da Amazônia, colhido por comunidades ribeirinhas. Barras puras (só cacau e açúcar), premium e de origem única.',
    lines: 'Barras de cacau selvagem amazônico (Rio Juruá, Rio Acará).',
    src: 'oficial',
    nota: 'A marca cita ainda honrarias da Academy of Chocolate e do Prêmio Bean to Bar Brasil, aqui omitidas por falta de fonte primária.',
    awards: [
      { c: 'ICA Mundial', y: '2020/21', l: 'Bronze', p: 'Dark Coconut Milk' },
      { c: 'ICA Américas', y: '2020/21', l: 'Prata', p: 'Dark Chocolate with Cupuaçu' },
      { c: 'ICA Américas', y: '2020/21', l: 'Prata', p: 'Dark Milk Chocolate' },
      { c: 'ICA Américas', y: '2020/21', l: 'Prata', p: 'White Chocolate with Açaí' },
      { c: 'ICA Américas', y: '2019', l: 'Prata', p: '70% Wild Cocoa Juruá River' },
    ] },
  { tier: 1, logo: '07_negrodoce.bin', name: 'Negro Doce', year: '~2017', loc: 'Caxias do Sul, RS', site: 'https://www.negrodoce.com',
    pos: 'Bean-to-bar da chocolatier Ana Rúbia Camboim Ruzzarin, na serra gaúcha. Foco em barras ao leite com inclusões crocantes. Artesanal.',
    lines: 'Barras ao leite com crocância — “Crocante de café”.',
    src: 'oficial',
    awards: [
      { c: 'ICA Mundial', y: '2023', l: 'Bronze', p: 'Negro Doce Crocante de Café' },
    ] },

  // ===== TIER 2 — ICA Regional / Academy of Chocolate =====
  { tier: 2, logo: '08_baiani.bin', name: 'Baianí Chocolates', year: '2015', loc: 'São Paulo, SP', site: 'https://baiani.com.br',
    pos: 'Tree-to-bar de Juliana e Tuta Aquino, com cacau da fazenda da família (Vale do Potumuju, sul da Bahia). Uma das marcas brasileiras mais reconhecidas no exterior. Premium.',
    lines: 'Barras de origem única e brancos com especiarias brasileiras.',
    src: 'oficial',
    awards: [
      { c: 'ICA Américas', y: '2024', l: 'Ouro', p: 'White Chocolate – Brazilian Spices' },
      { c: 'ICA Américas', y: '2020/21', l: 'Prata', p: '70% Dark com Café Latitude 13' },
      { c: 'Academy of Chocolate', y: '2020', l: 'Ouro', p: 'Dark Milk 57%' },
      { c: 'Academy of Chocolate', y: '2018', l: 'Prata', p: 'Bold Dark 70%' },
    ] },
  { tier: 2, logo: '09_odle.bin', name: 'Odle Chocolates', year: '2016', loc: 'Sete Lagoas, MG', site: 'https://odle.com.br',
    pos: 'Bean-to-bar da família Odlevak. Brancos e ao leite criativos, com frutas e cachaça. Artesanal.',
    lines: 'Brancos com frutas — “Branco com Maracujá”, “Pirapop”.',
    src: 'oficial',
    awards: [
      { c: 'ICA Américas', y: '2023', l: 'Ouro', p: 'Branco com Maracujá' },
      { c: 'ICA Américas', y: '2023', l: 'Ouro', p: 'Pirapop ao Leite' },
      { c: 'ICA Américas', y: '2023', l: 'Prata', p: 'Doce de Leite Branco' },
      { c: 'ICA Américas', y: '2023', l: 'Prata', p: '60% com Cachaça' },
      { c: 'ICA Américas', y: '2023', l: 'Prata', p: 'Branco Abacaxi com Coco' },
    ] },
  { tier: 2, logo: '10_almadore.bin', name: 'Almadoré Chocolate de Origem', year: '2019', loc: 'Niterói, RJ', site: 'https://almadore.com.br',
    pos: 'Micro bean-to-bar de Ana Pott, com cacau de fazendas cabruca de Ilhéus. Foco em micro-lotes de origem. Artesanal, premium.',
    lines: 'Micro-lotes de origem — “Chocolate ao Leite 50%”.',
    src: 'oficial',
    awards: [
      { c: 'ICA Américas', y: '2024', l: 'Ouro', p: 'Chocolate ao Leite 50% (melhor da categoria)' },
    ] },
  { tier: 2, logo: '11_mission.bin', name: 'Mission Chocolate', year: '2013', loc: 'São Paulo, SP', site: 'https://www.missionchocolate.com.br',
    pos: 'Bean-to-bar de Arcelia Gallardo, no Brooklin. Uma das mais premiadas do país no circuito regional, com releituras de doces brasileiros. Artesanal.',
    lines: 'Barras inspiradas em doces brasileiros (rapadura, rabanada, paçoca).',
    src: 'oficial',
    awards: [
      { c: 'ICA Américas', y: '2024', l: 'Prata', p: 'Two Rivers' },
      { c: 'ICA Américas', y: '2024', l: 'Prata', p: 'Brazilian Cheese' },
      { c: 'ICA Américas', y: '2024', l: 'Bronze', p: 'Wild Brasil' },
      { c: 'ICA Américas', y: '2023', l: 'Prata', p: 'Rapadura' },
      { c: 'ICA Américas', y: '2023', l: 'Prata', p: 'Rabanada' },
      { c: 'ICA Américas', y: '2023', l: 'Prata', p: 'Baru 70%' },
      { c: 'ICA Américas', y: '2023', l: 'Prata', p: 'Arroz Doce' },
      { c: 'ICA Américas', y: '2023', l: 'Bronze', p: 'Paçoca' },
    ] },
  { tier: 2, logo: '12_kae.bin', name: 'Kaê Chocolates', year: '~2017', loc: 'Varginha, MG', site: 'https://www.kaechocolates.com.br',
    pos: 'Bean-to-bar de Jorge Klotz, com cacau do sul da Bahia. Barras de origem e inclusões regionais. Artesanal.',
    lines: '“Intenso 71%” e inclusões — cumaru, milho.',
    src: 'oficial',
    awards: [
      { c: 'ICA Américas', y: '2024', l: 'Prata', p: 'Intenso 71%' },
      { c: 'ICA Américas', y: '2024', l: 'Prata', p: 'Cumaru — Ao Leite 55% com Cumaru' },
      { c: 'ICA Américas', y: '2024', l: 'Prata', p: 'Caipira — Branco com Milho' },
      { c: 'ICA Américas', y: '2024', l: 'Bronze', p: 'Cupuaçu — 64% com Cupuaçu' },
    ] },
  { tier: 2, logo: '13_mestico.bin', name: 'Mestiço Chocolates', year: '2015', loc: 'São Paulo, SP', site: 'https://mesticochocolates.com',
    pos: 'Tree-to-bar de Rogério e Cláudia Kamei, com cacau da Fazenda Bonança (Itacaré). Barras fermentadas e autorais. Artesanal, premium.',
    lines: 'Barras fermentadas — “Hidromel 77%”.',
    src: 'oficial',
    awards: [
      { c: 'ICA Américas', y: '2023', l: 'Prata', p: 'Hidromel 77% (+ prêmio especial de fermentação)' },
      { c: 'ICA Américas', y: '2023', l: 'Prata', p: 'Crema 45% ao Leite' },
      { c: 'ICA Américas', y: '2023', l: 'Bronze', p: 'Framboesa e Limão' },
    ] },
  { tier: 2, logo: '14_juarleo.bin', name: 'Ju Arléo Chocolates', year: 'n/d', loc: 'Uruçuca, BA', site: 'https://juarleochocolates.com.br',
    pos: 'Tree-to-bar familiar do sul da Bahia, de produção feminina e cacau cabruca de origem única (IG Sul da Bahia). Equilibra barras premiadas e linhas acessíveis do dia a dia.',
    lines: '“Doce de Leite Crocante”, “36% ao Leite com Cupuaçu”, “70% Intenso”; linha “Zero” (sem açúcar/lactose).',
    highlight: '“Doce de Leite Crocante” — Prata no ICA Américas 2025 e Bronze na Academy of Chocolate 2024.',
    src: 'oficial',
    nota: 'Prata de 2023 confirmada na página oficial do ICA; medalhas de 2025 reportadas pela imprensa baiana.',
    awards: [
      { c: 'ICA Américas', y: '2023', l: 'Prata', p: '36% ao Leite com Cupuaçu' },
      { c: 'ICA Américas', y: '2025', l: 'Prata', p: 'Doce de Leite Crocante', star: true },
      { c: 'ICA Américas', y: '2025', l: 'Bronze', p: '55% ao Leite com Café' },
      { c: 'Academy of Chocolate', y: '2024', l: 'Bronze', p: 'Branco com Doce de Leite Crocante', star: true },
    ] },
  { tier: 2, logo: '15_zaad.bin', name: 'ZAAD Chocolates', year: 'n/d', loc: 'Cotia, SP', site: 'https://zaadchocolates.com.br',
    pos: 'Bean-to-bar em micro-lotes, de Marcia e Diego. Foco em cacau brasileiro de origem (Pará, Rondônia, Bahia, ES) e inclusões amazônicas. Artesanal, premium.',
    lines: 'Barras de terroir com inclusões — “55% com Banana Passa, Amêndoas e Cumaru”.',
    src: 'oficial',
    awards: [
      { c: 'ICA Américas', y: '2024', l: 'Prata', p: '55% com Banana Passa, Amêndoas e Cumaru' },
      { c: 'ICA Américas', y: '2024', l: 'Bronze', p: '70% Intenso com Cupuaçu' },
    ] },
  { tier: 2, logo: '16_calma.bin', name: "C'alma Chocolate", year: 'n/d', loc: 'Goiânia, GO', site: 'https://www.calmachocolate.com.br',
    pos: 'Bean-to-bar artesanal de Ariana Ribeiro. Foco em cacau fino de safra/origem única e inclusões regionais. Premium.',
    lines: 'Barras de origem única e inclusões — “Ao Leite 55%”, “Pastelinho de Goiás”.',
    src: 'oficial',
    awards: [
      { c: 'ICA Américas', y: '2024', l: 'Prata', p: 'Ao Leite 55%' },
      { c: 'Academy of Chocolate', y: '2022', l: 'Bronze', p: 'Barra de origem única' },
      { c: 'Bean to Bar Brasil', y: '—', l: 'Pódio', p: 'Barra C’alma' },
    ] },
  { tier: 2, logo: '17_benevides.bin', name: 'Benevides Chocolates', year: '~2018', loc: 'Itabuna, BA', site: 'https://benevideschocolates.com.br',
    pos: 'Bean-to-bar (chocolates finos, do grão à barra) de Leilane Benevides, no sul da Bahia. Cacau cabruca de origem, ampla gama de intensidades. Artesanal.',
    lines: 'Mais de 20 receitas — “Canjica Baiana” (branco com milho), “43% com rapadura”.',
    src: 'oficial',
    nota: 'A marca e a imprensa registram a “Canjica Baiana” como Prata; a página oficial do ICA a lista como Bronze.',
    awards: [
      { c: 'ICA Américas', y: '2023', l: 'Prata', p: 'Branco com Canjica Baiana' },
      { c: 'ICA Américas', y: '2023', l: 'Bronze', p: '43% Cacau ao Leite' },
      { c: 'ICA Américas', y: '2023', l: 'Bronze', p: '55% Cacau com Cupuaçu' },
    ] },
  { tier: 2, logo: '18_amma.bin', name: 'AMMA Chocolate', year: '~2007', loc: 'Salvador, BA', site: 'https://ammachocolate.com.br',
    pos: 'Pioneira tree-to-bar orgânica de Diego Badaró, no sul da Bahia. Certificada B Corp, vegana e kosher. Barras intensas de alta porcentagem. Premium.',
    lines: 'Barras orgânicas de alta porcentagem — “75%”, “100%”.',
    src: 'oficial',
    awards: [
      { c: 'Academy of Chocolate', y: '2017', l: 'Prata', p: 'AMMA 100% (Tree to Bar)' },
      { c: 'Academy of Chocolate', y: '2017', l: 'Bronze', p: 'AMMA 75% (Tree to Bar)' },
      { c: 'ICA Américas', y: '2017', l: 'Prata', p: 'Cupuaçu' },
    ] },
  { tier: 2, logo: '19_nugali.bin', name: 'Nugali Chocolates', year: '2004', loc: 'Pomerode, SC', site: 'https://www.nugali.com.br',
    pos: 'Uma das pioneiras do bean-to-bar brasileiro e das mais premiadas. Produção de maior escala, com barras de origem e pralinés.',
    lines: '“Cacau em Flor”; barras de origem (Serra do Conduru 80%).',
    src: 'oficial',
    nota: 'A marca lista medalhas adicionais; aqui constam apenas as confirmadas em fonte oficial/imprensa.',
    awards: [
      { c: 'ICA Américas', y: '2019', l: 'Bronze', p: 'Cacau em Flor 70%' },
      { c: 'ICA Américas', y: '2019', l: 'Bronze', p: 'Dark Chocolate 70%' },
      { c: 'ICA Américas', y: '2025', l: 'Bronze', p: 'Drágea de Nibs ao Leite' },
      { c: 'ICA Américas', y: '2017', l: 'Finalista', p: 'Serra do Conduru 80%' },
    ] },
  { tier: 2, logo: '20_hagi.bin', name: 'Hagi Chocolates', year: '2017', loc: 'Curitiba, PR', site: 'https://hagi.com.br',
    pos: 'Torroneria e chocolateria artesanal de Adriana e Isabel Hagi. Bean-to-bar de cacau amazônico do Pará, ao lado de torrones italianos. Premium, artesanal.',
    lines: 'Coleção “Bean to Bar Amazônico” (Tomé-Açu, Acará) e torrones autorais.',
    src: 'oficial',
    awards: [
      { c: 'ICA Américas', y: '2024', l: 'Bronze', p: 'Caramelo com Banana e Castanha de Caju' },
      { c: 'Academy of Chocolate', y: '2023', l: 'Bronze', p: '70% com Manga' },
      { c: 'Academy of Chocolate', y: '2023', l: 'Bronze', p: 'Drágea Banoffee' },
    ] },
  { tier: 2, logo: '22_pretiosus.bin', name: 'Pretiosus Chocolate Artesanal', year: '~2022', loc: 'Vargem Grande Paulista, SP', site: 'https://www.pretiosus.com.br',
    pos: 'Bean-to-bar novato de Francisco Junior, com cacau de Ilhéus. Premiado já na estreia em competição. Artesanal.',
    lines: 'Brancos com frutas — “Branco de Abacaxi com Coco”.',
    src: 'oficial',
    awards: [
      { c: 'ICA Américas', y: '2024', l: 'Bronze', p: 'Branco de Abacaxi com Coco' },
    ] },
  { tier: 2, logo: '21_chocolatdujour.bin', name: 'Chocolat du Jour', year: '1987', loc: 'São Paulo, SP', site: 'https://www.chocolatdujour.com.br',
    pos: 'Casa premium histórica (família Landmann) de bombons e trufas finas. Mantém linha bean-to-bar (Pratigi) com cacau da própria fazenda na Bahia. Premium, artesanal.',
    lines: 'Bombons e trufas finas; linha “Pratigi” bean-to-bar.',
    src: 'imprensa',
    nota: 'Premiações no segmento chocolatier/trufas (não bean-to-bar), confirmadas via imprensa, e não em páginas oficiais das competições.',
    awards: [
      { c: 'ICA Américas', y: '2016', l: 'Prata', p: 'ChocoDamia (trufa de macadâmia)' },
      { c: 'ICA Américas', y: '2016', l: 'Prata', p: 'ChocoAmandes (trufa de amêndoa)' },
      { c: 'Academy of Chocolate', y: '2016', l: 'Prata', p: 'Bombom de Caramelo com Flor de Sal' },
      { c: 'Academy of Chocolate', y: '2016', l: 'Prata', p: 'Trufa de Cachaça' },
    ] },

  // ===== TIER 3 — Prêmios nacionais =====
  { tier: 3, logo: '23_priscyla.bin', name: 'Priscyla França Chocolates', year: '~2021', loc: 'São Paulo, SP', site: 'https://www.priscylafrancachocolates.com.br',
    pos: 'Bean-to-bar em micro-lotes, com cacau rastreável da Amazônia (assentamento Tuerê, PA). Sem essências nem corantes; comércio justo. Premium, artesanal.',
    lines: '“70% Cacau da Amazônia”; ao leite 48% (versões sem açúcar/lactose).',
    highlight: 'Eleita o melhor chocolate artesanal do Brasil no Prêmio CNA Brasil Artesanal 2021.',
    src: 'oficial',
    awards: [
      { c: 'CNA Brasil Artesanal', y: '2021', l: '1º lugar (Ouro)', p: '70% Cacau da Amazônia', star: true },
      { c: 'Bean to Bar Brasil', y: '2024', l: 'Bronze', p: '70% Cacau da Amazônia' },
      { c: 'Bean to Bar Brasil', y: '2022', l: 'Bronze', p: 'Ao Leite 48%' },
      { c: 'Bean to Bar Brasil', y: '2019', l: 'Bronze', p: 'Ao Leite 48% com inclusão' },
    ] },

  // --- Novos: medalhistas do ICA Américas encontrados no audit (Seção 1, Nível 2) ---
  { tier: 2, logo: '49_cuore.bin', name: 'Cuore di Cacao', year: '2004', loc: 'Curitiba, PR', site: 'https://loja.cuoredicacao.com.br', src: 'imprensa',
    pos: 'Chocolateria bean-to-bar de Curitiba, das irmãs Schneider, com design forte e cacau brasileiro de origem. Premium, premiada dentro e fora do país.',
    lines: 'Barras de origem (70% Bahia, ao leite 46%), bombons (linha Gianduia) e veganos.',
    nota: 'Medalhas do ICA Américas 2023 confirmadas pela imprensa (Bom Gourmet); demais por fontes oficiais/imprensa.',
    awards: [
      { c: 'ICA Américas', y: '2023', l: 'Prata', p: 'Ao Leite 46% Cacau (89,1)', star: true },
      { c: 'ICA Américas', y: '2023', l: 'Prata', p: 'Intenso 60% com Cupuaçu (88,4)' },
      { c: 'Academy of Chocolate', y: '2025', l: 'Bronze', p: '70% com Castanha de Caju e Flor de Sal' },
      { c: 'Bean to Bar Brasil', y: '2022', l: 'Prata', p: '70% Bahia' },
    ] },
  { tier: 2, logo: '50_utopia.bin', name: 'Utopia Tropical', year: '~2022', loc: 'Curitiba, PR', site: 'https://utopiatropical.com.br', src: 'imprensa',
    pos: 'Fábrica experimental de Curitiba que trata o chocolate como arte, com cacau selvagem amazônico de origem única e colaborações com artistas. Premium, micro-lote.',
    lines: 'Barras de cacau selvagem — Intenso 72% (Rio Tocantins/PA), Branco 38% (Rio Purus/AM).',
    nota: 'Medalhas do ICA Américas 2023 confirmadas pela imprensa (Bom Gourmet).',
    awards: [
      { c: 'ICA Américas', y: '2023', l: 'Prata', p: 'Intenso 72% — Rio Tocantins (PA)' },
      { c: 'ICA Américas', y: '2023', l: 'Prata', p: 'Branco 38% Cacau Selvagem — Rio Purus (AM)' },
    ] },
  { tier: 2, logo: '69_cookoa.bin', name: 'Cookoa', year: '~2020', loc: 'Palhoça, SC', site: 'https://www.cookoa.com.br', src: 'imprensa',
    pos: 'Bean-to-bar plant-based de Palhoça (SC), pioneira no branco vegano de castanha de caju; chocolates sem leite, glúten, açúcar nem aditivos, com cacau da Amazônia e da Bahia. Premium, inclusivo.',
    lines: 'Barras bean-to-bar (Intenso 70%, 100%), branco vegano de castanha de caju, chocolate quente.',
    nota: 'Premiação registrada pelo Chocólatras Online.',
    awards: [
      { c: 'ICA Américas', y: '2020/21', l: 'Bronze', p: 'Branco Caramelo' },
    ] },
];

const INTL = [
  { logo: '27_pacari.bin', name: 'Paccari', country: 'Equador', year: '2002', site: 'https://paccari.com',
    pos: 'Bean-to-bar orgânico e biodinâmico equatoriano (Quito), comercializada como “Paccari” (antiga “Pacari”). Uma das marcas mais premiadas do mundo no ICA; primeira com certificação Demeter. Premium.',
    lines: 'Barras de origem única e infusões — “70% Raw”, “Piura-Quemazón”, “Goldenberry”.',
    avail: 'À venda no Brasil via Chocólatras Online, Ubuy Brasil e Mercado Livre.',
    src: 'oficial',
    awards: [
      { c: 'ICA Mundial', y: '2017', l: 'Vencedor', p: 'Ecuador 60% Goldenberry' },
      { c: 'ICA', y: '2013', l: 'Ouro', p: 'Piura-Quemazón' },
      { c: 'ICA', y: '2012', l: 'Ouro', p: '70% Raw Chocolate' },
      { c: 'ICA', y: '2012', l: 'Ouro', p: '60% com Capim-limão' },
    ] },
  { logo: '24_valrhona.bin', name: 'Valrhona', country: 'França', year: '1922', site: 'https://www.valrhona.com',
    pos: 'Grife francesa premium de couverture, referência mundial para chefs e confeiteiros. Origens e blends sofisticados. Alta gama, escala industrial.',
    lines: 'Grands Crus de origem — “Guanaja”, “Manjari”, “Jivara”.',
    avail: 'Loja-lounge e quiosque em São Paulo (Jardins / Iguatemi) e marketplaces.',
    src: 'oficial',
    awards: [
      { c: 'Academy of Chocolate', y: '2011', l: 'Ouro', p: 'Manjari Orange' },
      { c: 'Academy of Chocolate', y: '2011', l: 'Prata', p: 'Jivara' },
      { c: 'Academy of Chocolate', y: '2011', l: 'Bronze', p: 'Alpaco / Guanaja / Manjari' },
    ] },
  { logo: '25_amedei.bin', name: 'Amedei', country: 'Itália', year: '1990', site: 'https://amedei.it',
    pos: 'Maison toscana ultra-premium; barras de origem única lendárias (Porcelana, Chuao). Artesanal de altíssima gama.',
    lines: '“Porcelana”, “Chuao” e o blend “Nove”.',
    avail: 'Marketplaces brasileiros (Mercado Livre, Ubuy, Shopee).',
    src: 'oficial',
    awards: [
      { c: 'Academy of Chocolate', y: '2005', l: 'Ouro', p: 'Porcelana' },
      { c: 'Academy of Chocolate', y: '2006', l: 'Ouro', p: 'Porcelana' },
      { c: 'Academy of Chocolate', y: '2011', l: 'Golden Bean', p: 'Blend Nove' },
    ] },
  { logo: '26_domori.bin', name: 'Domori', country: 'Itália', year: '1997', site: 'https://domori.com',
    pos: 'Pioneira italiana em cacau Criollo raro (tree-to-bar), parte do Grupo illy. Premium, foco em origem.',
    lines: 'Linha Criollo — “80% Criollo”, single-origin (Chuao).',
    avail: 'À venda no Brasil via Chocólatras Online e Grupo illy (illy.com.br).',
    src: 'oficial',
    awards: [
      { c: 'Academy of Chocolate', y: '2016', l: 'Ouro', p: '80% Criollo' },
    ] },
  { logo: '28_republica.bin', name: 'República del Cacao', country: 'Equador', year: '2005', site: 'https://republicadelcacao.com',
    pos: 'Marca premium equatoriana de origem única, voltada à couverture profissional para chefs (B2B). Origens latino-americanas.',
    lines: 'Couverture de origem — “Ecuador 56%”, blends Equador + Peru.',
    avail: 'Importada no Brasil pela CALIMP e pela Ingredientes Online.',
    src: 'oficial',
    nota: 'Premiação de origem nacional (Equador); não localizamos medalha das grandes competições internacionais.',
    awards: [
      { c: 'Ecuador Chocolate Awards', y: '2024', l: 'Gran Oro', p: 'Barra premiada (Grand Gold)' },
    ] },
];

// ===== Brasileiras premiadas FORA do ICA — Academy of Chocolate (Londres) =====
const AOC = [
  { logo:'29_mendoa.bin', name:'Mendoá Chocolate', year:'2013', loc:'Ilhéus, BA', site:'https://www.mendoachocolates.com.br', src:'oficial',
    pos:'Tree-to-bar de origem única da Fazenda Riachuelo (cacau forastero, sistema cabruca), com rastreabilidade total da árvore à barra. Premium, artesanal.',
    lines:'Linha Orgânico (60%, 81%, 99%, 100% com nibs) e Mendoá Classic (ao leite 40%).',
    highlight:'Premiada na Academy of Chocolate em cinco edições (2018–2023) — a marca brasileira mais constante na competição.',
    nota:'Ainda três menções honrosas (Commended) na edição de 2020.',
    awards:[
      { c:'Academy of Chocolate', y:'2020', l:'Prata', p:'Orgânico 99% com Nibs' },
      { c:'Academy of Chocolate', y:'2023', l:'Bronze', p:'Orgânico 100% com Nibs' },
      { c:'Academy of Chocolate', y:'2023', l:'Bronze', p:'Orgânico 81% com Nibs' },
      { c:'Academy of Chocolate', y:'2020', l:'Bronze', p:'Orgânico 60% com Canela' },
      { c:'Academy of Chocolate', y:'2019', l:'Bronze', p:'40% ao Leite' },
      { c:'Academy of Chocolate', y:'2018', l:'Bronze', p:'Classic 60% com Gengibre' },
    ] },
  { logo:'30_kalapa.bin', name:'Kalapa Chocolate', year:'~2017', loc:'Belo Horizonte, MG', site:'https://kalapa.com.br', src:'oficial',
    pos:'Bean-to-bar vegana e sensorial, com cacau agroecológico direto de produtores baianos e inclusões nativas brasileiras (cupuaçu, buriti, cumaru). Artesanal, micro-lote.',
    lines:'“Dois Riachões 70%”, “Maresia de Limão”, “Café de Histórias”.',
    highlight:'Três medalhas de Prata na Academy of Chocolate 2024.',
    awards:[
      { c:'Academy of Chocolate', y:'2024', l:'Prata', p:'Dois Riachões 70%' },
      { c:'Academy of Chocolate', y:'2024', l:'Prata', p:'Maresia de Limão (flor de sal e limão)' },
      { c:'Academy of Chocolate', y:'2024', l:'Prata', p:'Café de Histórias (nibs de café e leite de coco)' },
    ] },
  { logo:'31_lalis.bin', name:'La Lis Chocolates', year:'~2018', loc:'Ilhéus, BA', site:'https://www.lalischocolateria.com.br', src:'oficial',
    pos:'Bean-to-bar artesanal de micro-lote, com cacau de origem do sul da Bahia e edições com inclusões regionais. Premium.',
    lines:'Barras de origem (70%, 80%, 100%) e Edição Biomas (63% com cupuaçu).',
    nota:'Medalhas de 2023 reportadas pela imprensa especializada.',
    awards:[
      { c:'Academy of Chocolate', y:'2024', l:'Prata', p:'63% com Cupuaçu (Edição Biomas)' },
      { c:'Academy of Chocolate', y:'2023', l:'Prata', p:'70% Cacau' },
      { c:'Academy of Chocolate', y:'2023', l:'Bronze', p:'45% ao Leite' },
      { c:'Academy of Chocolate', y:'2023', l:'Bronze', p:'63% com Laranja' },
    ] },
  { logo:'35_tombador.bin', name:'Tombador Cacau', year:'2021', loc:'Valença, BA', site:'https://www.instagram.com/tombadorcacau', src:'imprensa',
    pos:'Produtora familiar tree-to-bar de origem única (Fazenda Saudade), com brancos e inclusões frutadas/regionais. Artesanal, micro-lote.',
    lines:'Brancos com inclusões (maracujá; macadâmia e cumaru); barras 56,6%, 70%, 100%.',
    awards:[
      { c:'Academy of Chocolate', y:'2025', l:'Prata', p:'Branco de Macadâmia e Cumaru' },
      { c:'Academy of Chocolate', y:'2024', l:'Prata', p:'Branco com Maracujá' },
    ] },
  { logo:'32_aya.bin', name:'Aya Chocolates', year:'2022', loc:'Ibirarema, SP', site:'https://ayachocolates.com', src:'oficial',
    pos:'Bean-to-bar artesanal de micro-lotes, valorizando cacau e sabores brasileiros. Premium.',
    lines:'Ao Leite Cumaru com Flor de Sal 46%; Café com Leite 46%; Brasil Blend 75%.',
    awards:[
      { c:'Academy of Chocolate', y:'2023', l:'Prata', p:'Cumaru com Flor de Sal 46%' },
      { c:'Academy of Chocolate', y:'2023', l:'Bronze', p:'Café com Leite 46%' },
    ] },
  { logo:'48_pedechoc.bin', name:'Pé de Chocolate', year:'2022', loc:'São Paulo, SP', site:'https://pedechocolate.com', src:'oficial',
    pos:'Micromarca bean-to-bar/tree-to-bar, com cacau de origem única de Itariri (Serra do Mar/SP) e cacau amazônico; brancos autorais. Premium.',
    lines:'Dark Milk 52% Itariri; brancos autorais (camomila com caramelo; caramelo com flor de sal).',
    nota:'Três medalhas na Academy of Chocolate 2025 (a confirmar item a item na lista oficial).',
    awards:[
      { c:'Academy of Chocolate', y:'2025', l:'Prata', p:'Dark Milk 52% Itariri' },
      { c:'Academy of Chocolate', y:'2025', l:'Prata', p:'Branco Camomila com Caramelo' },
      { c:'Academy of Chocolate', y:'2025', l:'Bronze', p:'Branco Caramelo com Flor de Sal' },
    ] },
  { logo:'33_majucau.bin', name:'Majucau Chocolate Brasileiro', year:'~2018', loc:'São Paulo, SP', site:'https://www.majucau.com.br', src:'oficial',
    pos:'Bean-to-bar 100% brasileiro, de micro-lote, com pouquíssimos ingredientes (70–85%) e cacau fino nacional. Premium.',
    lines:'Barras 70–85% de cacau brasileiro; destaque “70% Cocoa” (2 ingredientes).',
    awards:[ { c:'Academy of Chocolate', y:'2022', l:'Prata', p:'70% Cocoa' } ] },
  { logo:'34_labarr.bin', name:'Labarr Chocolate de Origem', year:'2016', loc:'Brasília, DF', site:'https://www.labarrchocolate.com', src:'oficial',
    pos:'Bean-to-bar de micro-lote; chocolate de origem com cacau do sul da Bahia e inclusões do Cerrado. Premium.',
    lines:'Linha “Intenso”; destaque 70% com Baru.',
    awards:[ { c:'Academy of Chocolate', y:'2025', l:'Prata', p:'70% com Baru' } ] },
  { logo:'36_modaka.bin', name:'Modaka Cacau de Origem', year:'2012', loc:'Barro Preto, BA', site:'https://cacaumodaka.com', src:'imprensa',
    pos:'Tree-to-bar orgânica de origem única (Fazenda São José, sistema Cabruca), da família Viana Lima. Premium, micro-lote.',
    lines:'Tabletes orgânicos 70% (puro, com nibs, café, sal rosa); 40% “Nosso café cremoso”.',
    awards:[ { c:'Academy of Chocolate', y:'2024', l:'Prata', p:'40% com Café, Castanha e Canela (Nosso café cremoso)' } ] },
  { logo:'37_ramos.bin', name:'Ramos do Cacau', year:'n/d', loc:'São Paulo, SP', site:'https://www.instagram.com/ramosdocacau', src:'oficial',
    pos:'Bean-to-bar artesanal de micro-lote, com cacau da Bahia e da Amazônia e barras com inclusões. Premium.',
    lines:'Premiada “55% Dark Milk com Café”; origens 35%–80%.',
    awards:[ { c:'Academy of Chocolate', y:'2024', l:'Prata', p:'55% Dark Milk com Café' } ] },
  { logo:'38_cacaudourado.bin', name:'Cacau Dourado Chocolates', year:'2019', loc:'Belo Horizonte, MG', site:'https://www.cacaudourado.com.br', src:'oficial',
    pos:'Bean-to-bar vegana de micro-lote, fundada por três irmãs, com cacau fino de origem e poucos ingredientes. Premium.',
    lines:'Origens 70%, 70% com cupuaçu, ao leite 41%, branco caramelizado com coco.',
    awards:[
      { c:'Academy of Chocolate', y:'2025', l:'Bronze', p:'Ao Leite 41%' },
      { c:'Academy of Chocolate', y:'2025', l:'Bronze', p:'70% Cacau' },
      { c:'Academy of Chocolate', y:'2025', l:'Bronze', p:'70% com Cupuaçu' },
    ] },
  { logo:'39_var.bin', name:'Var Chocolates', year:'n/d', loc:'Ibirataia, BA', site:'https://www.instagram.com/varchocolates', src:'oficial',
    pos:'Tree-to-bar de origem única da Fazenda Lajedo do Ouro (família Magalhães), cacau fino em micro-lote. Premium.',
    lines:'Origens 35–80%; destaque 45% Cacau e inclusões (café, cupuaçu, sapucaí).',
    nota:'Medalhas de 2024 a reconfirmar na lista oficial; a de 2025 via imprensa especializada.',
    awards:[
      { c:'Academy of Chocolate', y:'2024', l:'Bronze', p:'70% com Cupuaçu' },
      { c:'Academy of Chocolate', y:'2024', l:'Bronze', p:'Ao Leite 45% com Sapucaí' },
      { c:'Academy of Chocolate', y:'2025', l:'Bronze', p:'45% ao Leite com Café' },
    ] },
  { logo:'40_bemcacao.bin', name:'Bem Cacao Chocolates', year:'~2015', loc:'Ilhéus, BA', site:'https://www.instagram.com/bemcacao', src:'oficial',
    pos:'Marca familiar bean-to-bar do sul da Bahia (cacau cabruca), com barras autorais e inclusões da sociobiodiversidade (cupuaçu, baru, pequi, baunilha). Artesanal, micro-lote.',
    lines:'Linha “Sentidos” (branco 36% com baunilha) e “Biomes Collection” (60% com cupuaçu).',
    highlight:'Premiada na Academy of Chocolate em três edições consecutivas (2023–2025).',
    awards:[
      { c:'Academy of Chocolate', y:'2023', l:'Bronze', p:'Sentidos — Branco 36% com Baunilha e Amêndoas' },
      { c:'Academy of Chocolate', y:'2024', l:'Bronze', p:'52% ao Leite com Baunilha' },
      { c:'Academy of Chocolate', y:'2025', l:'Bronze', p:'Biomes — 60% com Cupuaçu' },
    ] },
  { logo:'45_martinus.bin', name:'Martinus Chocolates', year:'n/d', loc:'Sul da Bahia, BA', site:'https://martinuschocolates.com.br', src:'imprensa',
    pos:'Tree-to-bar de família com três gerações de cacauicultores no sul da Bahia (cabruca), com barras de origem e variantes especiais. Premium.',
    lines:'Origens 37–100%; destaques 52% ao leite de cabra e Branco 35% com Maracujá.',
    awards:[
      { c:'Academy of Chocolate', y:'2025', l:'Bronze', p:'Branco 35% com Maracujá' },
      { c:'Academy of Chocolate', y:'2025', l:'Bronze', p:'Linha ao Leite' },
      { c:'Academy of Chocolate', y:'2024', l:'Bronze', p:'52% ao Leite de Cabra' },
    ] },
  { logo:'42_monjolo.bin', name:'Monjolo Chocolates', year:'~2019', loc:'Campinas, SP', site:'https://www.monjolochocolatebar.com.br', src:'oficial',
    pos:'Bean-to-bar de micro-lote da pesquisadora (PhD em cacau) Luana Vieira, com barras de origem única (Pará, Bahia, ES). Premium.',
    lines:'“70% Tuerê — Amazônia”; linha Origens (orgânica/sem lactose).',
    awards:[ { c:'Academy of Chocolate', y:'2024', l:'Bronze', p:'70% Cacau Tuerê — Amazônia' } ] },
  { logo:'43_docacao.bin', name:'doCacao', year:'~2018', loc:'Ilhéus, BA', site:'https://www.fazendacapelavelha.com.br', src:'oficial',
    pos:'Tree-to-bar de origem única da Fazenda Capela Velha (Estrada do Chocolate), do cacau da fazenda à barra. Artesanal, micro-lote.',
    lines:'Linha “Chocolate Intenso”; destaque 70% Cacau.',
    awards:[ { c:'Academy of Chocolate', y:'2025', l:'Bronze', p:'Chocolate Intenso 70% Cacau' } ] },
  { logo:'44_pepe.bin', name:'Pepe Chocolates', year:'~2019', loc:'Santa Teresa, ES', site:'https://pepechocolates.com.br', src:'oficial',
    pos:'Bean-to-bar/tree-to-bar de Pedro Dalcolmo, com cacau de origem única do Espírito Santo; a primeira fábrica de chocolate de Santa Teresa. Artesanal, micro-lote.',
    lines:'Brancos e barras de cacau capixaba — “35% Branco com muito Leite”, “44% ao Leite”.',
    awards:[ { c:'Academy of Chocolate', y:'2025', l:'Bronze', p:'35% Branco com muito Leite' } ] },
  { logo:'41_nicolas.bin', name:'Nicolas Chocolate do Belga', year:'~2020', loc:'Rio de Janeiro, RJ', site:'https://www.instagram.com/nicolaschocolatbeantobar', src:'oficial',
    pos:'Bean-to-bar de micro-lote do belga Nicolas Danaux, com cacau brasileiro de origem única (Tuerê, Pará). Premium, voltado também ao mercado europeu.',
    lines:'“72% Terruá Tuerê João Evangelista” (origem única, Pará).',
    awards:[ { c:'Academy of Chocolate', y:'2022', l:'Bronze', p:'72% Terruá Tuerê João Evangelista' } ] },

  // --- Novos: medalhistas da Academy of Chocolate encontrados no audit ---
  { logo:'51_raros.bin', name:'Raros Fazedores de Chocolate', year:'2015', loc:'Cunha, SP', site:'https://www.rarosfazedoresdechocolate.com.br', src:'oficial',
    pos:'Microfábrica bean-to-bar de Cunha (SP), dos agrônomos Cesar Frizo e Vanessa Rizzi — chocolate brasileiro puro, com mínimo de ingredientes e cacau de origem. Artesanal.',
    lines:'Barras de origem (70% Medicilândia/PA, 70% Amazônia, ao leite 53%) e branco premiado.',
    awards:[
      { c:'Academy of Chocolate', y:'2025', l:'Ouro', p:'Chocolate Branco (bean-to-bar)', star:true },
      { c:'Bean to Bar Brasil', y:'2025', l:'Bronze', p:'70% Medicilândia (PA)' },
      { c:'Bean to Bar Brasil', y:'2025', l:'Bronze', p:'53% ao Leite Medicilândia (PA)' },
    ] },
  { logo:'52_tore.bin', name:'Toré Chocolates', year:'2020', loc:'Florianópolis, SC', site:'https://torechocolates.com/', src:'imprensa',
    pos:'Bean-to-bar artesanal de Florianópolis, da chocolatier Amanda Magalhães; micro-lotes sem aditivos, com torra de cacau brasileiro. Premium.',
    lines:'Intenso 71%, Ao Leite 45%, Branco com Cumaru; barras de origem (71% Rio Tocantins/PA).',
    nota:'Medalhas confirmadas pela imprensa catarinense (ND Mais, Conecta SC).',
    awards:[
      { c:'Academy of Chocolate', y:'2023', l:'Ouro', p:'Intenso 71%', star:true },
      { c:'Academy of Chocolate', y:'2023', l:'Prata', p:'Ao Leite 45%' },
      { c:'Academy of Chocolate', y:'2024', l:'Prata', p:'Branco com Cumaru' },
      { c:'Academy of Chocolate', y:'2024', l:'Prata', p:'Caramelo com Flor de Sal' },
      { c:'Bean to Bar Brasil', y:'2025', l:'Bronze', p:'71% Rio Tocantins (PA)' },
    ] },
  { logo:'55_caza.bin', name:'Caza Chocolates', year:'n/d', loc:'São Paulo, SP', site:'https://www.cazachocolates.com.br', src:'imprensa',
    pos:'Bean-to-bar artesanal de São Paulo, com cacau brasileiro de Linhares (ES) e Porto Seguro (BA); o chocolate como expressão artística. Premium.',
    lines:'Barras bean-to-bar (premiada ao leite 53% com maracujá e coco), bombons e chá de cacau.',
    nota:'Premiação confirmada pela imprensa (Chócolatras Online).',
    awards:[ { c:'Academy of Chocolate', y:'2025', l:'Prata', p:'Ao Leite 53% com Maracujá e Coco' } ] },
  { logo:'53_lasevicius.bin', name:'Casa Lasevicius', year:'2015', loc:'São Paulo, SP', site:'https://www.casalasevicius.com.br', src:'oficial',
    pos:'Bean-to-bar de São Paulo, dos irmãos Lasevicius (descendentes de lituanos), com cacau de origem brasileira — destaque para o Vale do Ribeira (SP). Artesanal.',
    lines:'Barras de origem única (70% Pariquera-Açu/SP, 71% Camboa/BA) e branco com Jabuticaba.',
    awards:[
      { c:'Academy of Chocolate', y:'2021', l:'Bronze', p:'Jabuticaba (branco bean-to-bar)' },
      { c:'Bean to Bar Brasil', y:'2024', l:'Ouro', p:'70% Pariquera-Açu (Vale do Ribeira/SP)', star:true },
      { c:'Bean to Bar Brasil', y:'2019', l:'Bronze', p:'71% Camboa (BA)' },
      { c:'Bean to Bar Brasil', y:'2025', l:'Bronze', p:'70% Vale do Ribeira (SP)' },
    ] },
  { logo:'54_candango.bin', name:'Cacau Candango', year:'~2014', loc:'Brasília, DF', site:'https://cacaucandango.com.br', src:'oficial',
    pos:'Tree-to-bar pioneira no cultivo de cacau no Cerrado do Distrito Federal; foco em terroir brasileiro e sustentabilidade. Artesanal.',
    lines:'Barras de origem do Cerrado/DF (amargos 50–70%, 100%) e o branco premiado “Blue”.',
    awards:[ { c:'Academy of Chocolate', y:'2025', l:'Bronze', p:'Blue (chocolate branco)' } ] },
  { logo:'56_prawer.bin', name:'Prawer Chocolates', year:'1975', loc:'Gramado, RS', site:'https://www.prawer.com.br', src:'imprensa',
    pos:'Chocolateria tradicional e premium de Gramado — a primeira fábrica de chocolate artesanal do Brasil (1975). Casa de pralinés e bombons que estreou linha de barras autorais.',
    lines:'Linha Barras Artesanais (50 anos) — “Caramélisé com Pistache” (branco caramelizado); pralinés e bombons.',
    nota:'Premiação confirmada pela imprensa gaúcha; ano/produto a confirmar na lista oficial da Academy of Chocolate.',
    awards:[ { c:'Academy of Chocolate', y:'2023', l:'Bronze', p:'Caramélisé com Pistache (branco caramelizado)' } ] },

  // --- Novas (audit Chocólatras): medalhistas da Academy of Chocolate ---
  { logo:'70_ambar.bin', name:'Âmbar Chocolate', year:'2019', loc:'Belo Horizonte, MG', site:'https://ambarchocolate.com.br', src:'imprensa',
    pos:'Bean-to-bar de Belo Horizonte (de “AMêndoa à BARra”), de Helena Avelar, Renata Penido e Izabela Garcia; barras de origem que contam o terroir do cacau baiano. Artesanal.',
    lines:'Intensos e dark milk (85%, 55%) com cacau do Vale Potumuju e Fazenda Santa Rita (BA).',
    awards:[ { c:'Academy of Chocolate', y:'2022', l:'Bronze', p:'Dark Milk 55%' } ] },
  { logo:'72_cacalmenara.bin', name:'Cacalmenara Chocolates', year:'n/d', loc:'Santa Teresa, ES', site:'https://www.cacalmenara.com.br', src:'imprensa',
    pos:'Tree-to-bar capixaba (Santa Teresa/ES), 100% natural — do cultivo agroflorestal do cacau à barra. Artesanal.',
    lines:'Barras 45% ao leite, 55%, 70% sem açúcar, 75%; Chocolascas e bebidas de cacau.',
    nota:'Premiações autorreportadas pelo site oficial da marca.',
    awards:[
      { c:'Academy of Chocolate', y:'2023', l:'Bronze', p:'Ao Leite 45% Cacau' },
      { c:'Academy of Chocolate', y:'2023', l:'Bronze', p:'75% Cacau' },
      { c:'Bean to Bar Brasil', y:'2022', l:'Bronze', p:'Ao Leite 45% Cacau' },
    ] },
  { logo:'73_gaudens.bin', name:'Gaudens Chocolate', year:'2012', loc:'Belém, PA', site:'https://gaudens.com.br', src:'imprensa',
    pos:'Marca paraense (Belém) de chocolate fino com cacau amazônico. Artesanal.',
    lines:'Barras de cacau amazônico de origem.',
    awards:[ { c:'Academy of Chocolate', y:'2022', l:'Bronze', p:'Barra de cacau amazônico' } ] },
];

// ===== Brasileiras premiadas FORA do ICA — AVPA Paris =====
const AVPA = [
  { logo:'46_chor.bin', name:'ChOr — Chocolate de Origem', year:'2013', loc:'Ilhéus, BA', site:'https://mail.chorchocolate.com/', src:'oficial',
    pos:'Bean-to-bar do sul da Bahia, do casal Marco e Luana Lessa, com cacau fino de produtores de Ilhéus/Uruçuca. Premium de terroir.',
    lines:'“Bahia Terra da Felicidade” (ao leite 55%), “Oro Negro”, “Terra de Santa Cruz”.',
    highlight:'Eleito um dos 3 melhores chocolates do mundo na AVPA Paris 2021 (entre 81 marcas de 22 países).',
    awards:[
      { c:'AVPA Paris', y:'2021', l:'Gourmet Bronze', p:'Bahia Terra da Felicidade 55%', star:true },
      { c:'AVPA Paris', y:'2021', l:'Medalha Gourmet', p:'Oro Negro' },
      { c:'AVPA Paris', y:'2021', l:'Medalha Gourmet', p:'Terra de Santa Cruz' },
      { c:'AVPA Paris', y:'2022', l:'Medalha Gourmet', p:'Terra de Santa Cruz' },
    ] },
  { logo:'47_danke.bin', name:'Danke Cacau', year:'2020', loc:'Altamira, PA', site:'https://www.dankecacau.com.br', src:'oficial',
    pos:'Bean-to-bar de cacau 100% brasileiro com rastreabilidade total, fundada por Ernesto Neugebauer; fábrica no coração da Amazônia. Premium acessível (não micro-lote).',
    lines:'“70% Origem Brasil”, “85% Amazônia”, ao leite 35%, 70% com nibs crocantes.',
    awards:[
      { c:'AVPA Paris', y:'2024', l:'Medalha Gourmet', p:'Ao Leite 35%' },
      { c:'AVPA Paris', y:'2024', l:'Medalha Gourmet', p:'70% com Nibs de Cacau Crocante' },
    ] },
];

// ===== Prêmios nacionais (Bean to Bar Brasil, CNA) — encontrados no audit =====
const NAC_NEW = [
  { logo:'61_chokolah.bin', name:'Chokolah', year:'2009', loc:'Cotia, SP', site:'https://www.chokolah.com', src:'imprensa',
    pos:'Pioneira do bean-to-bar no Brasil, da Claudia Schultz; chocolate orgânico de origem com cacau da agricultura familiar do Rio Xingu (PA). Premium, sustentável.',
    lines:'Barras de origem São Félix do Xingu (PA) — Intenso 70%, Ao Leite 40%; veganas e sem açúcar.',
    nota:'Prêmios nacionais confirmados pela imprensa especializada (Chócolatras Online).',
    awards:[
      { c:'Bean to Bar Brasil', y:'2022', l:'Ouro', p:'70% São Félix do Xingu (PA)', star:true },
      { c:'Bean to Bar Brasil', y:'2025', l:'Ouro', p:'70% São Félix do Xingu (PA)', star:true },
      { c:'Bean to Bar Brasil', y:'2022', l:'Ouro', p:'70% ao Leite' },
      { c:'Bean to Bar Brasil', y:'2022', l:'Bronze', p:'40% ao Leite (São Félix do Xingu/PA)' },
      { c:'Bean to Bar Brasil', y:'2025', l:'Bronze', p:'40% ao Leite (São Félix do Xingu/PA)' },
    ] },
  { logo:'57_invento.bin', name:'Invento Chocolates', year:'2022', loc:'Florianópolis, SC', site:'https://www.inventochocolates.com.br', src:'oficial',
    pos:'Bean-to-bar de Florianópolis, nascida dentro de uma sorveteria; barras de origem única do Pará (Sítio Ascurra, Tuerê) e Bahia. Artesanal.',
    lines:'Intenso 70% (Amazônia/PA) e Ao Leite 45% (origem única).',
    awards:[
      { c:'Bean to Bar Brasil', y:'2022', l:'Ouro', p:'Intenso 70% — Sítio Ascurra, Medicilândia (PA)', star:true },
      { c:'Bean to Bar Brasil', y:'2025', l:'Ouro', p:'Ao Leite 45% — Tuerê (PA)' },
      { c:'Bean to Bar Brasil', y:'2026', l:'Ouro', p:'70% — Tuerê (PA)' },
      { c:'Bean to Bar Brasil', y:'2022', l:'Ouro', p:'Ao Leite 45% — Sítio Ascurra (PA)' },
      { c:'Bean to Bar Brasil', y:'2026', l:'Prata', p:'45% — Sítio Ascurra (PA)' },
      { c:'Bean to Bar Brasil', y:'2025', l:'Bronze', p:'Intenso 70% — Sítio Ascurra (PA)' },
    ] },
  { logo:'59_magian.bin', name:'Magian Cacao', year:'2015', loc:'Porto Alegre, RS', site:'https://www.magiancacao.com', src:'oficial',
    pos:'Bean-to-bar familiar de Porto Alegre, com barras de origem por terroir do Pará (Tuerê, Medicilândia, Uruará) e da Bahia. Premium, micro-lote.',
    lines:'Intensos 70% por terroir; Ao Leite 45%; branco 37%.',
    nota:'Ouro “Melhor do Brasil” 2020 confirmado pelo site oficial; demais via fontes oficiais/imprensa.',
    awards:[
      { c:'Bean to Bar Brasil', y:'2020', l:'Ouro', p:'Ao Leite 45% (Melhor do Brasil)', star:true },
      { c:'Bean to Bar Brasil', y:'2026', l:'Prata', p:'70% Medicilândia (PA)' },
      { c:'Bean to Bar Brasil', y:'2026', l:'Prata', p:'70% catongo Uruará (PA)' },
      { c:'Bean to Bar Brasil', y:'2025', l:'Prata', p:'70% Tuerê (PA)' },
      { c:'Cacau Fest Brasil', y:'2025', l:'Vencedora', p:'Chocolate Aromatizado' },
    ] },
  { logo:'62_gallette.bin', name:'Gallette Chocolates', year:'2011', loc:'São Paulo, SP', site:'https://www.gallette.com.br', src:'imprensa',
    pos:'Bean-to-bar de São Paulo, da engenheira Gislaine Gallette; 100% cacau brasileiro de origem, com forte linha de bombons. Premium.',
    lines:'Barras de origem (40–85%, Catongo, inclusões), bombons (jabuticaba) e Pé de Moleque Supremo.',
    nota:'Premiações nacionais confirmadas; menção na Academy of Chocolate 2018 (bombom de jabuticaba).',
    awards:[
      { c:'Bean to Bar Brasil', y:'2018', l:'Ouro', p:'Ao Leite 40%', star:true },
      { c:'Bean to Bar Brasil', y:'2019', l:'Ouro', p:'Ao Leite 56%' },
      { c:'Bean to Bar Brasil', y:'2020', l:'Ouro', p:'Intenso 70%' },
      { c:'Academy of Chocolate', y:'2018', l:'Premiado', p:'Bombom de Jabuticaba' },
    ] },
  { logo:'60_ascurra.bin', name:'Ascurra Chocolate', year:'~2018', loc:'Medicilândia, PA', site:'https://www.ascurrachocolate.com.br', src:'oficial',
    pos:'Tree-to-bar da Transamazônica: a família cultiva, fermenta e produz chocolate de origem única do próprio Sítio Ascurra, em Medicilândia (PA). Artesanal.',
    lines:'Intensos de origem (70% e 100% do Sítio Ascurra), ao leite; versões sem açúcar e veganas.',
    awards:[
      { c:'Bean to Bar Brasil', y:'2022', l:'Ouro', p:'70% Amazônia (Sítio Ascurra)', star:true },
      { c:'Chocolat Festival Amazônia', y:'2023', l:'Ouro', p:'Intenso (Sítio Ascurra)' },
      { c:'Bean to Bar Brasil', y:'2025', l:'Bronze', p:'70% Sítio Ascurra, Medicilândia (PA)' },
    ] },
  { logo:'65_alquimia.bin', name:'Alquimia Chocolates', year:'n/d', loc:'São Paulo, SP', site:'https://www.instagram.com/alquimia.chocolate', src:'imprensa',
    pos:'Bean-to-bar artesanal de São Paulo, da chocolatier Paula Fernandes; barras de origem com cacau de Medicilândia (PA). Micro-lote.',
    lines:'Barras “Intenso” de origem (Medicilândia/PA).',
    nota:'Prêmio confirmado pela imprensa (Chócolatras Online); perfil principal via Instagram.',
    awards:[ { c:'Bean to Bar Brasil', y:'2020', l:'Ouro', p:'Intenso (Medicilândia/PA)' } ] },
  { logo:'58_alma.bin', name:'Alma Chocolates', year:'n/d', loc:'Brasil', site:'https://almachocolates.com.br', src:'oficial',
    pos:'Bean-to-bar de microlotes, com cacau fino de origem rastreável de pequenos produtores brasileiros, sem aditivos. Artesanal.',
    lines:'Tabletes de origem (44% ao leite, 55% intenso ao leite, 70%, 85%) e inclusões.',
    awards:[
      { c:'Bean to Bar Brasil', y:'2025', l:'Prata', p:'44% ao Leite (Espírito Santo)' },
      { c:'Bean to Bar Brasil', y:'2025', l:'Bronze', p:'55% (Bahia)' },
      { c:'Bean to Bar Brasil', y:'2025', l:'Bronze', p:'70% (Rondônia)' },
      { c:'Bean to Bar Brasil', y:'2026', l:'Bronze', p:'55% (Bahia)' },
    ] },
  { logo:'67_choc.bin', name:'Choc Chocolates Finos', year:'~2015', loc:'Lauro de Freitas, BA', site:'https://www.instagram.com/chocchocolates', src:'imprensa',
    pos:'Tree-to-bar baiana de chocolates de origem sem açúcar e veganos, com 100% cacau brasileiro de cultivo próprio.',
    lines:'Barra Intenso 70% (cacau Bahia); linha sem açúcar e vegana.',
    nota:'Segundo lugar na 1ª edição do Prêmio Bean to Bar Brasil (2017), via imprensa especializada.',
    awards:[ { c:'Bean to Bar Brasil', y:'2017', l:'Prata', p:'70% Cacau (Bahia)' } ] },
  { logo:'66_saramentos.bin', name:"Saramento's Chocolate", year:'1998', loc:'Itapema, SC', site:'https://www.instagram.com/saramentoschocolate', src:'imprensa',
    pos:'Chocolataria artesanal e familiar de Fabiana Saramento, que une bombons de tradição a barras bean-to-bar de cacau brasileiro. Premium.',
    lines:'Linha Intenso (70% cacau) e bombons/chocolates sazonais.',
    awards:[ { c:'Bean to Bar Brasil', y:'2018', l:'Bronze', p:'Intenso 70% Cacau' } ] },
  { logo:'63_natucoa.bin', name:'Natucoa', year:'2019', loc:'Ilhéus, BA', site:'https://natucoa.com.br', src:'oficial',
    pos:'Bean-to-bar da cooperativa Coopessba, vegana e sem glúten/lactose, com cacau da agricultura familiar do sistema Cabruca (Sul da Bahia). Impacto social.',
    lines:'Linhas “Original Por Natureza” e “Clássicos”; barras de origem Sul da Bahia (IP).',
    awards:[ { c:'CNA Brasil Artesanal', y:'2019', l:'3º lugar', p:'Chocolate artesanal (origem Sul da Bahia)' } ] },
  { logo:'64_tropical.bin', name:'Tropical Cacau', year:'n/d', loc:'Colombo, PR', site:'https://www.tropicalcacau.com.br', src:'imprensa',
    pos:'Bean-to-bar artesanal de Colombo (PR), com cacau de origem rastreável e foco em transparência e sustentabilidade.',
    lines:'Barras bean-to-bar (ao leite 45% Bahia), drageados e nibs.',
    awards:[ { c:'Bean to Bar Brasil', y:'2025', l:'Bronze', p:'45% ao Leite (Bahia)' } ] },
  { logo:'68_ocan.bin', name:'Ocan Chocolate', year:'n/d', loc:'Espírito Santo', site:'https://www.instagram.com/ocan_chocolate', src:'imprensa',
    pos:'Pequena bean-to-bar capixaba, com cacau agroflorestal de origem (Espírito Santo) e cacau cerimonial. Artesanal.',
    lines:'Barras de origem ES — destaque ao leite 52%.',
    awards:[ { c:'Bean to Bar Brasil', y:'2026', l:'Bronze', p:'52% ao Leite (Espírito Santo)' } ] },
  { logo:'71_moselle.bin', name:'Moselle Chocolatier', year:'2018', loc:'São Martinho, SC', site:'https://mosellechocolatier.com.br', src:'imprensa',
    pos:'Bean-to-bar de São Martinho (SC), de Francine Loffi e Rena Fernandes, com cacau da Bahia; chocolates acessíveis, com opções sem lactose/açúcar/glúten. Artesanal.',
    lines:'Barras bean-to-bar de cacau baiano; ao leite premiado; versões sem lactose/açúcar.',
    awards:[ { c:'Bean to Bar Brasil', y:'2019', l:'Bronze', p:'Ao Leite' } ] },
];

// Internacionais premiadas, mas SEM revenda confirmada no Brasil
const SEM_BR = [
  { name: 'Michel Cluizel', country: 'França', note: 'ICA Mundial 2012 — Ouro (Maralumi ao Leite) + 2 Pratas.' },
  { name: 'Cacao Hunters', country: 'Colômbia', note: 'ICA Mundial 2024 — Prata (Arhuacos 72%) + 3 Bronzes.' },
  { name: 'Original Beans', country: 'Holanda', note: 'Academy of Chocolate (Prata) e Great Taste (Ouro) — Cru Virunga 70%.' },
  { name: 'Marou', country: 'Vietnã', note: 'Academy of Chocolate 2013 — Ouro/Prata/Bronze (origens vietnamitas).' },
];

const ORIGEM = [
  'Fazenda Santa Cruz (Cantagalo)', 'Gilmar Batista de Souza', 'Leomar Silva Vieira',
];

// ---------------- RENDER ----------------
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function logoHtml(m) {
  const uri = dataUri(m.logo);
  const dk = DARK_BG.has(m.logo) ? ' darkbg' : '';
  if (uri) return `<div class="logo${dk}"><img src="${uri}" alt="Logo ${esc(m.name)}" loading="lazy"></div>`;
  // monograma
  const initials = m.name.replace(/[^A-Za-zÀ-ÿ ]/g, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return `<div class="logo mono">${esc(initials || '?')}</div>`;
}

function awardsHtml(m) {
  const rows = m.awards.map((a) => {
    const cls = medalClass(a.l);
    const star = a.star ? '<span class="star" title="Chocolate com múltiplas premiações">★</span>' : '';
    return `<li><span class="medal ${cls}">${esc(a.l)}</span>` +
      `<span class="aw-body"><span class="aw-comp">${esc(a.c)} ${esc(a.y)}</span>` +
      `<span class="aw-prod">${star}${esc(a.p)}</span></span></li>`;
  }).join('');
  return `<ul class="awards">${rows}</ul>`;
}

function srcBadge(src) {
  if (src === 'imprensa') return '<span class="badge amber" title="Premiações verificadas em reportagens, não em páginas oficiais das competições">fonte: imprensa</span>';
  return '<span class="badge green" title="Premiações verificadas nas páginas oficiais das competições">fonte: oficial</span>';
}

function siteHostname(url) {
  let u = url.replace(/^https?:\/\//, '').replace(/\?.*$/, '').replace(/\/$/, '');
  const ig = u.match(/^(?:www\.)?instagram\.com\/([^/?]+)/i);
  if (ig) return '@' + ig[1];
  u = u.replace(/^www\./, '');
  if (u.length > 26) u = u.slice(0, 25) + '…';
  return u;
}

// Display font embedded (self-contained)
const FRAUNCES = fs.existsSync(path.join(__dirname, 'fonts/fraunces.woff2'))
  ? `data:font/woff2;base64,${fs.readFileSync(path.join(__dirname, 'fonts/fraunces.woff2')).toString('base64')}`
  : '';

// Favicon embedded (self-contained): SVG para navegadores modernos + PNG de fallback
const FAVICON_SVG = fs.existsSync(path.join(__dirname, 'favicon.svg'))
  ? `data:image/svg+xml;base64,${fs.readFileSync(path.join(__dirname, 'favicon.svg')).toString('base64')}`
  : '';
const FAVICON_PNG = fs.existsSync(path.join(__dirname, 'favicon-180.png'))
  ? `data:image/png;base64,${fs.readFileSync(path.join(__dirname, 'favicon-180.png')).toString('base64')}`
  : '';

// URL público do site (para o preview de link / Open Graph). Trocar aqui se usar domínio próprio,
// ou definir a env var SITE_URL no build do Cloudflare.
const SITE_URL = (process.env.SITE_URL || 'https://chocolates-brasil.pages.dev').replace(/\/+$/, '');

// ---- Medalheira (medal tally) — the signature element ----
const MEDAL_ORDER = { g: 0, s: 1, b: 2, o: 3 };
const MEDAL_LABEL = { g: 'Ouro', s: 'Prata', b: 'Bronze', o: 'Distinção' };
function tallyOf(awards) { const c = { g: 0, s: 0, b: 0, o: 0 }; for (const a of awards) c[medalClass(a.l)]++; return c; }
function signatureOf(m) {
  const aw = m.awards || []; if (!aw.length) return null;
  const star = aw.find((a) => a.star);
  if (star) {
    const yrs = [...new Set(aw.filter((a) => a.p === star.p).map((a) => a.y))].join(' · ');
    return { p: star.p, sub: `${star.c} ${yrs}` };
  }
  const best = [...aw].sort((a, b) => MEDAL_ORDER[medalClass(a.l)] - MEDAL_ORDER[medalClass(b.l)])[0];
  return { p: best.p, sub: `${best.l} · ${best.c} ${best.y}` };
}
function discsHtml(awards, xl) {
  const c = tallyOf(awards);
  return ['g', 's', 'b', 'o'].filter((k) => c[k] > 0).map((k) =>
    `<span class="disc ${k}${xl ? ' xl' : ''}" title="${c[k]} ${MEDAL_LABEL[k]}"><b>${c[k]}</b></span>`).join('');
}
const COMP_ORDER = ['mundial', 'americas', 'aoc', 'avpa', 'nacional', 'outro'];
function medalheiraHtml(m) {
  const aw = m.awards || []; if (!aw.length) return '';
  const byComp = {};
  for (const a of aw) { const k = compKey(a.c); (byComp[k] = byComp[k] || []).push(a); }
  const rows = COMP_ORDER.filter((k) => byComp[k]).map((k) =>
    `<div class="trow"><span class="ctag ${k}">${COMP_LABEL[k]}</span><span class="tdiscs">${discsHtml(byComp[k])}</span></div>`).join('');
  const sig = signatureOf(m);
  return `<div class="medalheira">
    <div class="tally">${rows}</div>
    ${sig ? `<p class="sig"><span class="sig-star" title="Barra-assinatura premiada">★</span><span class="sig-body"><span class="sig-p">${esc(sig.p)}</span><span class="sig-s">${esc(sig.sub)}</span></span></p>` : ''}
  </div>`;
}
function detailsHtml(m) {
  if (m.awards.length <= 1) return m.nota ? `<p class="nota">⚠ ${esc(m.nota)}</p>` : '';
  return `<details class="dets">
    <summary>ver as ${m.awards.length} premiações</summary>
    <div class="dets-body">${awardsHtml(m)}${m.nota ? `<p class="nota">⚠ ${esc(m.nota)}</p>` : ''}</div>
  </details>`;
}

// ---- Tags de método/escala (extraídas do posicionamento) ----
const METHOD_OVERRIDE = { 'Chocolat du Jour': 'chocolatier' };
const SCALE_BIG = new Set(['Nugali Chocolates', 'Prawer Chocolates', 'Chocolat du Jour']);
function traitsOf(m) {
  const p = (m.pos || '').toLowerCase();
  let method = METHOD_OVERRIDE[m.name];
  if (!method) {
    if (p.includes('tree-to-bar')) method = 'tree-to-bar';
    else if (p.includes('bean-to-bar')) method = 'bean-to-bar';
    else if (/chocolat(eria|ier)|bombons|trufas|pralin|couverture/.test(p)) method = 'chocolatier';
    else method = 'bean-to-bar';
  }
  const scale = (SCALE_BIG.has(m.name) || /maior escala|não micro|industrial|democratiza/.test(p)) ? 'maior escala' : 'micro-lote';
  const traits = [];
  if (/famíli|familiar|irmãs|irmãos|casal/.test(p)) traits.push('familiar');
  if (/vegan|plant-based/.test(p)) traits.push('vegana');
  if (/orgânic/.test(p)) traits.push('orgânica');
  return { method, scale, traits };
}
const TRAIT_TIP = {
  'bean-to-bar': 'Faz o chocolate do grão à barra — torra, moagem e conchagem no próprio ateliê.',
  'tree-to-bar': 'Bean-to-bar e ainda cultiva o próprio cacau — da árvore à barra.',
  'chocolatier': 'Parte de cobertura (couverture) pronta para criar bombons, trufas e pralinés.',
  'micro-lote': 'Produção artesanal em pequenos lotes, com foco em qualidade e terroir.',
  'maior escala': 'Produção em maior volume e com distribuição mais ampla.',
  'familiar': 'Negócio de gestão familiar.',
  'vegana': 'Ingredientes sem origem animal.',
  'orgânica': 'Cacau e ingredientes de cultivo orgânico.',
};
function traitsHtml(m) {
  const t = traitsOf(m);
  const tip = (k) => TRAIT_TIP[k] ? ` data-tip="${TRAIT_TIP[k]}"` : '';
  return `<div class="traits"><span class="trait t-method"${tip(t.method)}>${t.method}</span><span class="trait t-scale"${tip(t.scale)}>${t.scale}</span>${t.traits.map((x) => `<span class="trait t-extra"${tip(x)}>${x}</span>`).join('')}</div>`;
}

function cardBr(m, rank) {
  return `<article class="card" id="${slug(m.name)}" data-comps="${compsOf(m).join(' ')}">
  <div class="card-head">
    ${logoHtml(m)}
    <div class="id">
      <h3>${esc(m.name)}</h3>
      <p class="meta"><span class="loc">${esc(m.loc)}</span> · Fundada ${esc(m.year)}</p>
    </div>
    <div class="rankbox">
      <span class="rank">${String(rank).padStart(2, '0')}</span>
      <span class="score" title="Índice de prestígio — veja o cálculo no topo da página">${Math.round(strengthAll(m)).toLocaleString('pt-BR')}<small>pts</small></span>
    </div>
  </div>
  ${traitsHtml(m)}
  <p class="pos">${esc(m.pos)}</p>
  ${medalheiraHtml(m)}
  <p class="lines"><span class="lbl">Linhas</span> ${esc(m.lines)}</p>
  ${detailsHtml(m)}
  <div class="card-foot">
    <a class="site" href="${esc(m.site)}" target="_blank" rel="noopener">${esc(siteHostname(m.site))} ↗</a>
    ${srcBadge(m.src)}
  </div>
</article>`;
}

function cardIntl(m, rank) {
  return `<article class="card" id="${slug(m.name)}" data-comps="${compsOf(m).join(' ')}">
  <div class="card-head">
    ${logoHtml(m)}
    <div class="id">
      <h3>${esc(m.name)}</h3>
      <p class="meta"><span class="loc flag">${esc(m.country)}</span> · Fundada ${esc(m.year)}</p>
    </div>
    <span class="rank">${String(rank).padStart(2, '0')}</span>
  </div>
  <p class="pos">${esc(m.pos)}</p>
  ${medalheiraHtml(m)}
  <p class="avail"><span class="lbl">No Brasil</span> ${esc(m.avail)}</p>
  <p class="lines"><span class="lbl">Linhas</span> ${esc(m.lines)}</p>
  ${detailsHtml(m)}
  <div class="card-foot">
    <a class="site" href="${esc(m.site)}" target="_blank" rel="noopener">${esc(siteHostname(m.site))} ↗</a>
    ${srcBadge(m.src)}
  </div>
</article>`;
}

// Merge de prêmios adicionais verificados nas auditorias (patch.json + patch2.json)
{
  const _norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
  const _by = new Map([...BR, ...NAC_NEW, ...AOC, ...AVPA].map((m) => [_norm(m.name), m]));
  let added = 0;
  for (const pf of ['awards-patch.json', 'awards-patch2.json']) {
    try {
      const PATCH = JSON.parse(fs.readFileSync(path.join(__dirname, pf), 'utf8'));
      for (const [nm, extra] of Object.entries(PATCH)) {
        const m = _by.get(_norm(nm)); if (!m) continue;
        m.awards = m.awards || [];
        const seen = new Set(m.awards.map((a) => `${a.c}|${a.y}|${a.l}|${a.p}`));
        for (const a of extra) { const k = `${a.c}|${a.y}|${a.l}|${a.p}`; if (!seen.has(k)) { m.awards.push(a); seen.add(k); added++; } }
      }
    } catch (e) { console.error('patch skip', pf, e.message); }
  }
  console.log(`Patch: +${added} prêmios mesclados`);
}

// Ordenação por prestígio — cada seção ranqueia pelas medalhas da SUA competição
const LW = { g: 100, s: 60, b: 30, o: 15 };
function strengthBy(m, pred) {
  const aw = (m.awards || []).filter((a) => pred(a.c));
  let max = 0, sum = 0;
  for (const a of aw) { const w = LW[medalClass(a.l)]; if (w > max) max = w; sum += w; }
  return max * 1000 + sum;
}
const sortBy = (pred) => (a, b) => strengthBy(b, pred) - strengthBy(a, pred);
const reMundial = (c) => /ICA Mundial/.test(c);
const reAmericas = (c) => /ICA Américas/.test(c);
const reAoC = (c) => /Academy of Chocolate/.test(c);
const reAvpa = (c) => /AVPA/.test(c);
const reNac = (c) => /(Bean to Bar Brasil|CNA|Cacau Fest|Chocolat Festival)/.test(c);

const t1 = BR.filter((m) => m.tier === 1).sort(sortBy(reMundial));
const t2 = BR.filter((m) => m.tier === 2).sort(sortBy(reAmericas));
AOC.sort(sortBy(reAoC));
AVPA.sort(sortBy(reAvpa));
const NACIONAL = [...BR.filter((m) => m.tier === 3), ...NAC_NEW].sort(sortBy(reNac));

// Field-wide medal tally for the masthead (somente competições brasileiras cobertas)
const ALL_MAKERS = [...BR, ...NAC_NEW, ...AOC, ...AVPA];
const TOTAL_BR = t1.length + t2.length + AOC.length + AVPA.length + NACIONAL.length;
const FIELD = { g: 0, s: 0, b: 0, o: 0 };
for (const m of ALL_MAKERS) for (const a of m.awards) FIELD[medalClass(a.l)]++;
const FIELD_TOTAL = FIELD.g + FIELD.s + FIELD.b + FIELD.o;
const FIELD_DISCS = ['g', 's', 'b', 'o'].filter((k) => FIELD[k] > 0)
  .map((k) => `<span class="disc ${k} xl" title="${FIELD[k]} ${MEDAL_LABEL[k]}"><b>${FIELD[k]}</b></span>`).join('');

// ---- Cross-competition helpers (vistas: por competição + unificada) ----
function compKey(c) {
  if (reMundial(c)) return 'mundial';
  if (reAmericas(c)) return 'americas';
  if (reAoC(c)) return 'aoc';
  if (reAvpa(c)) return 'avpa';
  if (/(Bean to Bar Brasil|CNA|Cacau Fest|Chocolat Festival)/.test(c)) return 'nacional';
  return 'outro';
}
const COMP_LABEL = { mundial: 'ICA Mundial', americas: 'ICA Américas', aoc: 'Academy of Chocolate', avpa: 'AVPA Paris', nacional: 'Nacional', outro: 'Outro' };
function compsOf(m) { return [...new Set((m.awards || []).map((a) => compKey(a.c)))]; }
function compTagsHtml(m) {
  const ks = compsOf(m);
  if (ks.length < 2) return '';
  return `<div class="comptags">${ks.map((k) => `<span class="ctag ${k}">${COMP_LABEL[k]}</span>`).join('')}</div>`;
}
function slug(name) {
  return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
// Índice de prestígio cruzado: peso da competição × peso da medalha, com ênfase na melhor medalha
const CW = { mundial: 10, americas: 3.5, aoc: 3, avpa: 2.5, nacional: 1.5, outro: 1 };
function strengthAll(m) {
  let best = 0, sum = 0;
  for (const a of (m.awards || [])) { const pts = CW[compKey(a.c)] * LW[medalClass(a.l)]; if (pts > best) best = pts; sum += pts; }
  return best * 10 + sum;
}
const HOME = new Map();
t1.forEach((m) => HOME.set(m, 'Seção 1 · Nível 1'));
t2.forEach((m) => HOME.set(m, 'Seção 1 · Nível 2'));
AOC.forEach((m) => HOME.set(m, 'Seção 2'));
AVPA.forEach((m) => HOME.set(m, 'Seção 3'));
NACIONAL.forEach((m) => HOME.set(m, 'Seção 4'));
const ALL_UNIQUE = [...t1, ...t2, ...AOC, ...AVPA, ...NACIONAL];
const TOTAL_AWARDS = ALL_UNIQUE.reduce((s, m) => s + ((m.awards || []).length), 0);
const OG_DESC = `As marcas brasileiras de chocolate fino mais premiadas — ${ALL_UNIQUE.length} marcas e ${TOTAL_AWARDS} prêmios verificados (ICA, Academy of Chocolate, AVPA e nacionais), ranqueadas por um índice de prestígio.`;
const unifiedRanked = [...ALL_UNIQUE].sort((a, b) => strengthAll(b) - strengthAll(a));
function crossStripHtml(pred, primaryArr) {
  const inPrimary = new Set(primaryArr);
  const refs = ALL_UNIQUE.filter((m) => !inPrimary.has(m) && (m.awards || []).some((a) => pred(a.c))).sort(sortBy(pred));
  if (!refs.length) return '';
  const items = refs.map((m) => `<a class="xref" href="#${slug(m.name)}">
      <span class="xref-logo">${logoHtml(m)}</span>
      <span class="xref-main"><span class="xref-name">${esc(m.name)}</span><span class="xref-discs">${discsHtml((m.awards || []).filter((a) => pred(a.c)))}</span></span>
      <span class="xref-home">${HOME.get(m)} ↗</span></a>`).join('');
  return `<div class="xrefs"><p class="xrefs-title">Também premiadas aqui <em>· ficha completa em outra seção</em></p><div class="xrefs-list">${items}</div></div>`;
}

function shell(titleStr, mainInner, otherLink) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#2f5d49">
<title>${titleStr}</title>
${FAVICON_SVG ? `<link rel="icon" type="image/svg+xml" href="${FAVICON_SVG}">` : ''}
${FAVICON_PNG ? `<link rel="apple-touch-icon" href="${FAVICON_PNG}">\n<link rel="alternate icon" type="image/png" href="${FAVICON_PNG}">` : ''}
<meta name="description" content="${esc(OG_DESC)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Chocolates Brasileiros Premiados">
<meta property="og:locale" content="pt_BR">
<meta property="og:title" content="Chocolates Brasileiros Premiados">
<meta property="og:description" content="${esc(OG_DESC)}">
<meta property="og:url" content="${SITE_URL}/">
<meta property="og:image" content="${SITE_URL}/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:type" content="image/png">
<meta property="og:image:alt" content="Chocolates Brasileiros Premiados — diretório ranqueado por prestígio">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Chocolates Brasileiros Premiados">
<meta name="twitter:description" content="${esc(OG_DESC)}">
<meta name="twitter:image" content="${SITE_URL}/og-image.png">
<style>
  @font-face{font-family:'Fraunces';src:url(${FRAUNCES}) format('woff2');font-weight:300 900;font-style:normal;font-display:swap}
  :root{
    --ink:#241811; --paper:#ece3d2; --card:#faf5ec; --card2:#f4ecdd; --line:#e3d7c3;
    --muted:#897565; --muted2:#a3917f;
    --cabruca:#2f5d49; --cabruca-d:#15302440; --cabruca-deep:#15302b; --sage:#9bb7a6;
    --ouro:#c2983a; --prata:#9aa0a4; --bronze:#a8743c;
    --serif:'Fraunces',Georgia,'Times New Roman',serif;
    --sans:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
    --mono:ui-monospace,'SF Mono',Menlo,Consolas,monospace;
  }
  *{box-sizing:border-box}
  body{margin:0;font-family:var(--sans);color:var(--ink);background:var(--paper);
    line-height:1.55;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
  .wrap{max-width:1200px;margin:0 auto;padding:0 22px}
  a{color:var(--cabruca)}

  /* ---- Masthead ---- */
  .masthead{background:radial-gradient(120% 140% at 80% -20%,#23463a 0%,var(--cabruca-deep) 45%,#0f221b 100%);
    color:#efe6d4;padding:64px 0 52px;border-bottom:3px solid var(--ouro)}
  .eyebrow{font-family:var(--mono);font-size:.72rem;letter-spacing:.28em;text-transform:uppercase;
    color:var(--sage);margin:0 0 18px}
  .masthead h1{font-family:var(--serif);font-weight:340;font-size:clamp(2.6rem,6vw,4.6rem);line-height:.98;
    letter-spacing:-.015em;margin:0 0 18px;color:#f6eede}
  .masthead h1 em{font-style:italic;font-weight:340;color:#f0e4cb}
  .thesis{font-size:1.08rem;line-height:1.5;max-width:640px;color:#d8c8ad;margin:0 0 30px}
  .field{display:flex;align-items:center;gap:18px;flex-wrap:wrap;padding:18px 0 6px;border-top:1px solid #ffffff1f;max-width:680px}
  .field-discs{display:flex;gap:10px}
  .field-cap{font-size:.9rem;color:#cdb99c;max-width:260px;margin:0}
  .mast-meta{font-family:var(--mono);font-size:.74rem;letter-spacing:.04em;color:#a7cab6;margin:22px 0 0}

  main{padding:8px 0 30px}

  /* ---- Section headers ---- */
  .section-title{margin:56px 0 4px;padding-bottom:12px;border-bottom:1.5px solid var(--cabruca);
    display:flex;align-items:baseline;gap:14px;flex-wrap:wrap}
  .section-title h2{font-family:var(--serif);font-weight:380;font-size:1.9rem;letter-spacing:-.01em;margin:0;color:var(--ink)}
  .section-title .count{font-family:var(--mono);font-size:.74rem;letter-spacing:.04em;color:var(--muted);margin-left:auto}
  .section-intro{color:var(--muted);max-width:880px;margin:10px 0 4px;font-size:.96rem}
  .section-intro em{color:var(--cabruca);font-style:italic}
  .tier-block{margin-top:30px}
  .tier-head{margin-bottom:16px}
  .tier-head h3{font-family:var(--serif);font-weight:440;margin:0 0 3px;font-size:1.24rem;color:var(--cabruca)}
  .tier-head p{margin:0;color:var(--muted);max-width:900px;font-size:.9rem}

  /* ---- Grid + card ---- */
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(366px,1fr));gap:16px;align-items:stretch}
  @media(max-width:520px){.grid{grid-template-columns:1fr}}
  .card{background:var(--card);border:1px solid var(--line);border-radius:13px;padding:18px;
    display:flex;flex-direction:column;box-shadow:0 1px 2px rgba(40,25,15,.05)}
  .card-head{display:flex;align-items:center;gap:13px;margin-bottom:11px}
  .logo{flex:0 0 60px;width:60px;height:60px;border-radius:11px;background:#fff;border:1px solid var(--line);
    display:flex;align-items:center;justify-content:center;padding:7px;overflow:hidden}
  .logo img{max-width:100%;max-height:100%;object-fit:contain}
  .logo.mono{background:linear-gradient(150deg,var(--cabruca),var(--cabruca-deep));color:#eddfae;
    font-family:var(--serif);font-weight:500;font-size:1.35rem;padding:0}
  .logo.darkbg{background:linear-gradient(150deg,#274034,#14241d)}
  .id{flex:1;min-width:0}
  .id h3{font-family:var(--serif);font-weight:500;margin:0;font-size:1.16rem;line-height:1.12;color:var(--ink);letter-spacing:-.005em}
  .meta{margin:3px 0 0;font-size:.76rem;color:var(--muted)}
  .meta .loc{color:var(--cabruca);font-weight:600}
  .meta .flag{color:#7a6450}
  .rankbox{display:flex;flex-direction:column;align-items:flex-end;gap:3px;align-self:flex-start}
  .rank{font-family:var(--serif);font-style:italic;font-size:1.5rem;color:#d8c7ab;line-height:1;font-weight:400}
  .score{font-family:var(--mono);font-size:.66rem;color:var(--muted2);font-variant-numeric:tabular-nums;white-space:nowrap;letter-spacing:.02em}
  .score small{font-size:.78em;opacity:.65;margin-left:1px}
  .pos{margin:0 0 4px;font-size:.9rem;line-height:1.5;color:#4a3a2c}
  .traits{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 11px}
  .trait{font-family:var(--mono);font-size:.6rem;letter-spacing:.02em;padding:3px 9px;border-radius:999px;font-weight:600;white-space:nowrap;position:relative}
  .t-method{background:var(--cabruca);color:#eef3ee}
  .t-scale{background:var(--card2);color:var(--cabruca);border:1px solid var(--line)}
  .t-extra{background:transparent;color:var(--muted);border:1px solid var(--line)}
  .trait[data-tip]{cursor:help}
  .trait[data-tip]:hover::after{content:attr(data-tip);position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);background:var(--ink);color:#f1e6cf;padding:8px 11px;border-radius:8px;font-size:.72rem;font-weight:400;white-space:normal;width:210px;z-index:20;line-height:1.4;box-shadow:0 8px 22px rgba(0,0,0,.28);pointer-events:none}
  .trait[data-tip]:hover::before{content:"";position:absolute;bottom:calc(100% + 2px);left:50%;transform:translateX(-50%);border:5px solid transparent;border-top-color:var(--ink);z-index:20}

  /* ---- Medalheira (signature) ---- */
  .medalheira{margin:12px 0 11px;padding:11px 13px;background:var(--card2);border:1px solid var(--line);border-radius:10px}
  .tally{display:flex;flex-direction:column;gap:8px}
  .trow{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
  .tdiscs{display:flex;gap:6px}
  .trow .ctag{flex:0 0 auto}
  .discs{display:flex;align-items:center;gap:8px}
  .disc{display:inline-flex;align-items:center;justify-content:center;width:27px;height:27px;border-radius:50%;
    font-family:var(--mono);font-weight:700;font-size:.76rem;font-variant-numeric:tabular-nums;
    box-shadow:0 1px 2px rgba(0,0,0,.28),inset 0 1px 1px rgba(255,255,255,.5),inset 0 -2px 3px rgba(0,0,0,.12)}
  .disc.g{background:radial-gradient(circle at 36% 28%,#f0d585,#c2983a 60%,#94701f);color:#4a3705}
  .disc.s{background:radial-gradient(circle at 36% 28%,#f1f3f4,#aeb4b8 58%,#868c90);color:#363b3e}
  .disc.b{background:radial-gradient(circle at 36% 28%,#e0ad76,#a8743c 60%,#7e5429);color:#2e1c0c}
  .disc.o{background:radial-gradient(circle at 36% 28%,#75a187,#2f5d49 64%,#1f4334);color:#e9f3ec}
  .disc.xl{width:48px;height:48px;font-size:1.25rem}
  .disc b{line-height:1}
  .awn{margin-left:3px;font-family:var(--mono);font-size:.7rem;letter-spacing:.03em;color:var(--muted2);font-weight:600}
  .sig{margin:10px 0 0;display:flex;gap:7px;align-items:baseline}
  .sig-star{color:var(--ouro);font-size:.92rem;line-height:1}
  .sig-body{display:flex;flex-direction:column;min-width:0;line-height:1.3}
  .sig-p{font-weight:600;font-size:.85rem;color:var(--ink)}
  .sig-s{font-size:.74rem;color:var(--muted)}

  .lines,.avail{margin:0 0 9px;font-size:.83rem;line-height:1.45;color:#5a4a3a}
  .lbl{font-family:var(--mono);font-size:.64rem;letter-spacing:.1em;text-transform:uppercase;
    color:var(--cabruca);font-weight:700;margin-right:6px}
  .avail .lbl{color:var(--bronze)}

  /* ---- Disclosure ---- */
  .dets{margin:0 0 4px}
  .dets>summary{list-style:none;cursor:pointer;font-size:.78rem;font-weight:600;color:var(--cabruca);
    display:inline-flex;align-items:center;gap:7px;padding:2px 0;user-select:none}
  .dets>summary::-webkit-details-marker{display:none}
  .dets>summary::before{content:'';width:0;height:0;border-left:5px solid currentColor;
    border-top:3.5px solid transparent;border-bottom:3.5px solid transparent;transition:transform .15s ease}
  .dets[open]>summary::before{transform:rotate(90deg)}
  .dets[open]>summary{margin-bottom:8px}
  .dets-body{padding-left:1px}
  ul.awards{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:7px}
  ul.awards li{display:grid;grid-template-columns:auto 1fr;gap:9px;align-items:start;font-size:.82rem}
  .medal{font-family:var(--mono);font-size:.62rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;
    padding:3px 7px;border-radius:5px;text-align:center;color:#fff;margin-top:1px;white-space:nowrap}
  .medal.g{background:linear-gradient(160deg,#cda644,#a07d28);color:#2c2104}
  .medal.s{background:linear-gradient(160deg,#bcc1c5,#8d9398);color:#2c3033}
  .medal.b{background:linear-gradient(160deg,#bd8b52,#8c5e30)}
  .medal.o{background:linear-gradient(160deg,#4c7a64,#2f5d49)}
  .aw-body{display:flex;flex-direction:column;line-height:1.32}
  .aw-comp{font-weight:600;color:var(--cabruca);font-size:.78rem}
  .aw-prod{color:#5b4b3e;font-size:.81rem}
  .star{color:var(--ouro);margin-right:3px}
  .nota{margin:9px 0 0;font-size:.76rem;line-height:1.4;color:#7d5e16;background:#f7f0df;border-left:2px solid #d9b94e;border-radius:0 6px 6px 0;padding:6px 9px}

  /* ---- Footer of card ---- */
  .card-foot{margin-top:auto;padding-top:13px;border-top:1px solid var(--line);
    display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;row-gap:9px}
  .site{display:inline-block;font-size:.8rem;font-weight:600;text-decoration:none;font-family:var(--mono);letter-spacing:.02em;
    background:var(--cabruca);color:#eef3ee;padding:6px 13px;border-radius:7px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .site:hover{background:var(--cabruca-deep)}
  .badge{font-family:var(--mono);font-size:.64rem;letter-spacing:.03em;padding:3px 8px;border-radius:6px;font-weight:600;white-space:nowrap}
  .badge.green{background:#e6efe8;color:#356b51;border:1px solid #cfe2d5}
  .badge.amber{background:#f6eeda;color:#8a6411;border:1px solid #e8d6a8}

  /* ---- Panels ---- */
  .panel{background:var(--card);border:1px solid var(--line);border-radius:13px;padding:20px 22px;margin-top:22px}
  .panel h4{font-family:var(--serif);font-weight:480;margin:0 0 8px;color:var(--cabruca);font-size:1.06rem}
  .panel p{color:#5b4b3e;font-size:.9rem;line-height:1.5}
  .panel ul{margin:6px 0 0;padding-left:18px;color:#5a4a3a;font-size:.88rem}
  .panel li{margin-bottom:5px}
  .panel li strong{color:var(--ink)}
  .two{display:grid;grid-template-columns:1fr 1fr;gap:22px}
  @media(max-width:680px){.two{grid-template-columns:1fr}}

  /* ---- Keybar (barra-chave A) ---- */
  .keybar{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:13px 16px;margin:-8px 0 22px}
  .kb-legend{display:flex;align-items:center;gap:14px;flex-wrap:wrap;font-family:var(--mono);font-size:.74rem;color:var(--muted)}
  .kb-it{display:inline-flex;align-items:center;gap:7px}
  .kb-legend .disc{width:17px;height:17px;font-size:0}
  .kb-star{color:var(--ouro);font-weight:700;margin-left:4px}
  .kb-hier{margin-top:7px;font-size:.8rem;color:var(--ink);line-height:1.4}
  .kb-hier b{color:var(--cabruca)}
  .kb-calc{margin-top:8px}
  .kb-calc>summary{list-style:none;cursor:pointer;color:var(--cabruca);font-weight:700;font-size:.78rem;display:inline-flex;align-items:center;gap:7px;user-select:none}
  .kb-calc>summary::-webkit-details-marker{display:none}
  .kb-calc>summary::before{content:'';width:0;height:0;border-left:5px solid currentColor;border-top:3.5px solid transparent;border-bottom:3.5px solid transparent;transition:transform .15s ease}
  .kb-calc[open]>summary::before{transform:rotate(90deg)}

  /* ---- Primer das competições ---- */
  .primer-wrap{margin:0 0 26px}
  .primer-h{font-family:var(--serif);font-weight:520;font-size:1.04rem;color:var(--ink);margin:0 0 4px}
  .primer-sub{color:var(--muted);font-size:.82rem;margin:0 0 10px}
  .primer{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
  @media(max-width:700px){.primer{grid-template-columns:1fr}}
  .comp{background:var(--card);border:1px solid var(--line);border-radius:11px;padding:13px 15px}
  .comp-nm{font-family:var(--serif);font-weight:600;color:var(--cabruca);font-size:1.02rem;margin:0 0 5px}
  .comp-tag{display:inline-block;font-size:.67rem;color:#8a6a2e;background:#f3ead7;border:1px solid #e6d6b0;border-radius:6px;padding:1px 7px;margin-bottom:7px}
  .comp-one{color:var(--ink);font-size:.8rem;margin:7px 0 0;line-height:1.45}
  .comp details{margin-top:9px}
  .comp details>summary{list-style:none;cursor:pointer;color:var(--cabruca);font-weight:700;font-size:.75rem;display:inline-flex;align-items:center;gap:7px;user-select:none}
  .comp details>summary::-webkit-details-marker{display:none}
  .comp details>summary::before{content:'';width:0;height:0;border-left:5px solid currentColor;border-top:3.5px solid transparent;border-bottom:3.5px solid transparent;transition:transform .15s ease}
  .comp details[open]>summary::before{transform:rotate(90deg)}
  .comp-more{font-size:.78rem;color:var(--muted);margin-top:8px;line-height:1.48}
  .comp-more b{color:var(--ink)}

  /* ---- Footer ---- */
  footer{background:var(--cabruca-deep);color:#c9bda6;padding:44px 0 38px;margin-top:48px;font-size:.86rem}
  footer strong{color:#e9dcc1}
  footer a{color:#e8c98f}
  .foot-top{display:flex;justify-content:space-between;align-items:flex-end;gap:18px;flex-wrap:wrap;padding-bottom:22px;border-bottom:1px solid #ffffff1f;margin-bottom:26px}
  .foot-h{font-family:var(--serif);font-weight:480;font-size:1.4rem;color:#f1e6cf;margin:0;line-height:1.1}
  .foot-sub{font-size:.88rem;color:#bcae95;margin:6px 0 0;max-width:520px}
  .foot-stat{font-family:var(--mono);font-size:.73rem;color:var(--sage);margin:0;letter-spacing:.02em}
  .foot-grid{display:grid;grid-template-columns:1fr;gap:24px;max-width:600px}
  @media(max-width:780px){.foot-top{align-items:flex-start}}
  .foot-grid h5{font-family:var(--mono);font-size:.64rem;letter-spacing:.12em;text-transform:uppercase;color:var(--sage);margin:0 0 10px;font-weight:700}
  .foot-grid p{font-size:.84rem;line-height:1.56;color:#bcae95;margin:0}
  .legend{display:flex;gap:14px;flex-wrap:wrap;font-size:.74rem;color:#bcae95;font-family:var(--mono)}
  .legend span{display:inline-flex;align-items:center;gap:7px}
  .legend .disc{width:17px;height:17px;font-size:0}
  .legend-note{margin-top:11px!important;font-size:.78rem!important;color:#9a8d76!important;line-height:1.5!important}
  .foot-credits{font-size:.86rem;color:#cdbfa6;margin:28px 0 0;line-height:1.55;max-width:760px;padding-top:24px;border-top:1px solid #ffffff1f}
  .foot-credits strong{color:#f1e6cf}
  .foot-credits a{color:#e8c98f}
  .foot-date{font-family:var(--mono);font-size:.71rem;color:#9a8d76;margin:14px 0 0;letter-spacing:.02em}

  @media (prefers-reduced-motion:no-preference){
    .card{transition:transform .18s ease,box-shadow .18s ease}
    .card:hover{transform:translateY(-3px);box-shadow:0 10px 26px rgba(30,40,30,.12)}
    .masthead h1,.masthead .thesis,.masthead .field{animation:rise .7s cubic-bezier(.2,.7,.2,1) both}
    .masthead .thesis{animation-delay:.06s}.masthead .field{animation-delay:.12s}
    @keyframes rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
  }
  .site:focus-visible,.dets>summary:focus-visible,a:focus-visible{outline:2px solid var(--cabruca);outline-offset:2px;border-radius:3px}

  /* ---- Competition tags (multi-competition brands) ---- */
  .comptags{display:flex;flex-wrap:wrap;gap:5px;margin-top:10px}
  .ctag{font-family:var(--mono);font-size:.59rem;letter-spacing:.02em;padding:2px 7px;border-radius:5px;font-weight:600;border:1px solid transparent}
  .ctag.mundial{background:#efe2c5;color:#7a5a12;border-color:#e3cf9e}
  .ctag.americas{background:#e7efe9;color:#356b51;border-color:#cfe2d5}
  .ctag.aoc{background:#e9e6f0;color:#4b4374;border-color:#d9d3e6}
  .ctag.avpa{background:#f1e4e4;color:#7a4a4a;border-color:#e6cccc}
  .ctag.nacional{background:#eef2e4;color:#5a6b2f;border-color:#dde6c8}
  .ctag.outro{background:#ececec;color:#666;border-color:#dcdcdc}

  /* ---- Cross-reference strip (sectioned view) ---- */
  .xrefs{margin-top:24px;padding:18px 20px;background:#f1ece1;border:1px dashed #d8c9b0;border-radius:12px}
  .xrefs-title{font-family:var(--mono);font-size:.7rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin:0 0 13px;font-weight:700}
  .xrefs-title em{font-style:normal;text-transform:none;letter-spacing:.01em;color:var(--muted2);font-weight:400}
  .xrefs-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:9px}
  .xref{display:flex;align-items:center;gap:11px;padding:8px 11px;background:var(--card);border:1px solid var(--line);border-radius:10px;text-decoration:none;color:inherit}
  .xref:hover{border-color:var(--cabruca);transform:translateY(-1px)}
  .xref-logo .logo{width:38px;height:38px;flex:0 0 38px;border-radius:8px;padding:4px}
  .xref-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px}
  .xref-name{font-family:var(--serif);font-weight:500;font-size:.93rem;color:var(--ink);line-height:1}
  .xref-discs{display:flex;gap:5px}
  .xref-discs .disc{width:21px;height:21px;font-size:.62rem}
  .xref-home{font-family:var(--mono);font-size:.6rem;color:var(--cabruca);white-space:nowrap;font-weight:600;align-self:flex-start;margin-top:2px}

  /* ---- Filter bar (unified view) ---- */
  .filterbar{display:flex;flex-wrap:wrap;gap:8px;margin:20px 0 24px;position:sticky;top:0;z-index:5;background:var(--paper);padding:14px 0}
  .fchip{font-family:var(--mono);font-size:.74rem;letter-spacing:.02em;padding:7px 14px;border-radius:999px;cursor:pointer;background:var(--card);border:1px solid var(--line);color:var(--muted);font-weight:600}
  .fchip b{font-weight:700;opacity:.65;margin-left:3px}
  .fchip:hover{border-color:var(--cabruca)}
  .fchip.on{background:var(--cabruca);color:#eef3ee;border-color:var(--cabruca)}
  .empty{text-align:center;color:var(--muted);font-style:italic;padding:46px}
  .viewswitch{margin:16px 0 0}
  .viewswitch a{font-family:var(--mono);font-size:.74rem;letter-spacing:.03em;color:var(--sage);text-decoration:none;border:1px solid #ffffff33;padding:8px 14px;border-radius:8px}
  .viewswitch a:hover{border-color:var(--sage);background:#ffffff12}

  /* ---- Methodology box ---- */
  .howto{margin:-8px 0 26px;background:var(--card);border:1px solid var(--line);border-radius:12px}
  .howto>summary{list-style:none;cursor:pointer;padding:14px 18px;font-family:var(--mono);font-size:.76rem;letter-spacing:.03em;color:var(--cabruca);font-weight:600;display:flex;align-items:center;gap:9px;user-select:none}
  .howto>summary::-webkit-details-marker{display:none}
  .howto>summary::before{content:'';width:0;height:0;border-left:5px solid currentColor;border-top:3.5px solid transparent;border-bottom:3.5px solid transparent;transition:transform .15s ease}
  .howto[open]>summary::before{transform:rotate(90deg)}
  .howto-body{padding:0 18px 17px}
  .howto-body>p{font-size:.88rem;color:#5a4a3a;margin:0 0 13px;line-height:1.5}
  .weights{display:flex;flex-direction:column;gap:10px;margin:0 0 13px}
  .wrow{display:flex;flex-wrap:wrap;align-items:center;gap:7px}
  .wlabel{font-family:var(--mono);font-size:.62rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);font-weight:700;min-width:80px}
  .wpill{display:inline-flex;align-items:center;gap:6px;font-family:var(--mono);font-size:.68rem;font-weight:600;color:var(--ink);background:var(--card2);border:1px solid var(--line);padding:3px 9px;border-radius:6px}
  .wpill .disc{width:13px;height:13px;font-size:0;box-shadow:0 1px 1px rgba(0,0,0,.2)}
  .howto-why{font-size:.84rem;color:var(--muted);margin:0;line-height:1.55}
  .howto-why strong{color:var(--cabruca)}

  /* ---- Glossário & FAQ ---- */
  .faq-section{margin-top:10px}
  .glossary{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px;margin:18px 0 28px}
  .gterm{background:var(--card);border:1px solid var(--line);border-radius:11px;padding:13px 15px}
  .gterm .trait{margin:0 4px 9px 0}
  .gterm p{margin:0;font-size:.85rem;line-height:1.5;color:#5a4a3a}
  .faq{display:flex;flex-direction:column;gap:8px;max-width:900px}
  .faq details{background:var(--card);border:1px solid var(--line);border-radius:10px}
  .faq summary{list-style:none;cursor:pointer;padding:13px 16px;font-family:var(--serif);font-weight:500;font-size:1.02rem;color:var(--ink);display:flex;align-items:center;gap:11px;user-select:none}
  .faq summary::-webkit-details-marker{display:none}
  .faq summary::before{content:'+';font-family:var(--mono);color:var(--cabruca);font-weight:700;font-size:1.15rem;line-height:1}
  .faq details[open] summary::before{content:'–'}
  .faq details p{margin:0;padding:0 16px 15px 41px;font-size:.88rem;line-height:1.55;color:#5a4a3a}
  .faq details p strong{color:var(--cabruca)}

  @page{margin:12mm 10mm}
  @media print{
    *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;animation:none!important}
    .masthead h1,.masthead .thesis,.masthead .field{opacity:1!important;transform:none!important}
    .filterbar,.viewswitch{display:none!important}
    .card{break-inside:avoid;box-shadow:none}.card:hover{transform:none!important}
    .dets-body{display:block!important}.dets>summary{display:none}
    .masthead,.howto,.faq,.usection,.faq-section,.panel,footer{break-inside:auto}
    .section-title{break-after:avoid}
  }
</style>
</head>
<body>
<header class="masthead">
  <div class="wrap">
    <p class="eyebrow">Guia curado · prestígio por premiações</p>
    <h1>Os Chocolates Brasileiros<br><em>Mais Premiados</em></h1>
    <p class="thesis">Um mapa do chocolate fino brasileiro ordenado pelo que ele conquistou — dos medalhistas da final mundial do International Chocolate Awards aos premiados da Academy of Chocolate e da AVPA Paris.</p>
    <div class="field">
      <div class="field-discs">${FIELD_DISCS}</div>
      <p class="field-cap">${FIELD_TOTAL} medalhas e distinções internacionais mapeadas em ${ALL_MAKERS.length} marcas</p>
    </div>
    <p class="mast-meta">${TOTAL_BR} marcas brasileiras · ${t1.length + t2.length} no ICA · ${AOC.length} na Academy of Chocolate · ${AVPA.length} na AVPA Paris · ${NACIONAL.length} em prêmios nacionais</p>
    ${otherLink ? `<p class="viewswitch">${otherLink}</p>` : ''}
  </div>
</header>
<main class="wrap">${mainInner}</main>
<footer>
  <div class="wrap">
    <div class="foot-top">
      <div>
        <p class="foot-h">Os Chocolates Brasileiros Mais Premiados</p>
        <p class="foot-sub">Diretório curado de chocolate fino brasileiro, ordenado por prestígio em competições.</p>
      </div>
      <p class="foot-stat">${TOTAL_BR} marcas · ${FIELD_TOTAL} medalhas e distinções mapeadas</p>
    </div>
    <div class="foot-grid">
      <div>
        <h5>Como foi feito</h5>
        <p>Partimos da lista curada do <a href="https://chocolatrasonline.com.br/chocomarcas/" target="_blank" rel="noopener">Chócolatras Online</a> e enriquecemos cada marca com pesquisa multi-fonte. As premiações foram verificadas preferencialmente nas <strong>páginas oficiais das competições</strong> (ICA, Academy of Chocolate, AVPA, Cocoa of Excellence) e, quando indicado, na imprensa. Marcas sem prêmio verificável ficaram de fora; divergências de medalha estão sinalizadas (⚠) em cada ficha.</p>
      </div>
    </div>
    <p class="foot-credits">Curadoria e desenvolvimento por <strong>João Victor Daijó</strong>. Agradecimento especial a <strong>Zélia Frangioni</strong>, que mantém o <a href="https://chocolatrasonline.com.br/" target="_blank" rel="noopener">Chócolatras Online</a> — fonte e inspiração deste guia.</p>
    <p class="foot-date">Documento gerado em junho de 2026 · dados sujeitos a atualização a cada nova edição das competições.</p>
  </div>
</footer>
<script>
  // Expand all award lists for printing / PDF export, restore afterwards.
  var _opened = [];
  function _expand(){ _opened = []; document.querySelectorAll('details:not([open])').forEach(function(d){ d.open = true; _opened.push(d); }); }
  function _restore(){ _opened.forEach(function(d){ d.open = false; }); _opened = []; }
  window.addEventListener('beforeprint', _expand);
  window.addEventListener('afterprint', _restore);
  if (window.matchMedia){ var mq = window.matchMedia('print'); if (mq.addEventListener) mq.addEventListener('change', function(e){ e.matches ? _expand() : _restore(); }); }
  // Filter cards by competition; hide a whole section when nothing in it matches.
  document.querySelectorAll('.filterbar .fchip').forEach(function(btn){
    btn.addEventListener('click', function(){
      var f = btn.dataset.f, total = 0;
      document.querySelectorAll('.filterbar .fchip').forEach(function(b){ b.classList.toggle('on', b === btn); });
      document.querySelectorAll('.usection').forEach(function(sec){
        var any = false;
        sec.querySelectorAll('.card').forEach(function(c){
          var show = f === 'all' || (c.dataset.comps || '').split(' ').indexOf(f) >= 0;
          c.style.display = show ? '' : 'none'; if (show){ any = true; total++; }
        });
        sec.style.display = any ? '' : 'none';
      });
      var e = document.getElementById('empty'); if (e) e.hidden = total > 0;
    });
  });
</script>
</body>
</html>`;
}

// ---- Painéis compartilhados ----
const PANELS = `
  <div class="panel">
    <div class="two">
      <div>
        <h4>Reconhecimento de origem — Cocoa of Excellence 2025</h4>
        <p>Três produtores brasileiros de cacau entraram na lista <strong>Best 50</strong> mundial (são produtores de amêndoa, não marcas de barra):</p>
        <ul>${ORIGEM.map((o) => `<li>${esc(o)}</li>`).join('')}</ul>
      </div>
      <div>
        <h4>Menção honrosa</h4>
        <p><strong>Dengo Chocolates</strong> (SP, 2017) é uma das marcas brasileiras de maior visibilidade e impacto socioambiental, mas não localizamos medalha em competição de qualidade de chocolate (apenas prêmio de <em>design</em> de embalagem), por isso fica fora do ranking por premiações.</p>
      </div>
    </div>
  </div>`;

// Grades por seção (placements reiniciam por seção) — avaliadas após os helpers
let n1 = 0;
const sectionIcaMundial = `<div class="grid">${t1.map((m) => cardBr(m, ++n1)).join('\n')}</div>`;
let n2 = 0;
const sectionIcaAmericas = `<div class="grid">${t2.map((m) => cardBr(m, ++n2)).join('\n')}</div>`;
let ra = 0;
const sectionAoc = `<div class="grid">${AOC.map((m) => cardBr(m, ++ra)).join('\n')}</div>`;
let rv = 0;
const sectionAvpa = `<div class="grid">${AVPA.map((m) => cardBr(m, ++rv)).join('\n')}</div>`;
let rn = 0;
const sectionNac = `<div class="grid">${NACIONAL.map((m) => cardBr(m, ++rn)).join('\n')}</div>`;

// ---- Vista A: por competição (seções) + faixas de referência cruzada ----
const mainSectioned = `
  <div class="section-title"><h2>Seção 1 — International Chocolate Awards</h2><span class="count">${t1.length + t2.length} marcas · o circuito de maior prestígio</span></div>
  <p class="section-intro">O ICA é a principal competição internacional de chocolate fino. Aqui em dois níveis: medalhistas da <strong>final mundial</strong> e medalhistas da <strong>etapa das Américas</strong> (Latin America &amp; Caribbean). A numeração reinicia a cada nível.</p>
  <div class="tier-block">
    <div class="tier-head">
      <h3>Nível 1 — Final Mundial (ICA World Final)</h3>
      <p>Marcas que conquistaram medalha na <strong>final mundial</strong> do ICA — o ápice da competição, acessível apenas a quem já venceu uma etapa regional ou nacional. O sinal de prestígio de maior peso.</p>
    </div>
    ${sectionIcaMundial}
    ${crossStripHtml(reMundial, t1)}
  </div>
  <div class="tier-block">
    <div class="tier-head">
      <h3>Nível 2 — Etapa das Américas (ICA Americas)</h3>
      <p>Marcas premiadas na etapa <strong>regional das Américas</strong> (Latin America &amp; Caribbean) do ICA — incluindo pioneiras do bean-to-bar nacional. Prestígio internacional consolidado, um degrau abaixo da final mundial.</p>
    </div>
    ${sectionIcaAmericas}
    ${crossStripHtml(reAmericas, t2)}
  </div>

  <div class="section-title"><h2>Seção 2 — Academy of Chocolate</h2><span class="count">${AOC.length} marcas · Londres</span></div>
  <p class="section-intro">Uma das competições mais respeitadas do mundo, independente do ICA. Marcas brasileiras premiadas em Londres, ordenadas pela força da medalha (Prata &gt; Bronze) e pela amplitude de prêmios.</p>
  ${sectionAoc}
  ${crossStripHtml(reAoC, AOC)}
  <div class="panel">
    <h4>➕ Também reconhecida</h4>
    <p><strong>Velmont</strong> levou Prata na Academy of Chocolate 2025 (barra “52% ao Leite, Scavina — João Tavares”, com cacau premiado de Uruçuca/BA), mas não tem site nem identidade pública confirmada para uma ficha completa.</p>
  </div>

  <div class="section-title"><h2>Seção 3 — AVPA Paris</h2><span class="count">${AVPA.length} marcas · França</span></div>
  <p class="section-intro">O concurso “Chocolats transformés à l'origine” da AVPA (Paris) premia exclusivamente chocolates feitos nos <strong>países de origem do cacau</strong> — feito sob medida para marcas brasileiras de terroir.</p>
  ${sectionAvpa}
  ${crossStripHtml(reAvpa, AVPA)}

  <div class="section-title"><h2>Seção 4 — Prêmios nacionais</h2><span class="count">${NACIONAL.length} marcas · Bean to Bar Brasil &amp; CNA</span></div>
  <p class="section-intro">Ótimas marcas brasileiras cujo reconhecimento vem de <strong>competições nacionais de peso</strong> — sobretudo o Prêmio Bean to Bar Brasil e o CNA Brasil Artesanal. <em>Várias marcas das seções anteriores também têm prêmios nacionais — veja a faixa ao final.</em></p>
  ${sectionNac}
  ${crossStripHtml(reNac, NACIONAL)}
${PANELS}`;

// ---- Vista B: ranking em 2 grupos (internacional / nacional), mesma UI unificada ----
const isIntl = (m) => compsOf(m).some((k) => k === 'mundial' || k === 'americas' || k === 'aoc' || k === 'avpa');
const intlBrands = unifiedRanked.filter(isIntl);
const nacBrands = unifiedRanked.filter((m) => !isIntl(m));
let ri = 0, rnac = 0;
const mainUnified = `
  <p class="section-intro top">Todas as marcas brasileiras premiadas, em dois grupos — <strong>reconhecimento internacional</strong> e <strong>reconhecimento nacional</strong> —, cada um ordenado por um <strong>índice de prestígio</strong> que pondera a competição (ICA Mundial &gt; Américas e Academy of Chocolate &gt; AVPA) e o nível da medalha. Cada marca aparece uma única vez; use os filtros para recortar por competição.</p>
  <div class="filterbar" role="group" aria-label="Filtrar por competição">
    <button class="fchip on" data-f="all">Todas <b>${ALL_UNIQUE.length}</b></button>
    <button class="fchip" data-f="mundial">ICA Mundial</button>
    <button class="fchip" data-f="americas">ICA Américas</button>
    <button class="fchip" data-f="aoc">Academy of Chocolate</button>
    <button class="fchip" data-f="avpa">AVPA Paris</button>
    <button class="fchip" data-f="nacional">Nacional</button>
  </div>

  <div class="keybar">
    <div class="kb-legend">
      <span class="kb-it"><span class="disc g"></span>Ouro</span>
      <span class="kb-it"><span class="disc s"></span>Prata</span>
      <span class="kb-it"><span class="disc b"></span>Bronze</span>
      <span class="kb-it"><span class="disc o"></span>Distinção</span>
      <span class="kb-star">★ barra-assinatura</span>
    </div>
    <div class="kb-hier">Índice de prestígio: <b>ICA Mundial ×10 · Américas ×3,5 · Academy of Chocolate ×3 · AVPA Paris ×2,5 · nacional ×1,5</b></div>
    <details class="kb-calc">
      <summary>ver cálculo</summary>
      <div class="howto-body">
        <p>Cada marca recebe um <strong>índice</strong> = (melhor medalha × 10) + soma de todas as suas medalhas. Cada medalha vale <strong>peso da competição × peso do nível</strong>:</p>
        <div class="weights">
          <div class="wrow"><span class="wlabel">Competição</span><span class="ctag mundial">ICA Mundial ×10</span><span class="ctag americas">ICA Américas ×3,5</span><span class="ctag aoc">Academy of Chocolate ×3</span><span class="ctag avpa">AVPA Paris ×2,5</span><span class="ctag nacional">Nacional ×1,5</span></div>
          <div class="wrow"><span class="wlabel">Nível</span><span class="wpill"><span class="disc g"></span>Ouro 100</span><span class="wpill"><span class="disc s"></span>Prata 60</span><span class="wpill"><span class="disc b"></span>Bronze 30</span><span class="wpill"><span class="disc o"></span>Distinção 15</span></div>
        </div>
        <p class="howto-why">A <strong>final mundial do ICA</strong> reúne os vencedores de todas as etapas regionais do planeta — só entra quem já ganhou medalha numa etapa regional, então uma medalha lá vale muito mais. A etapa <strong>Américas</strong> do ICA leva leve vantagem sobre a Academy of Chocolate por ser mais seletiva e concentrar as melhores origens de cacau do mundo. A <strong>AVPA</strong> é restrita a chocolates feitos nos países de origem do cacau, o que a torna uma vitrine natural para o terroir brasileiro.</p>
      </div>
    </details>
  </div>

  <div class="primer-wrap">
    <p class="primer-h">As competições, em resumo</p>
    <p class="primer-sub">Onde essas marcas foram premiadas — e como cada ranking é montado.</p>
    <div class="primer">
      <div class="comp">
        <p class="comp-nm">ICA</p>
        <span class="comp-tag">a mais prestigiada · 2 etapas</span>
        <p class="comp-one">International Chocolate Awards: o circuito de maior peso. Tem a etapa regional das <strong>Américas</strong> e a <strong>final mundial</strong>.</p>
        <details>
          <summary>como funciona o ranking</summary>
          <div class="comp-more">Júri às cegas, em rodadas, com medalhas <b>Ouro / Prata / Bronze</b> por categoria. Quem vence na regional disputa a <b>final mundial</b>, que reúne os campeões do planeta — por isso uma medalha mundial pesa muito mais (×10) do que a regional (×3,5).</div>
        </details>
      </div>
      <div class="comp">
        <p class="comp-nm">Academy of Chocolate</p>
        <span class="comp-tag">Londres · independente</span>
        <p class="comp-one">Uma das competições mais respeitadas do mundo, sediada em <strong>Londres</strong> e independente do ICA.</p>
        <details>
          <summary>como funciona o ranking</summary>
          <div class="comp-more">Painel de especialistas avalia em <b>rodada única</b>, com medalhas Ouro / Prata / Bronze e o cobiçado <b>Golden Bean</b>. Forte ênfase em qualidade sensorial e em produção bean-to-bar.</div>
        </details>
      </div>
      <div class="comp">
        <p class="comp-nm">AVPA Paris</p>
        <span class="comp-tag">chocolates de origem</span>
        <p class="comp-one">Concurso parisiense que premia <strong>só chocolates feitos nos países de origem do cacau</strong> — vitrine natural para o terroir brasileiro.</p>
        <details>
          <summary>como funciona o ranking</summary>
          <div class="comp-more">Júri de profissionais em Paris concede prêmios <b>Gourmet</b> (Ouro / Prata / Bronze) por faixa. Por valorizar a transformação na origem, é uma vitrine natural para marcas brasileiras que fazem na fazenda.</div>
        </details>
      </div>
    </div>
  </div>

  <section class="usection">
    <div class="section-title"><h2>Reconhecimento internacional</h2><span class="count">${intlBrands.length} marcas · ICA, Academy of Chocolate &amp; AVPA</span></div>
    <p class="section-intro">Marcas com medalha em pelo menos uma competição internacional, ordenadas pelo índice de prestígio cruzado.</p>
    <div class="grid">${intlBrands.map((m) => cardBr(m, ++ri)).join('\n')}</div>
  </section>

  <section class="usection">
    <div class="section-title"><h2>Reconhecimento nacional</h2><span class="count">${nacBrands.length} marcas · Bean to Bar Brasil &amp; CNA</span></div>
    <p class="section-intro">Ótimas marcas cujo reconhecimento, até aqui, vem de <strong>competições nacionais</strong> — sem medalha internacional confirmada. Grandes nomes que merecem estar no mapa.</p>
    <div class="grid">${nacBrands.map((m) => cardBr(m, ++rnac)).join('\n')}</div>
  </section>

  <p class="empty" id="empty" hidden>Nenhuma marca premiada nesta competição.</p>

  <section class="faq-section">
    <div class="section-title"><h2>Glossário &amp; perguntas frequentes</h2></div>
    <p class="section-intro">Os termos que aparecem como tags em cada ficha, e respostas para as dúvidas mais comuns.</p>
    <div class="glossary">
      <div class="gterm"><span class="trait t-method">bean-to-bar</span><p>Do grão à barra: a marca compra amêndoas de cacau e controla todo o processo — torra, moagem, conchagem — até a barra.</p></div>
      <div class="gterm"><span class="trait t-method">tree-to-bar</span><p>Da árvore à barra: vai além do bean-to-bar — a marca também cultiva o próprio cacau, controlando desde a fazenda.</p></div>
      <div class="gterm"><span class="trait t-method">chocolatier</span><p>Parte de cobertura (couverture) já pronta para criar bombons, trufas e pralinés; não fabrica o chocolate a partir da amêndoa.</p></div>
      <div class="gterm"><span class="trait t-scale">micro-lote</span><p>Produção pequena e artesanal, em lotes reduzidos — o perfil da maioria das marcas finas.</p></div>
      <div class="gterm"><span class="trait t-scale">maior escala</span><p>Produção industrializada e de maior volume, com distribuição mais ampla.</p></div>
      <div class="gterm"><span class="trait t-extra">familiar</span> <span class="trait t-extra">vegana</span> <span class="trait t-extra">orgânica</span><p>Traços adicionais: negócio tocado por uma família; linha 100% vegetal; ou produção com certificação orgânica.</p></div>
    </div>
    <div class="faq">
      <details><summary>Como o ranking é calculado?</summary><p>Cada marca tem um <strong>índice de prestígio (pts)</strong> que pondera a competição e o nível da medalha. O cálculo completo, com todos os pesos, está na caixa “Como o índice é calculado” no topo da página.</p></details>
      <details><summary>O que são ICA, Academy of Chocolate e AVPA?</summary><p>São as principais competições de chocolate fino. O <strong>International Chocolate Awards (ICA)</strong> é a mais prestigiada e tem duas etapas: a regional (Américas) e a <strong>final mundial</strong>, que reúne os vencedores de todas as regiões do planeta — por isso pesa muito mais. A <strong>Academy of Chocolate</strong> (Londres) e a <strong>AVPA Paris</strong> são concursos internacionais de rodada única; a AVPA premia só chocolates feitos nos países de origem do cacau.</p></details>
      <details><summary>Por que algumas marcas têm “fonte: imprensa”?</summary><p>Quando a premiação foi confirmada em reportagem ou pela própria marca, mas não na página oficial da competição. As marcadas como “fonte: oficial” foram verificadas direto na lista de vencedores do concurso.</p></details>
      <details><summary>O que é a barra-assinatura (★)?</summary><p>É o chocolate de cada marca com o histórico de medalhas mais forte — em geral o que rendeu o prêmio de maior prestígio ou que venceu em mais de uma edição.</p></details>
      <details><summary>Por que uma marca aparece em “nacional” e não em “internacional”?</summary><p>A seção <strong>internacional</strong> reúne quem tem medalha em ao menos uma competição internacional (ICA, Academy of Chocolate ou AVPA). A seção <strong>nacional</strong> traz ótimas marcas cujo reconhecimento, até aqui, vem de concursos nacionais (Prêmio Bean to Bar Brasil, CNA).</p></details>
    </div>
  </section>

${PANELS}`;

void mainSectioned; // vista por competição mantida no código, mas não publicada
const out = path.join(__dirname, 'chocolates-brasileiros-premiados.html');
fs.writeFileSync(out, shell('Os Chocolates Brasileiros Mais Premiados', mainUnified, ''));

// Dump da lista de marcas + prêmios (insumo para verificação de prêmios)
const marcas = ALL_UNIQUE.map((m) => ({
  name: m.name, site: m.site, loc: m.loc || m.country || '',
  awards: (m.awards || []).map((a) => ({ c: a.c, y: a.y, l: a.l, p: a.p })),
}));
fs.writeFileSync(path.join(__dirname, 'marcas.json'), JSON.stringify(marcas, null, 2));

const kb = (fs.statSync(out).size / 1024).toFixed(0);
console.log(`OK -> ${out} (${kb} KB) · ${ALL_UNIQUE.length} marcas · marcas.json gravado`);
console.log(`ICA Mundial ${t1.length} · Américas ${t2.length} · AoC ${AOC.length} · AVPA ${AVPA.length} · Nacional ${NACIONAL.length}`);
