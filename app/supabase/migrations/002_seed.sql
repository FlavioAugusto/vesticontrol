-- Dados iniciais — Cole APÓS o 001_schema.sql

INSERT INTO categorias (nome, slug, descricao, ordem) VALUES
  ('Vestidos Conjuntos', 'conjuntos', 'Conjuntos coordenados de alta costura', 1),
  ('Vestidos Midi', 'midi', 'Vestidos midi elegantes e versáteis', 2),
  ('Vestidos Longos', 'longos', 'Vestidos longos para ocasiões especiais', 3);

INSERT INTO configuracoes (chave, valor, grupo) VALUES
  ('loja_nome', 'By Marcelo Medeiros', 'loja'),
  ('loja_cnpj', '00.000.000/0001-00', 'loja'),
  ('loja_email', 'contato@bymarcelomedeiros.com.br', 'loja'),
  ('loja_whatsapp', '81999999999', 'loja'),
  ('loja_instagram', '@bymarcelomedeiros', 'loja'),
  ('loja_cep_origem', '55000-000', 'frete'),
  ('frete_gratis_minimo', '399.00', 'frete'),
  ('parcelas_sem_juros', '12', 'pagamento'),
  ('mercadopago_ativo', 'true', 'pagamento'),
  ('infinitepay_ativo', 'true', 'pagamento'),
  ('melhorenvio_ativo', 'true', 'frete');
