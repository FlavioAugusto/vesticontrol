'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MessageCircle, Mail, MapPin, X } from 'lucide-react';
import { useState } from 'react';

function WhatsAppIcon({ size = 15 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.55 4.104 1.513 5.833L.057 23.891a.5.5 0 0 0 .611.611l6.058-1.456A11.93 11.93 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-1.93 0-3.73-.527-5.27-1.44l-.376-.224-3.898.937.953-3.798-.245-.39A9.796 9.796 0 0 1 2.182 12c0-5.422 4.396-9.818 9.818-9.818 5.422 0 9.818 4.396 9.818 9.818 0 5.422-4.396 9.818-9.818 9.818z"/>
    </svg>
  );
}

function InstagramIcon({ size = 15 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  );
}

// Modal reutilizável para páginas informativas
interface InfoModal {
  titulo: string;
  conteudo: string;
}

interface ModalProps {
  modal: InfoModal | null;
  onClose: () => void;
}

function InfoModal({ modal, onClose }: ModalProps) {
  if (!modal) return null;
  return (
    <div className="fixed inset-0 z-50 bg-charcoal/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative bg-white w-full max-w-2xl max-h-[85vh] overflow-y-auto animate-zoom-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-cream-darker sticky top-0 bg-white z-10">
          <h2 className="font-serif text-xl text-charcoal">{modal.titulo}</h2>
          <button onClick={onClose} className="text-charcoal-muted hover:text-charcoal transition-colors">
            <X size={20} />
          </button>
        </div>
        <div
          className="px-6 py-6 text-sm text-charcoal-muted leading-relaxed space-y-4 prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{
            __html: modal.conteudo
              // Sanitizar: remover tags perigosas antes de renderizar
              .replace(/<script[\s\S]*?<\/script>/gi, '')
              .replace(/<iframe[\s\S]*?>/gi, '')
              .replace(/on\w+="[^"]*"/gi, '')
              .replace(/javascript:/gi, '')
              .replace(/\n/g, '<br/>')
          }}
        />
      </div>
    </div>
  );
}

interface Props {
  nomeLoja: string;
  logoUrl: string;
  email: string;
  whatsapp: string;
  instagram: string;
  rodapeTexto: string;
  rodapeEndereco: string;
  rodapeHorario: string;
  rodapeRua?: string;
  rodapeCnpj?: string;
  rodapeCredito?: string;
  // Conteúdos dos modais (vindo do banco)
  modalPrivacidade?: string;
  modalTermos?: string;
  modalPagamento?: string;
  modalFrete?: string;
  modalTamanhos?: string;
  modalTrocas?: string;
}

const DEFAULTS: Record<string, InfoModal> = {
  privacidade: {
    titulo: 'Política de Privacidade',
    conteudo: `[NOME DA LOJA] — POLÍTICA DE PRIVACIDADE
CNPJ: [CNPJ DA LOJA] · [Cidade/UF]
Em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)

INTRODUÇÃO
A [NOME DA LOJA] valoriza a sua privacidade e está comprometida com a proteção dos seus dados pessoais. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos, compartilhamos e protegemos as informações que você nos confia ao utilizar nosso site, em conformidade com a LGPD (Lei nº 13.709/2018) e o Marco Civil da Internet (Lei nº 12.965/2014).

1. DADOS QUE COLETAMOS
Coletamos apenas os dados estritamente necessários para processar seus pedidos e melhorar sua experiência:
• Dados cadastrais: nome completo, e-mail, CPF, telefone/WhatsApp e data de nascimento (opcional)
• Endereço de entrega e cobrança: CEP, rua, número, complemento, bairro, cidade e estado
• Dados de pagamento: processados diretamente pelos gateways (MercadoPago, InfinitePay) — NUNCA armazenamos número de cartão de crédito em nossos servidores
• Dados de navegação: endereço IP, tipo de dispositivo, sistema operacional, navegador, páginas visitadas e tempo de permanência
• Cookies essenciais de sessão (autenticação) e cookies de desempenho (analytics anônimo)
• Histórico de compras e preferências de produtos

2. BASE LEGAL (LGPD)
Tratamos seus dados com base nas seguintes hipóteses legais previstas no Art. 7º da LGPD:
• Execução de contrato (processamento de pedidos e entregas)
• Cumprimento de obrigação legal/regulatória (emissão de nota fiscal, registros contábeis)
• Consentimento (para envio de comunicações de marketing)
• Legítimo interesse (prevenção a fraudes, segurança da plataforma)

3. COMO USAMOS SEUS DADOS
Suas informações são utilizadas exclusivamente para:
• Processar, confirmar, faturar e entregar seus pedidos
• Enviar atualizações sobre seu pedido por e-mail e/ou WhatsApp
• Emissão de nota fiscal eletrônica
• Atender solicitações de suporte, trocas e devoluções
• Enviar novidades, promoções e ofertas exclusivas (somente com seu consentimento expresso, podendo ser revogado a qualquer momento)
• Prevenção a fraudes e proteção dos nossos clientes
• Cumprir obrigações legais, fiscais e contratuais

4. COMPARTILHAMENTO DE DADOS
Seus dados são compartilhados estritamente com:
• Transportadoras parceiras (Correios, JadLog, transportadoras Melhor Envio) — apenas dados de entrega
• Processadores de pagamento (MercadoPago, InfinitePay) — apenas dados de cobrança
• Provedores de hospedagem em nuvem (Supabase, EasyPanel) — com cláusulas contratuais de proteção
• Autoridades públicas, quando exigido por lei ou ordem judicial

❌ JAMAIS vendemos, alugamos, cedemos ou trocamos seus dados pessoais com terceiros para fins comerciais.

5. ARMAZENAMENTO E SEGURANÇA
• Todos os dados em trânsito são protegidos por criptografia SSL/TLS de 256 bits
• Senhas são armazenadas com hash criptográfico irreversível (bcrypt)
• Acesso interno restrito apenas a colaboradores autorizados, com autenticação multifator
• Backups diários redundantes em servidores em conformidade com PCI DSS
• Monitoramento contínuo contra invasões e tentativas de acesso não autorizado
• Período de retenção: dados de pedidos são mantidos por 5 anos (obrigação fiscal); dados de marketing até que você revogue o consentimento

6. SEUS DIREITOS (LGPD — Art. 18)
Você tem direito a, a qualquer momento, gratuitamente:
• Confirmar a existência de tratamento dos seus dados
• Acessar uma cópia dos dados que mantemos sobre você
• Corrigir dados incompletos, inexatos ou desatualizados
• Solicitar anonimização, bloqueio ou eliminação de dados desnecessários
• Solicitar a portabilidade dos seus dados a outro fornecedor
• Revogar o consentimento e solicitar a exclusão de dados tratados sob essa base legal
• Solicitar revisão de decisões automatizadas que afetem seus interesses

Para exercer qualquer direito, envie e-mail para [EMAIL] com o assunto "LGPD — Solicitação de Direitos". Responderemos em até 15 dias úteis.

7. COOKIES
Utilizamos os seguintes tipos de cookies:
• Cookies essenciais: necessários para o funcionamento do site (login, carrinho, sessão) — não podem ser desativados
• Cookies de desempenho: medem como você usa o site (de forma anônima) para melhorarmos a experiência
• Cookies de marketing: utilizados somente com seu consentimento, para personalizar ofertas

Você pode gerenciar suas preferências de cookies pelo banner exibido em sua primeira visita ou nas configurações do seu navegador.

8. CRIANÇAS E ADOLESCENTES
Nosso site não é destinado a menores de 18 anos. Não coletamos intencionalmente dados de crianças. Caso identifiquemos coleta indevida, os dados serão excluídos imediatamente.

9. ALTERAÇÕES NESTA POLÍTICA
Esta política pode ser atualizada periodicamente. A versão mais recente estará sempre disponível neste link. Mudanças significativas serão comunicadas por e-mail aos clientes cadastrados.

10. ENCARREGADO DE DADOS (DPO) E CONTATO
Para exercer seus direitos, esclarecer dúvidas ou registrar reclamações sobre o tratamento dos seus dados, entre em contato:
📧 E-mail: [EMAIL]
📱 WhatsApp: [WHATSAPP]
📷 Instagram: [INSTAGRAM]
📍 Endereço: [ENDERECO]

Em caso de não solução, você pode acionar a Autoridade Nacional de Proteção de Dados (ANPD) através de www.gov.br/anpd.

Última atualização: Maio de 2026`,
  },
  termos: {
    titulo: 'Termos de Uso',
    conteudo: `[NOME DA LOJA] — TERMOS DE USO
CNPJ: [CNPJ DA LOJA] · [Cidade/UF]
Última atualização: Maio de 2026

Ao acessar, navegar, cadastrar-se ou realizar compras em nosso site, você (doravante "Cliente" ou "Usuário") declara ter lido, compreendido e concordado integralmente com os presentes Termos de Uso, bem como com nossa Política de Privacidade. Caso não concorde, recomendamos que NÃO utilize o site.

1. SOBRE A EMPRESA
[NOME DA LOJA] é uma marca de moda feminina autoral, inscrita no CNPJ [CNPJ DA LOJA], com sede em [Cidade/UF]. Atuamos no comércio eletrônico de roupas e acessórios femininos, com foco em peças de alta qualidade, modelagem premium e atendimento personalizado.

Contato oficial:
📧 [EMAIL]
📱 WhatsApp: [WHATSAPP]
📷 Instagram: [INSTAGRAM]

2. CADASTRO E CONTA DE USUÁRIO
• O cadastro é gratuito e destinado a maiores de 18 anos
• Você é responsável por manter a confidencialidade da sua senha e por todas as atividades realizadas em sua conta
• Os dados informados devem ser verdadeiros, atualizados e completos
• A [NOME DA LOJA] reserva-se o direito de suspender ou excluir contas com indícios de fraude, uso indevido ou violação destes termos

3. PRODUTOS, PREÇOS E DISPONIBILIDADE
• Todas as peças são confeccionadas com matérias-primas selecionadas, seguindo rigorosos padrões de qualidade
• As cores reais podem variar levemente em relação às fotos, devido à calibração de monitor/celular e iluminação
• As medidas informadas no Guia de Tamanhos são aproximadas — em caso de dúvida, recomendamos o tamanho maior
• Os preços e as condições de pagamento estão sujeitos a alteração sem aviso prévio
• O estoque é dinâmico — em caso de indisponibilidade após a compra, o valor será integralmente devolvido em até 7 dias úteis
• Promoções e cupons têm validade e regras próprias, divulgadas no site

4. FORMAS DE PAGAMENTO
• Cartão de crédito: até 6x sem juros (Visa, Mastercard, Elo, Amex), processado via MercadoPago/InfinitePay
• PIX: pagamento instantâneo com 10% de desconto sobre o valor total
• Boleto bancário: vencimento em 2 dias úteis; o pedido é confirmado após compensação
• Todas as transações são processadas em ambiente seguro com criptografia SSL e conformidade PCI DSS
• A [NOME DA LOJA] NÃO armazena dados de cartão de crédito

5. CONFIRMAÇÃO E PROCESSAMENTO DO PEDIDO
• O pedido é considerado confirmado apenas após aprovação do pagamento
• Você receberá confirmação por e-mail e/ou WhatsApp
• Prazo de separação e despache: até 3 dias úteis após confirmação

6. ENVIO, FRETE E ENTREGA
• Trabalhamos com Correios (PAC e SEDEX) e transportadoras parceiras via Melhor Envio
• Frete grátis conforme política vigente da loja (consulte regras no carrinho)
• Prazos de entrega estimados:
   – Nordeste: 5 a 8 dias úteis
   – Sul e Sudeste: 7 a 12 dias úteis
   – Norte e Centro-Oeste: 10 a 15 dias úteis
• Os prazos contam a partir da confirmação do pagamento
• Após o despache, você recebe o código de rastreamento por e-mail/WhatsApp
• Em caso de ausência no recebimento, a tentativa é repetida pela transportadora; após 3 tentativas, o pedido retorna e o frete da reentrega fica por conta do cliente

7. CANCELAMENTOS
• Pedidos podem ser cancelados em até 24h após a compra, sem custo
• Após 24h, aplica-se a política de trocas e devoluções
• Pedidos com pagamento via boleto são cancelados automaticamente após 5 dias sem compensação
• Cancelamentos solicitados após o envio: o valor pago será restituído após retorno da mercadoria, descontando o frete

8. TROCAS, DEVOLUÇÕES E DIREITO DE ARREPENDIMENTO (CDC ART. 49)
• Direito de arrependimento: você pode solicitar a devolução em até 7 dias corridos após o recebimento (Código de Defesa do Consumidor)
• Trocas por defeito ou tamanho incorreto: prazo de 30 dias corridos
• A peça deve estar sem uso, com etiquetas originais, embalagem preservada e acompanhada de nota fiscal/comprovante
• Em caso de defeito de fabricação: troca/devolução com frete por nossa conta
• Em caso de desistência ou troca por outro tamanho: frete de retorno por conta do cliente
• Reembolso processado em até 7 dias úteis após análise da peça devolvida
• Peças íntimas, customizadas ou com desconto superior a 50% NÃO são elegíveis para troca por motivos de higiene e personalização

9. PROPRIEDADE INTELECTUAL
• Todo o conteúdo deste site (textos, imagens, fotos de produtos, logotipos, design, código-fonte) é propriedade exclusiva da [NOME DA LOJA] e está protegido pela Lei de Direitos Autorais (Lei nº 9.610/1998) e pela Lei da Propriedade Industrial (Lei nº 9.279/1996)
• É expressamente proibida a reprodução, distribuição, modificação ou uso comercial sem autorização prévia por escrito
• Violações serão tratadas judicialmente

10. CONDUTA DO USUÁRIO
É vedado ao usuário:
• Utilizar o site para fins ilícitos ou contrários a estes termos
• Tentar acessar áreas restritas ou dados de outros usuários
• Realizar engenharia reversa, scraping ou copiar o conteúdo
• Publicar avaliações falsas ou ofensivas
• Usar bots, scripts ou ferramentas automatizadas para realizar pedidos em massa

11. RESPONSABILIDADES E LIMITAÇÕES
A [NOME DA LOJA] empenha-se em manter o site sempre disponível e seguro, mas NÃO se responsabiliza por:
• Atrasos causados por transportadoras ou eventos de força maior (greves, intempéries, problemas logísticos)
• Informações de entrega incorretas ou incompletas fornecidas pelo cliente
• Indisponibilidades temporárias do site por manutenção programada
• Danos causados por uso indevido dos produtos
• Conteúdo de sites de terceiros eventualmente linkados

12. PROTEÇÃO DE DADOS (LGPD)
O tratamento dos seus dados pessoais segue rigorosamente a Lei nº 13.709/2018 (LGPD). Consulte nossa Política de Privacidade para mais detalhes.

13. ALTERAÇÕES NESTES TERMOS
Estes termos podem ser atualizados periodicamente. A versão mais recente estará sempre disponível neste link. Recomendamos consultar regularmente. O uso continuado do site após mudanças significa aceitação dos novos termos.

14. LEI APLICÁVEL E FORO
Estes Termos são regidos pela legislação brasileira. Fica eleito o foro da Comarca de [Cidade/UF], com renúncia expressa a qualquer outro, por mais privilegiado que seja, para dirimir quaisquer controvérsias decorrentes destes termos, salvo disposição legal em contrário aplicável ao consumidor.

15. DÚVIDAS E CONTATO
Para esclarecer dúvidas, solicitar suporte ou fazer reclamações:
📧 [EMAIL]
📱 [WHATSAPP]
📷 [INSTAGRAM]
📍 [ENDERECO]

Atendimento de segunda a sexta, das 09h às 18h.`,
  },
  pagamento: {
    titulo: 'Formas de Pagamento',
    conteudo: `A [NOME DA LOJA] oferece diversas formas de pagamento para sua comodidade:

CARTÃO DE CRÉDITO
• Parcelamento em até 6x sem juros
• Aceitos: Visa, Mastercard, Elo, American Express
• Processamento seguro via Mercado Pago

PIX — 10% DE DESCONTO
• Pagamento instantâneo com desconto especial
• QR Code ou chave PIX gerados no momento do checkout
• Confirmação em até 5 minutos

BOLETO BANCÁRIO
• Vencimento em 2 dias úteis
• O pedido é confirmado após compensação bancária

SEGURANÇA
• Ambiente 100% protegido com certificado SSL
• Seus dados financeiros nunca são armazenados em nosso servidor
• Conformidade com PCI DSS`,
  },
  frete: {
    titulo: 'Frete e Entrega',
    conteudo: `CONDIÇÕES DE FRETE
Sua primeira compra tem frete grátis! Aproveite para conhecer nossas peças.

FRETE GRÁTIS CONFORME POLÍTICA
Para pedidos acima desse valor, o frete é gratuito para todo o Brasil.

PRAZOS DE ENTREGA
• Nordeste: 5 a 8 dias úteis
• Sul e Sudeste: 7 a 12 dias úteis
• Norte e Centro-Oeste: 10 a 15 dias úteis

Os prazos são contados após a confirmação do pagamento.

TRANSPORTADORAS
Trabalhamos com Correios (PAC e SEDEX) e transportadoras parceiras para garantir a melhor entrega.

RASTREAMENTO
Após o envio, você recebe o código de rastreamento por e-mail. Acompanhe pelo site dos Correios ou pelo link na sua área "Minha Conta".

EMBALAGEM
Todos os pedidos são embalados com cuidado para garantir que sua peça chegue perfeita.`,
  },
  tamanhos: {
    titulo: 'Guia de Tamanhos',
    conteudo: `Nossas peças seguem o padrão brasileiro de numeração. Confira as medidas em centímetros:

VESTIDOS E CONJUNTOS

Tamanho P
• Busto: 88–92 cm
• Cintura: 70–74 cm
• Quadril: 94–98 cm

Tamanho M
• Busto: 92–96 cm
• Cintura: 74–78 cm
• Quadril: 98–102 cm

Tamanho G
• Busto: 96–100 cm
• Cintura: 78–82 cm
• Quadril: 102–106 cm

COMO MEDIR
1. Use uma fita métrica flexível
2. Meça sempre sobre a lingerie ou roupa fina
3. Mantenha a fita justa, sem apertar
4. Busto: ponto mais largo do peito
5. Cintura: ponto mais fino do tronco
6. Quadril: ponto mais largo dos quadris

Em caso de dúvida entre dois tamanhos, recomendamos o maior.

Dúvidas? Fale conosco no WhatsApp!`,
  },
  trocas: {
    titulo: 'Trocas e Devoluções',
    conteudo: `A [NOME DA LOJA] tem 30 dias para trocas e devoluções a partir da data de recebimento.

CONDIÇÕES PARA TROCA
• Peça sem uso, com etiqueta original
• Embalagem original ou equivalente
• Nota fiscal ou comprovante de compra

COMO SOLICITAR
1. Entre em contato pelo WhatsApp ou e-mail
2. Informe o número do pedido e o motivo
3. Nossa equipe enviará as instruções de devolução

PRODUTO COM DEFEITO
Em caso de defeito de fabricação:
• Troca imediata, sem custo de frete
• Devolução completa do valor pago
• Contato em até 7 dias após o recebimento

PRODUTO CORRETO MAS QUE NÃO AGRADOU
• Troca por outro tamanho ou peça (sujeito à disponibilidade)
• Crédito na loja ou devolução do valor
• Frete de retorno por conta do cliente

Importante: peças personalizadas ou com desconto acima de 50% não são elegíveis para troca.

Prazo de reembolso: até 7 dias úteis após recebermos a peça.`,
  },
};

export default function FooterDinamico({
  nomeLoja, logoUrl, email, whatsapp, instagram,
  rodapeTexto, rodapeEndereco, rodapeHorario,
  rodapeRua, rodapeCnpj, rodapeCredito,
  modalPrivacidade, modalTermos, modalPagamento,
  modalFrete, modalTamanhos, modalTrocas,
}: Props) {
  const [modalAberto, setModalAberto] = useState<InfoModal | null>(null);
  const instagramHandle = instagram.replace('@', '');
  const waLink = `https://wa.me/55${whatsapp.replace(/\D/g, '')}`;

  // Substitui placeholders [NOME DA LOJA], [CNPJ DA LOJA], [Cidade/UF], etc com dados reais
  function preencherDadosLoja(texto: string): string {
    // Extrai cidade/UF do endereço se possível (formato: "..., Cidade/UF" ou "Cidade-UF")
    const matchCidade = rodapeEndereco?.match(/([A-Za-zÀ-ÿ ]+)[\s,]+(?:-\s*)?([A-Z]{2})\b/);
    const cidadeUF = matchCidade ? `${matchCidade[1].trim()}/${matchCidade[2]}` : rodapeEndereco || '—';
    const whatsappFormatado = whatsapp
      ? `(${whatsapp.replace(/\D/g, '').slice(0, 2)}) ${whatsapp.replace(/\D/g, '').slice(2, 7)}-${whatsapp.replace(/\D/g, '').slice(7, 11)}`
      : '';

    return texto
      .replace(/\[NOME DA LOJA\]/g, nomeLoja || 'Nossa Loja')
      .replace(/\[CNPJ DA LOJA\]/g, rodapeCnpj || '—')
      .replace(/\[Cidade\/UF\]/g, cidadeUF)
      .replace(/\[Cidade, UF\]/g, cidadeUF)
      .replace(/\[EMAIL\]/g, email || '—')
      .replace(/\[WHATSAPP\]/g, whatsappFormatado || '—')
      .replace(/\[ENDERECO\]/g, rodapeEndereco || '—')
      .replace(/\[INSTAGRAM\]/g, instagram || '—')
      .replace(/contato@sualoja\.com\.br/gi, email || 'contato@sualoja.com.br')
      .replace(/\(11\) 99999-9999/g, whatsappFormatado || '(11) 99999-9999')
      .replace(/Endereço da loja, Cidade\/UF/gi, rodapeEndereco || 'Endereço da loja, Cidade/UF');
  }

  function abrir(tipo: keyof typeof DEFAULTS, conteudoDb?: string) {
    const def = DEFAULTS[tipo];
    const conteudoBruto = (conteudoDb && conteudoDb.trim().length > 10) ? conteudoDb : def.conteudo;
    setModalAberto({
      titulo: def.titulo,
      // Preenche placeholders com dados reais da loja
      conteudo: preencherDadosLoja(conteudoBruto),
    });
  }

  return (
    <>
      <footer className="bg-charcoal text-cream/70 font-sans">
        <div className="max-w-7xl mx-auto px-4 py-10 sm:py-14 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-8 md:gap-10">

          {/* Marca com logo — centralizada no mobile */}
          <div className="sm:col-span-2 md:col-span-1 text-center sm:text-left">
            <div className="mb-4 sm:mb-5">
              <div className="mb-3 flex items-center mx-auto sm:mx-0 w-fit max-w-[160px]">
                {logoUrl ? (
                  /* Logo mostrado sem filtro — funciona com qualquer tipo
                   * (PNG transparente, PNG fundo branco, SVG, WEBP)
                   * Admin deve enviar logo de alta qualidade */
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={logoUrl}
                    alt={nomeLoja}
                    className="max-h-16 max-w-full object-contain"
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement;
                      img.style.display = 'none';
                      // Mostra nome como fallback
                      const fallback = document.createElement('span');
                      fallback.className = 'font-display text-lg text-cream tracking-[4px] uppercase';
                      fallback.textContent = nomeLoja;
                      img.parentNode?.appendChild(fallback);
                    }}
                  />
                ) : (
                  <p className="font-display text-lg text-cream tracking-[4px] uppercase">{nomeLoja}</p>
                )}
              </div>
              <p className="text-sm leading-relaxed text-cream/60">{rodapeTexto}</p>
            </div>
            <div className="flex gap-4 justify-center sm:justify-start">
              <a href={`https://instagram.com/${instagramHandle}`} target="_blank" rel="noopener"
                className="w-9 h-9 rounded-full border border-cream/20 flex items-center justify-center hover:border-gold hover:text-gold transition-colors">
                <InstagramIcon size={15} />
              </a>
              <a href={waLink} target="_blank" rel="noopener"
                className="w-9 h-9 rounded-full border border-cream/20 flex items-center justify-center hover:border-gold hover:text-gold transition-colors">
                <WhatsAppIcon size={15} />
              </a>
              <a href={`mailto:${email}`}
                className="w-9 h-9 rounded-full border border-cream/20 flex items-center justify-center hover:border-gold hover:text-gold transition-colors">
                <Mail size={15} />
              </a>
            </div>
          </div>

          {/* Coleção */}
          <div className="text-center sm:text-left">
            <h3 className="text-xs font-semibold text-cream uppercase tracking-widest mb-4">Coleção</h3>
            <ul className="space-y-2.5 text-sm">
              {[
                ['Todos os Produtos', '/produtos'],
                ['Conjuntos', '/categorias/conjuntos'],
                ['Vestidos Midi', '/categorias/midi'],
                ['Vestidos Longos', '/categorias/longos'],
                ['Lançamentos', '/categorias/lancamentos'],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-gold transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Informações */}
          <div className="text-center sm:text-left">
            <h3 className="text-xs font-semibold text-cream uppercase tracking-widest mb-4">Informações</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/minha-conta" className="hover:text-gold transition-colors">Minha Conta</Link></li>
              <li><a href="/formas-pagamento" className="hover:text-gold transition-colors">Formas de Pagamento</a></li>
              <li><a href="/frete-entrega" className="hover:text-gold transition-colors">Frete e Entrega</a></li>
              <li><a href="/guia-tamanhos" className="hover:text-gold transition-colors">Guia de Tamanhos</a></li>
              <li><a href="/trocas-devolucoes" className="hover:text-gold transition-colors">Trocas e Devoluções</a></li>
            </ul>
          </div>

          {/* Contato */}
          <div className="text-center sm:text-left">
            <h3 className="text-xs font-semibold text-cream uppercase tracking-widest mb-4">Contato</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-2.5 justify-center sm:justify-start">
                <WhatsAppIcon size={15} />
                <a href={waLink} target="_blank" rel="noopener" className="hover:text-gold">{whatsapp}</a>
              </li>
              <li className="flex gap-2.5 justify-center sm:justify-start">
                <Mail size={15} className="text-gold mt-0.5 shrink-0" />
                <a href={`mailto:${email}`} className="hover:text-gold break-all">{email}</a>
              </li>
              <li className="flex gap-2.5 justify-center sm:justify-start">
                <MapPin size={15} className="text-gold mt-0.5 shrink-0" />
                <span>{rodapeEndereco}</span>
              </li>
            </ul>
            <div className="mt-5 p-3 bg-white/5 rounded-sm text-xs text-center sm:text-left">
              <p className="text-cream/50">Atendimento</p>
              <p className="text-cream/70 mt-0.5">{rodapeHorario}</p>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 py-5 px-4">
          <div className="max-w-7xl mx-auto flex flex-col items-center gap-2 text-xs text-cream/40 text-center md:flex-row md:justify-between">
            <div className="text-center md:text-left">
              <p>{nomeLoja} {rodapeRua && `— ${rodapeRua}`}</p>
              {rodapeCnpj && <p className="mt-0.5">CNPJ: {rodapeCnpj}</p>}
            </div>
            <div className="flex gap-4">
              <button onClick={() => abrir('privacidade', modalPrivacidade)}
                className="hover:text-gold transition-colors">Privacidade</button>
              <button onClick={() => abrir('termos', modalTermos)}
                className="hover:text-gold transition-colors">Termos de Uso</button>
            </div>
          </div>
          {rodapeCredito && (
            <p className="text-cream/25 text-[10px] text-center mt-3">{rodapeCredito}</p>
          )}
        </div>
      </footer>

      {/* Modal informativo */}
      <InfoModal modal={modalAberto} onClose={() => setModalAberto(null)} />
    </>
  );
}
