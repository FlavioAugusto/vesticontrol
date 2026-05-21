import { getLojaId } from '@/lib/tenant';
import TopBarDinamico from '@/components/layout/TopBarDinamico';
import FooterDinamico from '@/components/layout/FooterDinamico';
import ShopClientLayout from '@/components/layout/ShopClientLayout';
import BotoesFlutuantes from '@/components/layout/BotoesFlutuantes';
import CookieBanner from '@/components/layout/CookieBanner';
import HeroDinamico from '@/components/shop/HeroDinamico';
import TrustBarDinamico from '@/components/shop/TrustBarDinamico';
import SecaoCategorias from '@/components/shop/SecaoCategorias';
import SecaoDestaques from '@/components/shop/SecaoDestaques';
import BannerPromocionalDinamico from '@/components/shop/BannerPromocionalDinamico';
import QuemSomosDinamico from '@/components/shop/QuemSomosDinamico';
import Depoimentos from '@/components/shop/Depoimentos';
import type { Depoimento } from '@/components/shop/Depoimentos';
import Afiliados from '@/components/shop/Afiliados';
import RodapeMapaGoogle from '@/components/shop/RodapeMapaGoogle';

export const dynamic = 'force-dynamic';

async function getAll(lojaId: string) {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const s = createClient();
    const { data } = await s.from('configuracoes').select('chave, valor').eq('loja_id', lojaId);
    const c: Record<string, string> = {};
    (data ?? []).forEach((r: { chave: string; valor: string | null }) => { c[r.chave] = r.valor ?? ''; });
    return c;
  } catch { return {}; }
}

async function getDestaques(lojaId: string) {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const s = createClient();
    const { data } = await s.from('produtos')
      .select('id, nome, slug, preco, preco_antigo, badge, categorias(nome), produto_imagens(url, principal), produto_variantes(id, tamanho, cor, estoque)')
      .eq('loja_id', lojaId)
      .eq('ativo', true)
      .eq('destaque', true)
      .order('created_at', { ascending: false }).limit(8);
    return data ?? [];
  } catch { return []; }
}

async function getCategorias(lojaId: string) {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const s = createClient();
    const { data } = await s.from('categorias')
      .select('nome, slug')
      .eq('loja_id', lojaId)
      .eq('ativo', true)
      .order('ordem');
    return (data ?? []) as { nome: string; slug: string }[];
  } catch { return []; }
}

async function getDepoimentos(lojaId: string): Promise<Depoimento[] | null> {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const s = createClient();
    const { data } = await s.from('configuracoes').select('valor').eq('chave', 'depoimentos').eq('loja_id', lojaId).maybeSingle();
    if (data?.valor) return JSON.parse(data.valor) as Depoimento[];
    return null;
  } catch { return null; }
}

function safeJson<T>(str: string | undefined, fallback: T): T {
  try { return str ? JSON.parse(str) as T : fallback; } catch { return fallback; }
}

export default async function HomePage() {
  const lojaId = getLojaId();
  const configs = await getAll(lojaId);
  const [destaques, depoimentos, categoriasMenu] = await Promise.all([
    getDestaques(lojaId),
    getDepoimentos(lojaId),
    getCategorias(lojaId),
  ]);

  // Extrair configs das seções
  const heroSlides = safeJson(configs.hero_slides, []);
  const trustItems = safeJson(configs.trustbar_items, []);
  const bannersPromo = safeJson(configs.banners_promocionais, []);

  // Helper de visibilidade (default: true)
  const visivel = (k: string) => configs[k] !== 'false';

  return (
    <>
      <TopBarDinamico texto={configs.topbar_texto || ''} ativo={configs.topbar_texto ? configs.topbar_ativo !== 'false' : false} />
      <ShopClientLayout logoUrl={configs.loja_logo_url} nomeLoja={configs.loja_nome} categorias={categoriasMenu}>
        <main>
          {visivel('secao_hero_ativo') && <HeroDinamico slides={heroSlides} />}
          {visivel('secao_trustbar_ativo') && <TrustBarDinamico items={trustItems} />}

          {/* Explore nossas coleções */}
          {visivel('secao_categorias_ativo') && (
            <SecaoCategorias
              titulo={configs.secao_colecoes_titulo || 'Nossas Coleções'}
              subtitulo={configs.secao_colecoes_subtitulo || 'EXPLORE'}
              categoriasConfig={{
                conjuntos: configs.cat_img_conjuntos,
                midi: configs.cat_img_midi,
                longos: configs.cat_img_longos,
              }}
              categoriasAtivas={{
                conjuntos: configs.cat_ativo_conjuntos !== 'false',
                midi: configs.cat_ativo_midi !== 'false',
                longos: configs.cat_ativo_longos !== 'false',
              }}
              categoriasNomes={{
                conjuntos: configs.cat_nome_conjuntos,
                midi: configs.cat_nome_midi,
                longos: configs.cat_nome_longos,
              }}
              categoriasSubs={{
                conjuntos: configs.cat_sub_conjuntos,
                midi: configs.cat_sub_midi,
                longos: configs.cat_sub_longos,
              }}
              categoriasMostrarSub={{
                conjuntos: configs.cat_mostrar_sub_conjuntos !== 'false',
                midi: configs.cat_mostrar_sub_midi !== 'false',
                longos: configs.cat_mostrar_sub_longos !== 'false',
              }}
              categoriasDescs={{
                conjuntos: configs.cat_desc_conjuntos,
                midi: configs.cat_desc_midi,
                longos: configs.cat_desc_longos,
              }}
              categoriasMostrarDesc={{
                conjuntos: configs.cat_mostrar_desc_conjuntos !== 'false',
                midi: configs.cat_mostrar_desc_midi !== 'false',
                longos: configs.cat_mostrar_desc_longos !== 'false',
              }}
              categoriasCtas={{
                conjuntos: configs.cat_cta_conjuntos,
                midi: configs.cat_cta_midi,
                longos: configs.cat_cta_longos,
              }}
            />
          )}

          {/* Destaques */}
          {visivel('secao_destaques_ativo') && (
            <SecaoDestaques
              titulo={configs.secao_destaques_titulo || 'Destaques da Coleção'}
              subtitulo={configs.secao_destaques_subtitulo || 'SELECIONADOS PARA VOCÊ'}
              btnTexto={configs.secao_destaques_btn || 'Ver Coleção Completa'}
              btnLink={configs.secao_destaques_btn_link || '/produtos'}
              produtos={destaques}
            />
          )}

          {/* Banners promocionais */}
          {visivel('secao_banners_promo_ativo') && <BannerPromocionalDinamico banners={bannersPromo} />}

          {/* Quem somos — só renderiza se a loja tem TÍTULO ou HISTÓRIA configurado */}
          {visivel('secao_quem_somos_ativo') && (configs.quemsomos_titulo || configs.quemsomos_historia) && (
            <QuemSomosDinamico
              subtitulo={configs.quemsomos_subtitulo}
              titulo={configs.quemsomos_titulo}
              descricao={configs.quemsomos_descricao}
              historia={configs.quemsomos_historia}
              btn={configs.quemsomos_btn}
              imagem={configs.quemsomos_imagem}
              nomeLoja={configs.loja_nome}
            />
          )}

          {/* Depoimentos — só renderiza se a loja tem depoimentos */}
          {visivel('secao_depoimentos_ativo') && depoimentos && depoimentos.length > 0 && (
            <Depoimentos
              depoimentos={depoimentos}
              titulo={configs.secao_depoimentos_titulo}
              subtitulo={configs.secao_depoimentos_subtitulo}
              descricao={configs.secao_depoimentos_desc}
            />
          )}

          {/* Programa de Afiliados — só renderiza se a loja configurou */}
          {visivel('secao_afiliados_ativo') && configs.afiliados_titulo && (
            <Afiliados
              titulo={configs.afiliados_titulo}
              subtitulo={configs.afiliados_subtitulo}
              descricao={configs.afiliados_descricao}
              btnTexto={configs.afiliados_btn}
              whatsapp={configs.loja_whatsapp || ''}
              whatsappMensagem={configs.afiliados_whatsapp_mensagem}
              beneficios={safeJson(configs.afiliados_beneficios, undefined)}
              regulamentoTitulo={configs.afiliados_regulamento_titulo}
              regulamento={configs.afiliados_regulamento}
              imagemFundo={configs.afiliados_imagem_fundo}
            />
          )}

          {/* Mapa Google (se configurado URL OU endereço) */}
          {visivel('secao_mapa_ativo') && (configs.rodape_mapa_url || configs.rodape_mapa_endereco) && (
            <RodapeMapaGoogle
              titulo={configs.rodape_mapa_titulo}
              url={configs.rodape_mapa_url || ''}
              endereco={configs.rodape_mapa_endereco}
            />
          )}
        </main>
      </ShopClientLayout>
      <FooterDinamico
        nomeLoja={configs.loja_nome || 'By Marcelo Medeiros'}
        logoUrl={configs.loja_logo_url || '/images/logo.svg'}
        email={configs.loja_email || 'contato@bymarcelomedeiros.com.br'}
        whatsapp={configs.loja_whatsapp || '81994228240'}
        instagram={configs.loja_instagram || '@by.marcelomedeiros'}
        rodapeTexto={configs.rodape_texto || ''}
        rodapeEndereco={configs.rodape_endereco || ''}
        rodapeHorario={configs.rodape_horario || ''}
        rodapeRua={configs.rodape_rua}
        rodapeCnpj={configs.rodape_cnpj}
        rodapeCredito={configs.rodape_credito}
        modalPrivacidade={configs.modal_privacidade}
        modalTermos={configs.modal_termos}
        modalPagamento={configs.modal_pagamento}
        modalFrete={configs.modal_frete}
        modalTamanhos={configs.modal_tamanhos}
        modalTrocas={configs.modal_trocas}
      />
      <CookieBanner />
      <BotoesFlutuantes
        whatsapp={configs.loja_whatsapp || '81994228240'}
        mensagem={configs.whatsapp_botao_mensagem}
        ativo={configs.whatsapp_botao_ativo !== 'false'}
      />
    </>
  );
}
