-- ═══════════════════════════════════════════════════════════════════
-- Preencher dados completos da By Marcelo Medeiros nas configurações
-- Rodar UMA VEZ no Supabase SQL Editor após o deploy
-- ═══════════════════════════════════════════════════════════════════

-- Loja By Marcelo Medeiros (id padrão)
DO $$
DECLARE
  LOJA_BM UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Identidade
  INSERT INTO configuracoes (chave, valor, tipo, grupo, loja_id) VALUES
    ('loja_nome',                'By Marcelo Medeiros',                  'text', 'loja',     LOJA_BM),
    ('loja_email',               'contato@bymarcelomedeiros.com.br',     'text', 'loja',     LOJA_BM),
    ('loja_cnpj',                '48.065.930/0001-50',                   'text', 'loja',     LOJA_BM),
    ('loja_telefone',            '(81) 99422-8240',                      'text', 'contato',  LOJA_BM),
    ('loja_whatsapp',            '81994228240',                          'text', 'contato',  LOJA_BM),
    ('loja_instagram',           '@by.marcelomedeiros',                  'text', 'contato',  LOJA_BM),
    ('loja_horario_atendimento', 'Seg–Sex: 09:00–18:00',                 'text', 'contato',  LOJA_BM),

    -- Rodapé (usado nos modais de Política/Termos)
    ('rodape_cnpj',              '48.065.930/0001-50',                   'text', 'rodape',   LOJA_BM),
    ('rodape_endereco',          'Caruaru/PE',                            'text', 'rodape',   LOJA_BM),
    ('rodape_rua',               'Caruaru, PE',                          'text', 'rodape',   LOJA_BM),
    ('rodape_horario',           'Seg–Sex: 09:00–18:00',                 'text', 'rodape',   LOJA_BM),
    ('rodape_credito',           '© 2026 By Marcelo Medeiros. Todos os direitos reservados.', 'text', 'rodape', LOJA_BM),
    ('rodape_texto',             'Moda feminina autoral, com peças exclusivas e atendimento personalizado.', 'text', 'rodape', LOJA_BM)
  ON CONFLICT (chave, loja_id) DO UPDATE
    SET valor = EXCLUDED.valor,
        updated_at = now();

  RAISE NOTICE 'Configurações da By Marcelo Medeiros atualizadas com sucesso!';
END $$;

-- Verificação
SELECT chave, valor FROM configuracoes
WHERE loja_id = '00000000-0000-0000-0000-000000000001'
  AND chave IN ('loja_nome', 'loja_cnpj', 'rodape_cnpj', 'rodape_endereco', 'loja_email', 'loja_whatsapp', 'loja_instagram')
ORDER BY chave;
