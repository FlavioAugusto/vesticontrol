// Lê configurações do Supabase com fallback para valores padrão
// Usado em Server Components para sempre buscar dados frescos
// IMPORTANT: Multi-tenant — filtra por loja_id baseado no header `x-loja-id`

import { getLojaId } from '@/lib/tenant';

// DEFAULTS são genéricos — usados quando uma loja nova não tem configs ainda.
// Devem ser NEUTROS, sem nome ou identidade de loja específica.
const DEFAULTS: Record<string, string> = {
  loja_nome:              'Sua Loja',
  loja_logo_url:          '',
  loja_favicon_url:       '/favicon.ico',
  topbar_texto:           '',
  topbar_ativo:           'false',
  loja_email:             '',
  loja_whatsapp:          '',
  loja_instagram:         '',
  loja_cep_origem:        '',
  frete_gratis_minimo:    '0',
  melhorenvio_ativo:      'false',
  parcelas_sem_juros:     '1',
  mercadopago_ativo:      'false',
  infinitepay_ativo:      'false',
  rodape_texto:           '',
  rodape_endereco:        '',
  rodape_horario:         '',
  seo_titulo:             '',
  seo_descricao:          '',
  loja_telefone:          '',
  loja_horario_atendimento: '',
  rodape_rua:             '',
  rodape_cnpj:            '',
  rodape_credito:         '',
  modal_privacidade:      '',
  modal_termos:           '',
  modal_pagamento:        '',
  modal_frete:            '',
  modal_tamanhos:         '',
  modal_trocas:           '',
};

// 🔐 Chaves SENSÍVEIS que NUNCA podem ir pro frontend público (storefront)
// Estas só são acessíveis via APIs server-side autenticadas (admin/super_admin)
const CHAVES_SENSIVEIS = [
  'melhorenvio_token',
  'mercadopago_access_token',
  'mercadopago_public_key',
  'infinitepay_client_secret',
  'webhook_secret',
  'admin_password',
  'smtp_password',
  'api_key',
];

/**
 * Retorna todas as configurações da loja atual (detectada pelo middleware).
 * Multi-tenant: filtra por loja_id automaticamente.
 * 🔐 REMOVE chaves sensíveis automaticamente (tokens, secrets, etc).
 */
export async function getConfiguracoes(lojaIdOverride?: string): Promise<Record<string, string>> {
  try {
    const lojaId = lojaIdOverride || getLojaId();
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = createClient();
    const { data } = await supabase
      .from('configuracoes')
      .select('chave, valor')
      .eq('loja_id', lojaId);

    if (!data || data.length === 0) return { ...DEFAULTS };

    const result = { ...DEFAULTS };
    data.forEach((r: { chave: string; valor: string | null }) => {
      // 🔐 Bloqueia chaves sensíveis de aparecer no frontend
      if (CHAVES_SENSIVEIS.some(s => r.chave.toLowerCase().includes(s))) return;
      if (r.valor) result[r.chave] = r.valor;
    });
    return result;
  } catch {
    return { ...DEFAULTS };
  }
}

export async function getConfig(chave: string, lojaIdOverride?: string): Promise<string> {
  const configs = await getConfiguracoes(lojaIdOverride);
  return configs[chave] ?? DEFAULTS[chave] ?? '';
}
