'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Toggle from '@/components/ui/Toggle';
import toast from 'react-hot-toast';
import { Plus, Trash2, GripVertical, Image as ImageIcon } from 'lucide-react';

interface Banner {
  id: string;
  titulo: string;
  subtitulo: string;
  descricao: string;
  cta_texto: string;
  cta_href: string;
  imagem_url: string;
  ativo: boolean;
  ordem: number;
}

const BANNERS_PADRAO: Banner[] = [
  { id: '1', titulo: 'Nova Coleção', subtitulo: 'Primavera / Verão 2025', descricao: 'Vestidos e conjuntos que celebram a feminilidade com elegância.', cta_texto: 'Ver Coleção', cta_href: '/produtos', imagem_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1400&h=900&fit=crop', ativo: true, ordem: 1 },
  { id: '2', titulo: 'Conjuntos Exclusivos', subtitulo: 'Alta Costura', descricao: 'Peças únicas criadas com tecidos selecionados.', cta_texto: 'Explorar Conjuntos', cta_href: '/categorias/conjuntos', imagem_url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1400&h=900&fit=crop', ativo: true, ordem: 2 },
  { id: '3', titulo: 'Vestidos Longos', subtitulo: 'Ocasiões Especiais', descricao: 'Para momentos únicos que merecem looks inesquecíveis.', cta_texto: 'Ver Vestidos', cta_href: '/categorias/longos', imagem_url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=1400&h=900&fit=crop', ativo: true, ordem: 3 },
];

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>(BANNERS_PADRAO);
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);

  async function salvar() {
    setLoading(true);
    try {
      const supabase = createClient();
      for (const b of banners) {
        await supabase.from('configuracoes').upsert({
          chave: `banner_${b.id}`,
          valor: JSON.stringify(b),
          grupo: 'banners',
        });
      }
      await fetch('/api/revalidar', { method: 'POST' });
      toast.success('Salvo com sucesso.');
    } catch {
      toast.error('Erro ao salvar — verifique a conexão com Supabase');
    } finally {
      setLoading(false);
    }
  }

  function update(id: string, field: keyof Banner, value: string | boolean | number) {
    setBanners((prev) => prev.map((b) => b.id === id ? { ...b, [field]: value } : b));
  }

  function addBanner() {
    const novo: Banner = { id: Date.now().toString(), titulo: 'Novo Banner', subtitulo: '', descricao: '', cta_texto: 'Ver Coleção', cta_href: '/produtos', imagem_url: '', ativo: true, ordem: banners.length + 1 };
    setBanners([...banners, novo]);
    setEditando(novo.id);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif text-charcoal">Banners do Hero</h1>
          <p className="text-charcoal-muted text-sm mt-1">Gerencie os slides do banner principal da home</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={addBanner}><Plus size={14} /> Novo Banner</Button>
          <Button loading={loading} onClick={salvar}>Salvar Alterações</Button>
        </div>
      </div>

      <div className="space-y-4">
        {banners.map((b) => (
          <div key={b.id} className="bg-white rounded-sm shadow-sm overflow-hidden">
            {/* Header do card */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-cream-darker cursor-pointer" onClick={() => setEditando(editando === b.id ? null : b.id)}>
              <GripVertical size={16} className="text-charcoal-muted cursor-grab" />
              {b.imagem_url ? (
                <img src={b.imagem_url} alt={b.titulo} className="w-16 h-10 object-cover rounded-sm" />
              ) : (
                <div className="w-16 h-10 bg-cream-dark rounded-sm flex items-center justify-center">
                  <ImageIcon size={14} className="text-charcoal-muted" />
                </div>
              )}
              <div className="flex-1">
                <p className="font-semibold text-sm text-charcoal">{b.titulo}</p>
                <p className="text-xs text-charcoal-muted">{b.subtitulo}</p>
              </div>
              <Toggle checked={b.ativo} onChange={(v) => update(b.id, 'ativo', v)} />
              <button onClick={(e) => { e.stopPropagation(); setBanners((prev) => prev.filter((x) => x.id !== b.id)); }} className="text-red-400 hover:text-red-600 transition-colors ml-2">
                <Trash2 size={14} />
              </button>
            </div>

            {/* Form de edição */}
            {editando === b.id && (
              <div className="p-5 grid md:grid-cols-2 gap-4">
                <Input label="Título Principal" value={b.titulo} onChange={(e) => update(b.id, 'titulo', e.target.value)} />
                <Input label="Subtítulo" value={b.subtitulo} onChange={(e) => update(b.id, 'subtitulo', e.target.value)} />
                <Input label="Descrição" value={b.descricao} onChange={(e) => update(b.id, 'descricao', e.target.value)} />
                <Input label="URL da Imagem (Unsplash, Supabase, etc.)" value={b.imagem_url} onChange={(e) => update(b.id, 'imagem_url', e.target.value)} />
                <Input label="Texto do Botão" value={b.cta_texto} onChange={(e) => update(b.id, 'cta_texto', e.target.value)} />
                <Input label="Link do Botão" value={b.cta_href} onChange={(e) => update(b.id, 'cta_href', e.target.value)} />
                {b.imagem_url && (
                  <div className="md:col-span-2">
                    <p className="text-xs text-charcoal-muted mb-2">Preview:</p>
                    <img src={b.imagem_url} alt="Preview" className="h-32 w-full object-cover rounded-sm" />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
