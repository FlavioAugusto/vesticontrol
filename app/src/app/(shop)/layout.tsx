import { getConfiguracoes } from '@/lib/configuracoes';
import TopBarDinamico from '@/components/layout/TopBarDinamico';
import FooterDinamico from '@/components/layout/FooterDinamico';
import ShopClientLayout from '@/components/layout/ShopClientLayout';
import CookieBanner from '@/components/layout/CookieBanner';
import BotoesFlutuantes from '@/components/layout/BotoesFlutuantes';

export const dynamic = 'force-dynamic';

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const c = await getConfiguracoes();

  return (
    <>
      <TopBarDinamico texto={c.topbar_texto} ativo={c.topbar_ativo === 'true'} />
      <ShopClientLayout logoUrl={c.loja_logo_url} nomeLoja={c.loja_nome}>
        <main>{children}</main>
      </ShopClientLayout>
      <FooterDinamico
        nomeLoja={c.loja_nome} logoUrl={c.loja_logo_url}
        email={c.loja_email} whatsapp={c.loja_whatsapp} instagram={c.loja_instagram}
        rodapeTexto={c.rodape_texto} rodapeEndereco={c.rodape_endereco}
        rodapeRua={c.rodape_rua} rodapeCnpj={c.rodape_cnpj}
        rodapeHorario={c.rodape_horario} rodapeCredito={c.rodape_credito}
        modalPrivacidade={c.modal_privacidade} modalTermos={c.modal_termos}
        modalPagamento={c.modal_pagamento} modalFrete={c.modal_frete}
        modalTamanhos={c.modal_tamanhos} modalTrocas={c.modal_trocas}
      />
      <CookieBanner />
      <BotoesFlutuantes
        whatsapp={c.loja_whatsapp}
        mensagem={c.whatsapp_botao_mensagem}
        ativo={c.whatsapp_botao_ativo !== 'false'}
      />
    </>
  );
}
