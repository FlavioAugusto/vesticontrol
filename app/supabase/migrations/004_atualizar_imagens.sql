-- ═══════════════════════════════════════════════════════
-- ATUALIZAR IMAGENS DOS PRODUTOS — By Marcelo Medeiros
-- Cole no SQL Editor do Supabase APÓS rodar 003
-- Imagens: IA gerada (produtos 1) + Unsplash fashion editorial
-- ═══════════════════════════════════════════════════════

-- Produto 1 — Conjunto Elegância Dourada (IA gerada)
UPDATE produto_imagens
SET url = 'https://d8j0ntlcm91z4.cloudfront.net/user_3DHRUQ4PwOtvFPyqMw2arRUZ1Cx/hf_20260507_021859_7fbe50ed-9ed3-45bf-bd67-c1dffe8be5c5.png',
    alt = 'Conjunto Elegância Dourada — By Marcelo Medeiros'
WHERE produto_id = (SELECT id FROM produtos WHERE slug = 'conjunto-elegancia-dourada' LIMIT 1);

-- Produto 2 — Conjunto Seda Rosê
UPDATE produto_imagens
SET url = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=800&fit=crop&q=85',
    alt = 'Conjunto Seda Rosê — By Marcelo Medeiros'
WHERE produto_id = (SELECT id FROM produtos WHERE slug = 'conjunto-seda-rose' LIMIT 1);

-- Produto 3 — Conjunto Alfaiataria Premium
UPDATE produto_imagens
SET url = 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&h=800&fit=crop&q=85',
    alt = 'Conjunto Alfaiataria Premium — By Marcelo Medeiros'
WHERE produto_id = (SELECT id FROM produtos WHERE slug = 'conjunto-alfaiataria-premium' LIMIT 1);

-- Produto 4 — Vestido Midi Floral Encanto
UPDATE produto_imagens
SET url = 'https://images.unsplash.com/photo-1496217590455-aa63a8350eea?w=600&h=800&fit=crop&q=85',
    alt = 'Vestido Midi Floral Encanto — By Marcelo Medeiros'
WHERE produto_id = (SELECT id FROM produtos WHERE slug = 'vestido-midi-floral-encanto' LIMIT 1);

-- Produto 5 — Vestido Midi Linho Provençal
UPDATE produto_imagens
SET url = 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&h=800&fit=crop&q=85',
    alt = 'Vestido Midi Linho Provençal — By Marcelo Medeiros'
WHERE produto_id = (SELECT id FROM produtos WHERE slug = 'vestido-midi-linho-provencal' LIMIT 1);

-- Produto 6 — Vestido Midi Cetim Noturno
UPDATE produto_imagens
SET url = 'https://images.unsplash.com/photo-1558171813-0c5c3f93e843?w=600&h=800&fit=crop&q=85',
    alt = 'Vestido Midi Cetim Noturno — By Marcelo Medeiros'
WHERE produto_id = (SELECT id FROM produtos WHERE slug = 'vestido-midi-cetim-noturno' LIMIT 1);

-- Produto 7 — Vestido Longo Gala Suprema
UPDATE produto_imagens
SET url = 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&h=800&fit=crop&q=85',
    alt = 'Vestido Longo Gala Suprema — By Marcelo Medeiros'
WHERE produto_id = (SELECT id FROM produtos WHERE slug = 'vestido-longo-gala-suprema' LIMIT 1);

-- Produto 8 — Vestido Longo Viscose Boho
UPDATE produto_imagens
SET url = 'https://images.unsplash.com/photo-1583846578191-27ac42f09d5e?w=600&h=800&fit=crop&q=85',
    alt = 'Vestido Longo Viscose Boho — By Marcelo Medeiros'
WHERE produto_id = (SELECT id FROM produtos WHERE slug = 'vestido-longo-viscose-boho' LIMIT 1);

-- Produto 9 — Vestido Longo Festa Exclusivo
UPDATE produto_imagens
SET url = 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&h=800&fit=crop&q=85',
    alt = 'Vestido Longo Festa Exclusivo — By Marcelo Medeiros'
WHERE produto_id = (SELECT id FROM produtos WHERE slug = 'vestido-longo-festa-exclusivo' LIMIT 1);

-- Produto 10 — Vestido Midi Casual Chic
UPDATE produto_imagens
SET url = 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop&q=85',
    alt = 'Vestido Midi Casual Chic — By Marcelo Medeiros'
WHERE produto_id = (SELECT id FROM produtos WHERE slug = 'vestido-midi-casual-chic' LIMIT 1);

-- Adicionar imagem secundária (hover) para cada produto
-- Produto 1 (segunda imagem — efeito hover no card)
INSERT INTO produto_imagens (produto_id, url, alt, ordem, principal)
SELECT id,
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&h=800&fit=crop&q=85',
  'Conjunto Elegância Dourada detalhe',
  1, false
FROM produtos WHERE slug = 'conjunto-elegancia-dourada'
ON CONFLICT DO NOTHING;

-- Permitir imagens Unsplash no Next.js
-- (já configurado no next.config.js — adicione images.unsplash.com se necessário)

SELECT
  p.nome,
  pi.url,
  pi.principal
FROM produtos p
JOIN produto_imagens pi ON pi.produto_id = p.id
ORDER BY p.nome, pi.ordem;
