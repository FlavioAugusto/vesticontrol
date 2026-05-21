// Dataset completo de produtos fictícios — By Marcelo Medeiros
// Preço padrão: R$299,90 | 6x de R$49,98 sem juros | Tamanhos: P, M, G

export interface ProdutoFicticio {
  id: string; nome: string; slug: string; descricao: string;
  preco: number; preco_antigo: number | null;
  categoria_id: string; categoria: string; categoria_slug: string;
  badge: 'lancamento' | 'bestseller' | 'maisvendidos' | null;
  ativo: boolean; destaque: boolean; peso_gramas: number;
  imagens: { url: string; alt: string; principal: boolean }[];
  variantes: { tamanho: string; cor: string; cor_hex: string; foto_url?: string; estoque: number }[];
}

export const PRECO_PADRAO = 299.90;
export const PARCELAS = 6;
export const PARCELA_VALOR = parseFloat((PRECO_PADRAO / PARCELAS).toFixed(2)); // 49.98

export const CATEGORIAS_FICTICIAS = [
  { id: 'cat-1', nome: 'Vestidos Conjuntos', slug: 'conjuntos', descricao: 'Conjuntos coordenados de alta costura', imagem_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=750&fit=crop&q=85', ativo: true, ordem: 1 },
  { id: 'cat-2', nome: 'Vestidos Midi', slug: 'midi', descricao: 'Vestidos midi elegantes e versáteis', imagem_url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&h=750&fit=crop&q=85', ativo: true, ordem: 2 },
  { id: 'cat-3', nome: 'Vestidos Longos', slug: 'longos', descricao: 'Vestidos longos para ocasiões especiais', imagem_url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&h=750&fit=crop&q=85', ativo: true, ordem: 3 },
];

export const PRODUTOS_FICTICIOS: ProdutoFicticio[] = [
  {
    id: 'p-1', nome: 'Conjunto Elegância Dourada', slug: 'conjunto-elegancia-dourada',
    descricao: 'Conjunto sofisticado composto por calça pantalona e blazer estruturado em tecido crepe italiano. Acabamento com botões dourados e forro completo. Ideal para eventos e ocasiões especiais. Vendido apenas em conjunto.',
    preco: PRECO_PADRAO, preco_antigo: 399.90,
    categoria_id: 'cat-1', categoria: 'Vestidos Conjuntos', categoria_slug: 'conjuntos',
    badge: 'bestseller', ativo: true, destaque: true, peso_gramas: 600,
    imagens: [
      { url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1067&fit=crop&q=90', alt: 'Conjunto Elegância Dourada — frente', principal: true },
      { url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&h=1067&fit=crop&q=90', alt: 'Conjunto Elegância Dourada — detalhe', principal: false },
    ],
    variantes: [
      { tamanho: 'P', cor: 'Dourado', cor_hex: '#b89155', foto_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&h=267&fit=crop&q=80', estoque: 5 },
      { tamanho: 'M', cor: 'Dourado', cor_hex: '#b89155', foto_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&h=267&fit=crop&q=80', estoque: 8 },
      { tamanho: 'G', cor: 'Dourado', cor_hex: '#b89155', foto_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&h=267&fit=crop&q=80', estoque: 4 },
      { tamanho: 'P', cor: 'Preto', cor_hex: '#1e1a16', foto_url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=200&h=267&fit=crop&q=80', estoque: 4 },
      { tamanho: 'M', cor: 'Preto', cor_hex: '#1e1a16', foto_url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=200&h=267&fit=crop&q=80', estoque: 6 },
      { tamanho: 'G', cor: 'Preto', cor_hex: '#1e1a16', foto_url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=200&h=267&fit=crop&q=80', estoque: 3 },
    ],
  },
  {
    id: 'p-2', nome: 'Conjunto Seda Rosê', slug: 'conjunto-seda-rose',
    descricao: 'Conjunto de saia midi e blusa de seda natural com amarração frontal. Caimento fluido que valoriza todas as silhuetas. Tecido 100% seda natural importada. Disponível em rosê e nude.',
    preco: PRECO_PADRAO, preco_antigo: null,
    categoria_id: 'cat-1', categoria: 'Vestidos Conjuntos', categoria_slug: 'conjuntos',
    badge: 'lancamento', ativo: true, destaque: true, peso_gramas: 550,
    imagens: [
      { url: 'https://images.unsplash.com/photo-1496217590455-aa63a8350eea?w=800&h=1067&fit=crop&q=90', alt: 'Conjunto Seda Rosê — frente', principal: true },
      { url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&h=1067&fit=crop&q=90', alt: 'Conjunto Seda Rosê — detalhe', principal: false },
    ],
    variantes: [
      { tamanho: 'P', cor: 'Rosê', cor_hex: '#c4848c', foto_url: 'https://images.unsplash.com/photo-1496217590455-aa63a8350eea?w=200&h=267&fit=crop&q=80', estoque: 6 },
      { tamanho: 'M', cor: 'Rosê', cor_hex: '#c4848c', foto_url: 'https://images.unsplash.com/photo-1496217590455-aa63a8350eea?w=200&h=267&fit=crop&q=80', estoque: 8 },
      { tamanho: 'G', cor: 'Rosê', cor_hex: '#c4848c', foto_url: 'https://images.unsplash.com/photo-1496217590455-aa63a8350eea?w=200&h=267&fit=crop&q=80', estoque: 4 },
      { tamanho: 'P', cor: 'Nude', cor_hex: '#ece5da', foto_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=267&fit=crop&q=80', estoque: 5 },
      { tamanho: 'M', cor: 'Nude', cor_hex: '#ece5da', foto_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=267&fit=crop&q=80', estoque: 6 },
      { tamanho: 'G', cor: 'Nude', cor_hex: '#ece5da', foto_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=267&fit=crop&q=80', estoque: 3 },
    ],
  },
  {
    id: 'p-3', nome: 'Conjunto Alfaiataria Premium', slug: 'conjunto-alfaiataria-premium',
    descricao: 'Conjunto calça reta e blazer cropped em tecido de alfaiataria importado. Modelagem slim com forro completo. Perfeito para o ambiente corporativo e eventos sociais.',
    preco: PRECO_PADRAO, preco_antigo: null,
    categoria_id: 'cat-1', categoria: 'Vestidos Conjuntos', categoria_slug: 'conjuntos',
    badge: 'maisvendidos', ativo: true, destaque: true, peso_gramas: 700,
    imagens: [
      { url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&h=1067&fit=crop&q=90', alt: 'Conjunto Alfaiataria Premium — frente', principal: true },
    ],
    variantes: [
      { tamanho: 'P', cor: 'Preto', cor_hex: '#1e1a16', foto_url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=200&h=267&fit=crop&q=80', estoque: 4 },
      { tamanho: 'M', cor: 'Preto', cor_hex: '#1e1a16', foto_url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=200&h=267&fit=crop&q=80', estoque: 6 },
      { tamanho: 'G', cor: 'Preto', cor_hex: '#1e1a16', foto_url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=200&h=267&fit=crop&q=80', estoque: 4 },
      { tamanho: 'P', cor: 'Off White', cor_hex: '#faf9f7', foto_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&h=267&fit=crop&q=80', estoque: 3 },
      { tamanho: 'M', cor: 'Off White', cor_hex: '#faf9f7', foto_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&h=267&fit=crop&q=80', estoque: 4 },
      { tamanho: 'G', cor: 'Off White', cor_hex: '#faf9f7', foto_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&h=267&fit=crop&q=80', estoque: 2 },
    ],
  },
  {
    id: 'p-4', nome: 'Vestido Midi Floral Encanto', slug: 'vestido-midi-floral-encanto',
    descricao: 'Vestido midi em crepe com estampa floral exclusiva. Decote em V suave, manga longa bufante e saia evasê que valoriza o quadril. Forro completo em musseline.',
    preco: PRECO_PADRAO, preco_antigo: 399.90,
    categoria_id: 'cat-2', categoria: 'Vestidos Midi', categoria_slug: 'midi',
    badge: 'bestseller', ativo: true, destaque: true, peso_gramas: 450,
    imagens: [
      { url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&h=1067&fit=crop&q=90', alt: 'Vestido Midi Floral Encanto — frente', principal: true },
    ],
    variantes: [
      { tamanho: 'P', cor: 'Floral Verde', cor_hex: '#7a8c72', foto_url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=200&h=267&fit=crop&q=80', estoque: 8 },
      { tamanho: 'M', cor: 'Floral Verde', cor_hex: '#7a8c72', foto_url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=200&h=267&fit=crop&q=80', estoque: 10 },
      { tamanho: 'G', cor: 'Floral Verde', cor_hex: '#7a8c72', foto_url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=200&h=267&fit=crop&q=80', estoque: 6 },
    ],
  },
  {
    id: 'p-5', nome: 'Vestido Midi Linho Provençal', slug: 'vestido-midi-linho-provencal',
    descricao: 'Vestido midi em linho italiano com bordado artesanal na barra. Leveza e sofisticação para o dia a dia. Bolsos laterais funcionais.',
    preco: PRECO_PADRAO, preco_antigo: null,
    categoria_id: 'cat-2', categoria: 'Vestidos Midi', categoria_slug: 'midi',
    badge: 'lancamento', ativo: true, destaque: false, peso_gramas: 400,
    imagens: [
      { url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=1067&fit=crop&q=90', alt: 'Vestido Midi Linho Provençal', principal: true },
    ],
    variantes: [
      { tamanho: 'P', cor: 'Areia', cor_hex: '#f4efe8', foto_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=200&h=267&fit=crop&q=80', estoque: 7 },
      { tamanho: 'M', cor: 'Areia', cor_hex: '#f4efe8', foto_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=200&h=267&fit=crop&q=80', estoque: 9 },
      { tamanho: 'G', cor: 'Areia', cor_hex: '#f4efe8', foto_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=200&h=267&fit=crop&q=80', estoque: 5 },
    ],
  },
  {
    id: 'p-6', nome: 'Vestido Midi Cetim Noturno', slug: 'vestido-midi-cetim-noturno',
    descricao: 'Vestido midi em cetim com alças finas reguláveis e decote envelope. Caimento de alta costura que segue o corpo com elegância. Ideal para eventos noturnos.',
    preco: PRECO_PADRAO, preco_antigo: null,
    categoria_id: 'cat-2', categoria: 'Vestidos Midi', categoria_slug: 'midi',
    badge: null, ativo: true, destaque: true, peso_gramas: 380,
    imagens: [
      { url: 'https://images.unsplash.com/photo-1520903920468-04e5a41e4b50?w=800&h=1067&fit=crop&q=90', alt: 'Vestido Midi Cetim Noturno', principal: true },
    ],
    variantes: [
      { tamanho: 'P', cor: 'Preto', cor_hex: '#1e1a16', foto_url: 'https://images.unsplash.com/photo-1520903920468-04e5a41e4b50?w=200&h=267&fit=crop&q=80', estoque: 7 },
      { tamanho: 'M', cor: 'Preto', cor_hex: '#1e1a16', foto_url: 'https://images.unsplash.com/photo-1520903920468-04e5a41e4b50?w=200&h=267&fit=crop&q=80', estoque: 8 },
      { tamanho: 'G', cor: 'Preto', cor_hex: '#1e1a16', foto_url: 'https://images.unsplash.com/photo-1520903920468-04e5a41e4b50?w=200&h=267&fit=crop&q=80', estoque: 4 },
      { tamanho: 'P', cor: 'Borgonha', cor_hex: '#7a2030', foto_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=267&fit=crop&q=80', estoque: 4 },
      { tamanho: 'M', cor: 'Borgonha', cor_hex: '#7a2030', foto_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=267&fit=crop&q=80', estoque: 5 },
      { tamanho: 'G', cor: 'Borgonha', cor_hex: '#7a2030', foto_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=267&fit=crop&q=80', estoque: 3 },
    ],
  },
  {
    id: 'p-7', nome: 'Vestido Longo Gala Suprema', slug: 'vestido-longo-gala-suprema',
    descricao: 'Vestido longo com corpete estruturado em renda francesa e saia em tule multicamadas. Para ocasiões especiais — formaturas, casamentos e galas.',
    preco: PRECO_PADRAO, preco_antigo: 449.90,
    categoria_id: 'cat-3', categoria: 'Vestidos Longos', categoria_slug: 'longos',
    badge: 'bestseller', ativo: true, destaque: true, peso_gramas: 900,
    imagens: [
      { url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&h=1067&fit=crop&q=90', alt: 'Vestido Longo Gala Suprema', principal: true },
    ],
    variantes: [
      { tamanho: 'P', cor: 'Champagne', cor_hex: '#f3d99e', foto_url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=200&h=267&fit=crop&q=80', estoque: 3 },
      { tamanho: 'M', cor: 'Champagne', cor_hex: '#f3d99e', foto_url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=200&h=267&fit=crop&q=80', estoque: 4 },
      { tamanho: 'G', cor: 'Champagne', cor_hex: '#f3d99e', foto_url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=200&h=267&fit=crop&q=80', estoque: 2 },
      { tamanho: 'P', cor: 'Preto', cor_hex: '#1e1a16', foto_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=200&h=267&fit=crop&q=80', estoque: 3 },
      { tamanho: 'M', cor: 'Preto', cor_hex: '#1e1a16', foto_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=200&h=267&fit=crop&q=80', estoque: 4 },
    ],
  },
  {
    id: 'p-8', nome: 'Vestido Longo Viscose Boho', slug: 'vestido-longo-viscose-boho',
    descricao: 'Vestido longo em viscose estampada com decote transpassado e manga sino. Estilo boho-chic com cintura marcada por cinto incluso.',
    preco: PRECO_PADRAO, preco_antigo: null,
    categoria_id: 'cat-3', categoria: 'Vestidos Longos', categoria_slug: 'longos',
    badge: 'lancamento', ativo: true, destaque: true, peso_gramas: 480,
    imagens: [
      { url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&h=1067&fit=crop&q=90', alt: 'Vestido Longo Viscose Boho', principal: true },
    ],
    variantes: [
      { tamanho: 'P', cor: 'Verde Estampado', cor_hex: '#7a8c72', foto_url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=200&h=267&fit=crop&q=80', estoque: 8 },
      { tamanho: 'M', cor: 'Verde Estampado', cor_hex: '#7a8c72', foto_url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=200&h=267&fit=crop&q=80', estoque: 10 },
      { tamanho: 'G', cor: 'Verde Estampado', cor_hex: '#7a8c72', foto_url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=200&h=267&fit=crop&q=80', estoque: 6 },
    ],
  },
  {
    id: 'p-9', nome: 'Vestido Longo Festa Exclusivo', slug: 'vestido-longo-festa-exclusivo',
    descricao: 'Vestido longo em mikado de seda com pedraria na cintura. Saia com fenda lateral discreta. Peça exclusiva com produção limitada.',
    preco: PRECO_PADRAO, preco_antigo: null,
    categoria_id: 'cat-3', categoria: 'Vestidos Longos', categoria_slug: 'longos',
    badge: 'maisvendidos', ativo: true, destaque: true, peso_gramas: 1100,
    imagens: [
      { url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=1067&fit=crop&q=90', alt: 'Vestido Longo Festa Exclusivo', principal: true },
    ],
    variantes: [
      { tamanho: 'P', cor: 'Vinho', cor_hex: '#7a2030', foto_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=200&h=267&fit=crop&q=80', estoque: 2 },
      { tamanho: 'M', cor: 'Vinho', cor_hex: '#7a2030', foto_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=200&h=267&fit=crop&q=80', estoque: 3 },
      { tamanho: 'G', cor: 'Vinho', cor_hex: '#7a2030', foto_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=200&h=267&fit=crop&q=80', estoque: 2 },
      { tamanho: 'P', cor: 'Safira', cor_hex: '#1a2a5e', foto_url: 'https://images.unsplash.com/photo-1520903920468-04e5a41e4b50?w=200&h=267&fit=crop&q=80', estoque: 2 },
      { tamanho: 'M', cor: 'Safira', cor_hex: '#1a2a5e', foto_url: 'https://images.unsplash.com/photo-1520903920468-04e5a41e4b50?w=200&h=267&fit=crop&q=80', estoque: 3 },
    ],
  },
  {
    id: 'p-10', nome: 'Vestido Midi Casual Chic', slug: 'vestido-midi-casual-chic',
    descricao: 'Vestido midi em malha canelada premium com decote ciganinha e manga bufante. Versátil para o dia a dia ou noite.',
    preco: PRECO_PADRAO, preco_antigo: 399.90,
    categoria_id: 'cat-2', categoria: 'Vestidos Midi', categoria_slug: 'midi',
    badge: 'bestseller', ativo: true, destaque: false, peso_gramas: 350,
    imagens: [
      { url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&h=1067&fit=crop&q=90', alt: 'Vestido Midi Casual Chic', principal: true },
    ],
    variantes: [
      { tamanho: 'P', cor: 'Rosa Antigo', cor_hex: '#c4848c', foto_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=267&fit=crop&q=80', estoque: 9 },
      { tamanho: 'M', cor: 'Rosa Antigo', cor_hex: '#c4848c', foto_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=267&fit=crop&q=80', estoque: 12 },
      { tamanho: 'G', cor: 'Rosa Antigo', cor_hex: '#c4848c', foto_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=267&fit=crop&q=80', estoque: 7 },
      { tamanho: 'P', cor: 'Preto', cor_hex: '#1e1a16', foto_url: 'https://images.unsplash.com/photo-1520903920468-04e5a41e4b50?w=200&h=267&fit=crop&q=80', estoque: 7 },
      { tamanho: 'M', cor: 'Preto', cor_hex: '#1e1a16', foto_url: 'https://images.unsplash.com/photo-1520903920468-04e5a41e4b50?w=200&h=267&fit=crop&q=80', estoque: 9 },
      { tamanho: 'G', cor: 'Preto', cor_hex: '#1e1a16', foto_url: 'https://images.unsplash.com/photo-1520903920468-04e5a41e4b50?w=200&h=267&fit=crop&q=80', estoque: 5 },
    ],
  },
];

export function getProdutoBySlug(slug: string) { return PRODUTOS_FICTICIOS.find((p) => p.slug === slug) ?? null; }
export function getProdutosByCategoria(slugCategoria: string) { return PRODUTOS_FICTICIOS.filter((p) => p.categoria_slug === slugCategoria); }
export function getProdutosDestaque() { return PRODUTOS_FICTICIOS.filter((p) => p.destaque); }
export function getProdutosRelacionados(slug: string, categoriaSlug: string) {
  return PRODUTOS_FICTICIOS.filter((p) => p.slug !== slug && p.categoria_slug === categoriaSlug).slice(0, 4);
}
