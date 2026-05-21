export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      categorias: {
        Row: {
          id: string;
          nome: string;
          slug: string;
          descricao: string | null;
          imagem_url: string | null;
          ativo: boolean;
          ordem: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['categorias']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['categorias']['Insert']>;
      };
      produtos: {
        Row: {
          id: string;
          nome: string;
          slug: string;
          descricao: string | null;
          preco: number;
          preco_antigo: number | null;
          categoria_id: string | null;
          badge: 'lancamento' | 'bestseller' | 'maisvendidos' | null;
          ativo: boolean;
          destaque: boolean;
          peso_gramas: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['produtos']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Database['public']['Tables']['produtos']['Insert']>;
      };
      produto_variantes: {
        Row: {
          id: string;
          produto_id: string;
          tamanho: string;
          cor: string | null;
          cor_hex: string | null;
          estoque: number;
          sku: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['produto_variantes']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['produto_variantes']['Insert']>;
      };
      produto_imagens: {
        Row: {
          id: string;
          produto_id: string;
          url: string;
          alt: string | null;
          ordem: number;
          principal: boolean;
        };
        Insert: Omit<Database['public']['Tables']['produto_imagens']['Row'], 'id'> & { id?: string };
        Update: Partial<Database['public']['Tables']['produto_imagens']['Insert']>;
      };
      clientes: {
        Row: {
          id: string;
          nome: string;
          sobrenome: string | null;
          cpf: string | null;
          telefone: string | null;
          whatsapp: string | null;
          nascimento: string | null;
          newsletter: boolean;
          vip: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['clientes']['Row'], 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string };
        Update: Partial<Database['public']['Tables']['clientes']['Insert']>;
      };
      enderecos: {
        Row: {
          id: string;
          cliente_id: string;
          nome: string;
          cep: string;
          rua: string;
          numero: string;
          complemento: string | null;
          bairro: string;
          cidade: string;
          estado: string;
          principal: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['enderecos']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['enderecos']['Insert']>;
      };
      pedidos: {
        Row: {
          id: string;
          numero: number;
          cliente_id: string | null;
          status: 'pendente' | 'processando' | 'pago' | 'separando' | 'enviado' | 'entregue' | 'cancelado' | 'reembolsado';
          subtotal: number;
          frete: number;
          desconto: number;
          total: number;
          metodo_pagamento: string | null;
          status_pagamento: string;
          payment_id: string | null;
          payment_url: string | null;
          endereco_entrega_id: string | null;
          transportadora: string | null;
          codigo_rastreio: string | null;
          cupom_codigo: string | null;
          cupom_desconto: number | null;
          observacoes: string | null;
          nota_interna: string | null;
          pago_em: string | null;
          enviado_em: string | null;
          entregue_em: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['pedidos']['Row'], 'numero' | 'created_at' | 'updated_at'> & { numero?: number; created_at?: string; updated_at?: string };
        Update: Partial<Database['public']['Tables']['pedidos']['Insert']>;
      };
      pedido_itens: {
        Row: {
          id: string;
          pedido_id: string;
          produto_id: string | null;
          variante_id: string | null;
          nome_produto: string;
          tamanho: string | null;
          cor: string | null;
          quantidade: number;
          preco_unitario: number;
          subtotal: number;
        };
        Insert: Omit<Database['public']['Tables']['pedido_itens']['Row'], 'id'> & { id?: string };
        Update: Partial<Database['public']['Tables']['pedido_itens']['Insert']>;
      };
      cupons: {
        Row: {
          id: string;
          codigo: string;
          tipo: 'percentual' | 'fixo' | 'frete_gratis';
          valor: number | null;
          uso_maximo: number | null;
          uso_atual: number;
          valor_minimo: number | null;
          ativo: boolean;
          valido_ate: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['cupons']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['cupons']['Insert']>;
      };
      lista_desejos: {
        Row: {
          id: string;
          cliente_id: string;
          produto_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['lista_desejos']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['lista_desejos']['Insert']>;
      };
      avaliacoes: {
        Row: {
          id: string;
          produto_id: string;
          cliente_id: string | null;
          pedido_id: string | null;
          nota: number | null;
          titulo: string | null;
          texto: string | null;
          aprovado: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['avaliacoes']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['avaliacoes']['Insert']>;
      };
      configuracoes: {
        Row: {
          chave: string;
          valor: string | null;
          tipo: string;
          grupo: string | null;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['configuracoes']['Row'], 'updated_at'> & { updated_at?: string };
        Update: Partial<Database['public']['Tables']['configuracoes']['Insert']>;
      };
      admins: {
        Row: {
          id: string;
          nome: string;
          nivel: 'super' | 'admin' | 'operador';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['admins']['Row'], 'created_at'> & { created_at?: string };
        Update: Partial<Database['public']['Tables']['admins']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export type Categoria = Database['public']['Tables']['categorias']['Row'];
export type Produto = Database['public']['Tables']['produtos']['Row'];
export type ProdutoVariante = Database['public']['Tables']['produto_variantes']['Row'];
export type ProdutoImagem = Database['public']['Tables']['produto_imagens']['Row'];
export type Cliente = Database['public']['Tables']['clientes']['Row'];
export type Endereco = Database['public']['Tables']['enderecos']['Row'];
export type Pedido = Database['public']['Tables']['pedidos']['Row'];
export type PedidoItem = Database['public']['Tables']['pedido_itens']['Row'];
export type Cupom = Database['public']['Tables']['cupons']['Row'];
export type Avaliacao = Database['public']['Tables']['avaliacoes']['Row'];
export type Configuracao = Database['public']['Tables']['configuracoes']['Row'];
export type Admin = Database['public']['Tables']['admins']['Row'];

export type ProdutoComDetalhes = Produto & {
  categorias: Categoria | null;
  produto_imagens: ProdutoImagem[];
  produto_variantes: ProdutoVariante[];
};
