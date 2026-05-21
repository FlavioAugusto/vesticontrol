-- ════════════════════════════════════════════════════════════════
-- RESTAURAR TODOS OS DADOS DA BY MARCELO MEDEIROS
-- Versão sem mexer na tabela lojas (já existe)
-- ════════════════════════════════════════════════════════════════

DO $$
DECLARE LOJA_BM UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Restaura TODAS as configs (força update com ON CONFLICT)
  INSERT INTO configuracoes (chave, valor, tipo, grupo, loja_id) VALUES
    -- IDENTIDADE
    ('loja_nome',                'By Marcelo Medeiros',                          'text', 'loja',     LOJA_BM),
    ('loja_email',               'contato@bymarcelomedeiros.com.br',             'text', 'loja',     LOJA_BM),
    ('loja_cnpj',                '48.065.930/0001-50',                           'text', 'loja',     LOJA_BM),

    -- CONTATO
    ('loja_telefone',            '(81) 99422-8240',                              'text', 'contato',  LOJA_BM),
    ('loja_whatsapp',            '81994228240',                                  'text', 'contato',  LOJA_BM),
    ('loja_instagram',           '@by.marcelomedeiros',                          'text', 'contato',  LOJA_BM),
    ('loja_horario_atendimento', 'Seg–Sex: 09:00–18:00',                         'text', 'contato',  LOJA_BM),

    -- TOPBAR
    ('topbar_texto',             'FRETE GRÁTIS ACIMA DE R$497,00',               'text', 'topbar',   LOJA_BM),
    ('topbar_ativo',             'true',                                         'text', 'topbar',   LOJA_BM),

    -- FRETE
    ('loja_cep_origem',          '55002-000',                                    'text', 'frete',    LOJA_BM),
    ('frete_gratis_minimo',      '497.00',                                       'text', 'frete',    LOJA_BM),
    ('melhorenvio_ativo',        'true',                                         'text', 'frete',    LOJA_BM),
    ('correios_ativo',           'true',                                         'text', 'frete',    LOJA_BM),

    -- PAGAMENTO
    ('parcelas_sem_juros',       '6',                                            'text', 'pagamento', LOJA_BM),
    ('desconto_pix_pct',         '10',                                           'text', 'pagamento', LOJA_BM),
    ('pagamento_pix_desconto',   '10',                                           'text', 'pagamento', LOJA_BM),
    ('pix_ativo',                'true',                                         'text', 'pagamento', LOJA_BM),
    ('boleto_ativo',             'true',                                         'text', 'pagamento', LOJA_BM),
    ('mercadopago_ativo',        'false',                                        'text', 'pagamento', LOJA_BM),
    ('infinitepay_ativo',        'true',                                         'text', 'pagamento', LOJA_BM),
    ('infinitepay_handle',       'bymarcelomedeiros',                            'text', 'pagamento', LOJA_BM),

    -- RODAPÉ
    ('rodape_texto',             'Moda feminina autoral, com peças exclusivas e atendimento personalizado.', 'text', 'rodape', LOJA_BM),
    ('rodape_endereco',          'Caruaru/PE',                                   'text', 'rodape',   LOJA_BM),
    ('rodape_rua',               'Caruaru, PE',                                  'text', 'rodape',   LOJA_BM),
    ('rodape_cnpj',              '48.065.930/0001-50',                           'text', 'rodape',   LOJA_BM),
    ('rodape_horario',           'Seg–Sex: 09:00–18:00',                         'text', 'rodape',   LOJA_BM),
    ('rodape_credito',           '© 2026 By Marcelo Medeiros. Todos os direitos reservados.', 'text', 'rodape', LOJA_BM),

    -- SEO
    ('seo_titulo',               'By Marcelo Medeiros — Moda Feminina Premium',  'text', 'seo',      LOJA_BM),
    ('seo_descricao',            'Loja oficial By Marcelo Medeiros. Vestidos, conjuntos e peças autorais de moda feminina.', 'text', 'seo', LOJA_BM)
  ON CONFLICT (chave, loja_id) DO UPDATE
    SET valor = EXCLUDED.valor, updated_at = now();

  -- Garante que a loja tem os dados básicos atualizados (sem mexer em colunas obrigatórias)
  UPDATE lojas
  SET nome = 'By Marcelo Medeiros',
      slug = 'bymarcelomedeiros',
      dominio = 'bymarcelomedeiros.com.br',
      ativo = true,
      updated_at = now()
  WHERE id = LOJA_BM;

  RAISE NOTICE 'Configurações restauradas com SUCESSO!';
END $$;

-- Verificação: lista as 27 chaves que devem estar preenchidas
SELECT grupo, chave, valor FROM configuracoes
WHERE loja_id = '00000000-0000-0000-0000-000000000001'
ORDER BY grupo, chave;
