'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Toggle from '@/components/ui/Toggle';
import toast from 'react-hot-toast';
import { Plus, Trash2, Star, Play, User, Volume2, Video, Image as ImageIcon, X } from 'lucide-react';
import type { Depoimento } from '@/components/shop/Depoimentos';

const PADRAO: Depoimento[] = [
  { id: '1', nome: 'Ana Paula Mendonça', cidade: 'Recife, PE', nota: 5, texto: 'Amei demais o vestido! A qualidade é incrível, o tecido é super macio e o caimento é perfeito.', produto: 'Conjunto Elegância Dourada', foto_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop', ativo: true },
  { id: '2', nome: 'Carla Ferreira', cidade: 'São Paulo, SP', nota: 5, texto: 'O vestido midi é simplesmente perfeito! Usei no casamento da minha irmã e recebi elogios do começo ao fim.', produto: 'Vestido Midi Cetim Noturno', foto_url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop', ativo: true },
  { id: '3', nome: 'Juliana Santos', cidade: 'Brasília, DF', nota: 5, texto: 'Já é a terceira compra e nunca decepcionou. O atendimento é excelente e os produtos são de altíssima qualidade.', produto: 'Conjunto Seda Rosê', foto_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop', ativo: true },
];

export default function AdminDepoimentosPage() {
  const [depoimentos, setDepoimentos] = useState<Depoimento[]>(PADRAO);
  const [loading, setLoading] = useState(false);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [novo, setNovo] = useState(false);
  const [form, setForm] = useState<Partial<Depoimento>>({ nota: 5, ativo: true });

  useEffect(() => {
    (async () => {
      try {
        // Busca loja_id do admin logado
        const lojaRes = await fetch('/api/admin/minha-loja', { cache: 'no-store' });
        if (!lojaRes.ok) return;
        const lojaData = await lojaRes.json();
        const lojaId = lojaData.loja_id;
        if (!lojaId) return;

        const supabase = createClient();
        const { data } = await supabase.from('configuracoes')
          .select('valor')
          .eq('chave', 'depoimentos')
          .eq('loja_id', lojaId)
          .maybeSingle();
        if (data?.valor) setDepoimentos(JSON.parse(data.valor));
        else setDepoimentos([]); // sem depoimentos pra essa loja
      } catch { setDepoimentos([]); }
    })();
  }, []);

  async function salvar(lista: Depoimento[]) {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/salvar-configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs: { depoimentos: JSON.stringify(lista) } }),
      });
      if (!res.ok) throw new Error('Erro ao salvar');
      await fetch('/api/revalidar', { method: 'POST' });
      toast.success('Salvo com sucesso.');
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setLoading(false);
    }
  }

  function update(id: string, field: keyof Depoimento, value: string | boolean | number) {
    setDepoimentos((prev) => prev.map((d) => d.id === id ? { ...d, [field]: value } : d));
  }

  function deletar(id: string) {
    const nova = depoimentos.filter((d) => d.id !== id);
    setDepoimentos(nova);
    salvar(nova);
  }

  function adicionarNovo() {
    if (!form.nome || !form.texto) { toast.error('Nome e texto são obrigatórios'); return; }
    const dep: Depoimento = {
      id: Date.now().toString(),
      nome: form.nome ?? '',
      cidade: form.cidade ?? '',
      nota: form.nota ?? 5,
      texto: form.texto ?? '',
      foto_url: form.foto_url,
      video_url: form.video_url,
      audio_url: (form as Partial<Depoimento>).audio_url,
      imagem_url: (form as Partial<Depoimento>).imagem_url,
      imagem_alt: (form as Partial<Depoimento>).imagem_alt,
      produto: form.produto,
      ativo: form.ativo ?? true,
    };
    const nova = [dep, ...depoimentos];
    setDepoimentos(nova);
    salvar(nova);
    setNovo(false);
    setForm({ nota: 5, ativo: true });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif text-charcoal">Depoimentos & Experiências</h1>
          <p className="text-charcoal-muted text-sm mt-1">Gerencie textos e vídeos de clientes. Aparece na home e nas páginas de produto.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => setNovo(true)}><Plus size={14} /> Novo Depoimento</Button>
          <Button loading={loading} onClick={() => salvar(depoimentos)}>Salvar Ordem</Button>
        </div>
      </div>

      {/* Form novo */}
      {novo && (
        <div className="bg-white rounded-sm shadow-sm p-5 mb-5 border-l-4 border-gold space-y-4">
          <h3 className="font-serif text-lg">Novo Depoimento</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Input label="Nome da cliente *" value={form.nome ?? ''} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            <Input label="Cidade (ex: Recife, PE)" value={form.cidade ?? ''} onChange={(e) => setForm({ ...form, cidade: e.target.value })} />
            <div>
              <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">Foto da cliente (redonda · máx. 2MB)</label>
              <div className="flex gap-2 items-center">
                <label className="flex items-center gap-1.5 cursor-pointer border border-dashed border-gray-300 hover:border-gold px-3 py-2 text-xs text-charcoal-muted hover:text-gold transition-colors flex-1">
                  <Plus size={12} />
                  {form.foto_url ? 'Trocar foto' : 'Selecionar foto'}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 2 * 1024 * 1024) { toast.error('Máximo 2MB'); e.target.value = ''; return; }
                      const fd = new FormData();
                      fd.append('file', file);
                      fd.append('pasta', 'depoimentos');
                      try {
                        const res = await fetch('/api/upload', { method: 'POST', body: fd });
                        const d = await res.json();
                        if (d.url) setForm({ ...form, foto_url: d.url });
                        else toast.error('Erro ao enviar');
                      } catch { toast.error('Erro de conexão'); }
                      e.target.value = '';
                    }} />
                </label>
                {form.foto_url && (
                  <img src={form.foto_url} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-gray-200" />
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">
                Vídeo (YouTube URL ou arquivo MP4)
              </label>
              <Input placeholder="https://youtube.com/watch?v=... ou URL do vídeo" value={form.video_url ?? ''} onChange={(e) => setForm({ ...form, video_url: e.target.value })} />
              <label className="mt-1.5 flex items-center gap-1.5 cursor-pointer border border-dashed border-gray-300 hover:border-gold px-3 py-2 text-xs text-charcoal-muted hover:text-gold transition-colors">
                <Video size={12} /> Ou enviar arquivo de vídeo (.mp4, .mov)
                <input type="file" accept="video/mp4,video/quicktime,video/webm" className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 50 * 1024 * 1024) { toast.error('Máximo 50MB para vídeo'); e.target.value = ''; return; }
                    const fd = new FormData(); fd.append('file', file); fd.append('pasta', 'depoimentos');
                    toast.loading('Enviando vídeo...');
                    try {
                      const res = await fetch('/api/upload', { method: 'POST', body: fd });
                      const d = await res.json();
                      toast.dismiss();
                      if (d.url) { setForm({ ...form, video_url: d.url }); toast.success('Vídeo enviado!'); }
                      else toast.error('Erro ao enviar');
                    } catch { toast.dismiss(); toast.error('Erro de conexão'); }
                    e.target.value = '';
                  }} />
              </label>
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">
                Áudio (.mp3, .m4a, .ogg)
              </label>
              {form.audio_url && (
                <audio controls src={form.audio_url} className="w-full mb-1.5 h-8" />
              )}
              <label className="flex items-center gap-1.5 cursor-pointer border border-dashed border-gray-300 hover:border-gold px-3 py-2 text-xs text-charcoal-muted hover:text-gold transition-colors">
                <Volume2 size={12} /> {form.audio_url ? 'Trocar áudio' : 'Enviar arquivo de áudio'}
                <input type="file" accept="audio/mpeg,audio/mp4,audio/ogg,audio/wav" className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 20 * 1024 * 1024) { toast.error('Máximo 20MB para áudio'); e.target.value = ''; return; }
                    const fd = new FormData(); fd.append('file', file); fd.append('pasta', 'depoimentos');
                    toast.loading('Enviando áudio...');
                    try {
                      const res = await fetch('/api/upload', { method: 'POST', body: fd });
                      const d = await res.json();
                      toast.dismiss();
                      if (d.url) { setForm({ ...form, audio_url: d.url }); toast.success('Áudio enviado!'); }
                      else toast.error('Erro ao enviar');
                    } catch { toast.dismiss(); toast.error('Erro de conexão'); }
                    e.target.value = '';
                  }} />
              </label>
            </div>
            <Input label="Produto comprado" value={form.produto ?? ''} onChange={(e) => setForm({ ...form, produto: e.target.value })} />
            <div>
              <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">Nota</label>
              <select className="input-field" value={form.nota} onChange={(e) => setForm({ ...form, nota: Number(e.target.value) })}>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} estrelas</option>)}
              </select>
            </div>
            {/* Imagem do depoimento — print/foto com produto/Story Instagram */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">
                Imagem do depoimento (opcional · print, foto, story Instagram · máx. 2MB)
              </label>
              <div className="flex gap-2 items-start">
                <label className="flex items-center gap-1.5 cursor-pointer border border-dashed border-gray-300 hover:border-gold px-3 py-2 text-xs text-charcoal-muted hover:text-gold transition-colors flex-1 rounded-sm">
                  <ImageIcon size={12} />
                  {(form as Partial<Depoimento>).imagem_url ? 'Trocar imagem' : 'Enviar imagem do depoimento'}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 2 * 1024 * 1024) { toast.error('Máximo 2MB'); e.target.value = ''; return; }
                      const fd = new FormData(); fd.append('file', file); fd.append('pasta', 'depoimentos');
                      toast.loading('Enviando imagem...');
                      try {
                        const res = await fetch('/api/upload', { method: 'POST', body: fd });
                        const d = await res.json();
                        toast.dismiss();
                        if (d.url) { setForm({ ...form, imagem_url: d.url } as Partial<Depoimento>); toast.success('Imagem enviada!'); }
                        else toast.error('Erro ao enviar');
                      } catch { toast.dismiss(); toast.error('Erro de conexão'); }
                      e.target.value = '';
                    }} />
                </label>
                {(form as Partial<Depoimento>).imagem_url && (
                  <div className="relative">
                    <img src={(form as Partial<Depoimento>).imagem_url} alt="" className="w-20 h-24 object-cover rounded-sm border border-gray-200" />
                    <button type="button"
                      onClick={() => setForm({ ...form, imagem_url: undefined } as Partial<Depoimento>)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px]">
                      <X size={10} />
                    </button>
                  </div>
                )}
              </div>
              {(form as Partial<Depoimento>).imagem_url && (
                <Input
                  label="Descrição da imagem (acessibilidade)"
                  value={(form as Partial<Depoimento>).imagem_alt ?? ''}
                  onChange={(e) => setForm({ ...form, imagem_alt: e.target.value } as Partial<Depoimento>)}
                />
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">Depoimento *</label>
            <textarea rows={4} className="input-field resize-none" placeholder="Escreva o depoimento da cliente..."
              value={form.texto ?? ''} onChange={(e) => setForm({ ...form, texto: e.target.value })} />
          </div>
          <Toggle label="Ativo (visível no site)" checked={form.ativo ?? true} onChange={(v) => setForm({ ...form, ativo: v })} />
          <div className="flex gap-3">
            <Button onClick={adicionarNovo}>Adicionar Depoimento</Button>
            <Button variant="outline" onClick={() => { setNovo(false); setForm({ nota: 5, ativo: true }); }}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="space-y-3">
        {depoimentos.map((d) => (
          <div key={d.id} className={`bg-white rounded-sm shadow-sm overflow-hidden border-l-4 ${d.ativo ? 'border-green-400' : 'border-gray-200'}`}>
            <div className="flex items-center gap-4 px-5 py-4 cursor-pointer" onClick={() => setExpandido(expandido === d.id ? null : d.id)}>
              {d.foto_url ? (
                <img src={d.foto_url} alt={d.nome} className="w-10 h-10 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-cream-dark flex items-center justify-center shrink-0">
                  <User size={16} className="text-charcoal-muted" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-charcoal">{d.nome}</p>
                <p className="text-xs text-charcoal-muted truncate">{d.cidade} · {d.produto}</p>
              </div>
              <div className="flex items-center gap-3">
                {d.video_url && <Play size={14} className="text-gold" title="Tem vídeo" />}
                {(d as Depoimento & { audio_url?: string }).audio_url && <Volume2 size={14} className="text-gold" title="Tem áudio" />}
                {d.imagem_url && <ImageIcon size={14} className="text-gold" title="Tem imagem" />}
                <div className="flex gap-0.5">
                  {Array.from({ length: d.nota }).map((_, i) => <Star key={i} size={10} className="fill-gold text-gold" />)}
                </div>
                <Toggle checked={d.ativo} onChange={(v) => { update(d.id, 'ativo', v); }} />
                <button onClick={(e) => { e.stopPropagation(); deletar(d.id); }} className="text-red-400 hover:text-red-600 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {expandido === d.id && (
              <div className="px-5 pb-5 grid md:grid-cols-2 gap-4 border-t border-cream-darker pt-4">
                <Input label="Nome" value={d.nome} onChange={(e) => update(d.id, 'nome', e.target.value)} />
                <Input label="Cidade" value={d.cidade} onChange={(e) => update(d.id, 'cidade', e.target.value)} />
                <div>
                  <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">Foto (máx. 2MB)</label>
                  <div className="flex gap-2 items-center">
                    <label className="flex items-center gap-1.5 cursor-pointer border border-dashed border-gray-300 hover:border-gold px-3 py-2 text-xs text-charcoal-muted hover:text-gold transition-colors flex-1">
                      <Plus size={12} /> {d.foto_url ? 'Trocar' : 'Enviar'}
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 2 * 1024 * 1024) { toast.error('Máximo 2MB'); e.target.value = ''; return; }
                          const fd = new FormData(); fd.append('file', file); fd.append('pasta', 'depoimentos');
                          try {
                            const res = await fetch('/api/upload', { method: 'POST', body: fd });
                            const dd = await res.json();
                            if (dd.url) update(d.id, 'foto_url', dd.url);
                          } catch { toast.error('Erro'); }
                          e.target.value = '';
                        }} />
                    </label>
                    {d.foto_url && <img src={d.foto_url} alt="" className="w-10 h-10 rounded-full object-cover" />}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">Vídeo (YouTube ou arquivo)</label>
                  <Input value={d.video_url ?? ''} placeholder="https://youtube.com/watch?v=..." onChange={(e) => update(d.id, 'video_url', e.target.value)} />
                  <label className="mt-1.5 flex items-center gap-1.5 cursor-pointer border border-dashed border-gray-300 hover:border-gold px-3 py-2 text-xs text-charcoal-muted hover:text-gold transition-colors">
                    <Video size={12} /> Enviar arquivo de vídeo (.mp4, .mov)
                    <input type="file" accept="video/mp4,video/quicktime,video/webm" className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 50 * 1024 * 1024) { toast.error('Máximo 50MB'); e.target.value = ''; return; }
                        const fd = new FormData(); fd.append('file', file); fd.append('pasta', 'depoimentos');
                        toast.loading('Enviando vídeo...');
                        try {
                          const res = await fetch('/api/upload', { method: 'POST', body: fd });
                          const dd = await res.json();
                          toast.dismiss();
                          if (dd.url) { update(d.id, 'video_url', dd.url); toast.success('Vídeo enviado!'); }
                          else toast.error('Erro ao enviar');
                        } catch { toast.dismiss(); toast.error('Erro'); }
                        e.target.value = '';
                      }} />
                  </label>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">Áudio (.mp3, .m4a)</label>
                  {d.audio_url && <audio controls src={d.audio_url} className="w-full mb-1.5 h-8" />}
                  <label className="flex items-center gap-1.5 cursor-pointer border border-dashed border-gray-300 hover:border-gold px-3 py-2 text-xs text-charcoal-muted hover:text-gold transition-colors">
                    <Volume2 size={12} /> {d.audio_url ? 'Trocar áudio' : 'Enviar áudio'}
                    <input type="file" accept="audio/mpeg,audio/mp4,audio/ogg,audio/wav" className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 20 * 1024 * 1024) { toast.error('Máximo 20MB'); e.target.value = ''; return; }
                        const fd = new FormData(); fd.append('file', file); fd.append('pasta', 'depoimentos');
                        toast.loading('Enviando áudio...');
                        try {
                          const res = await fetch('/api/upload', { method: 'POST', body: fd });
                          const dd = await res.json();
                          toast.dismiss();
                          if (dd.url) { update(d.id, 'audio_url' as keyof Depoimento, dd.url); toast.success('Áudio enviado!'); }
                          else toast.error('Erro ao enviar');
                        } catch { toast.dismiss(); toast.error('Erro'); }
                        e.target.value = '';
                      }} />
                  </label>
                </div>
                <Input label="Produto" value={d.produto ?? ''} onChange={(e) => update(d.id, 'produto', e.target.value)} />
                <div>
                  <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">Nota</label>
                  <select className="input-field" value={d.nota} onChange={(e) => update(d.id, 'nota', Number(e.target.value))}>
                    {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} estrelas</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">Depoimento</label>
                  <textarea rows={3} className="input-field resize-none" value={d.texto} onChange={(e) => update(d.id, 'texto', e.target.value)} />
                </div>
                {/* Imagem do depoimento */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">
                    Imagem do depoimento (print, foto com produto, story · máx. 2MB)
                  </label>
                  <div className="flex gap-2 items-start">
                    <label className="flex items-center gap-1.5 cursor-pointer border border-dashed border-gray-300 hover:border-gold px-3 py-2 text-xs text-charcoal-muted hover:text-gold transition-colors flex-1 rounded-sm">
                      <ImageIcon size={12} />
                      {d.imagem_url ? 'Trocar imagem' : 'Enviar imagem'}
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 2 * 1024 * 1024) { toast.error('Máximo 2MB'); e.target.value = ''; return; }
                          const fd = new FormData(); fd.append('file', file); fd.append('pasta', 'depoimentos');
                          toast.loading('Enviando imagem...');
                          try {
                            const res = await fetch('/api/upload', { method: 'POST', body: fd });
                            const dd = await res.json();
                            toast.dismiss();
                            if (dd.url) { update(d.id, 'imagem_url' as keyof Depoimento, dd.url); toast.success('Imagem enviada!'); }
                            else toast.error('Erro ao enviar');
                          } catch { toast.dismiss(); toast.error('Erro'); }
                          e.target.value = '';
                        }} />
                    </label>
                    {d.imagem_url && (
                      <div className="relative">
                        <img src={d.imagem_url} alt={d.imagem_alt ?? ''} className="w-20 h-24 object-cover rounded-sm border border-gray-200" />
                        <button type="button"
                          onClick={() => update(d.id, 'imagem_url' as keyof Depoimento, '')}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px]">
                          <X size={10} />
                        </button>
                      </div>
                    )}
                  </div>
                  {d.imagem_url && (
                    <Input
                      label="Descrição da imagem (acessibilidade)"
                      value={d.imagem_alt ?? ''}
                      onChange={(e) => update(d.id, 'imagem_alt' as keyof Depoimento, e.target.value)}
                    />
                  )}
                </div>
                <div className="md:col-span-2">
                  <Button size="sm" onClick={() => salvar(depoimentos)}>Salvar Alterações</Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
