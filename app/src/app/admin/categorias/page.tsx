'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { Plus, Trash2, Layers, Upload, ExternalLink, Eye, AlertTriangle } from 'lucide-react';

interface Categoria {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  imagem_url: string | null;
  ativo: boolean;
  ordem: number;
}

export default function AdminCategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [novoNome, setNovoNome] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ nome: string; descricao: string; imagem_url: string }>({ nome: '', descricao: '', imagem_url: '' });
  const [confirmarExclusao, setConfirmarExclusao] = useState<string | null>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/categorias');
      const data = await res.json();
      setCategorias(data);
    } catch { toast.error('Erro ao carregar categorias'); }
    finally { setLoading(false); }
  }

  async function adicionar() {
    if (!novoNome.trim()) return;
    setSalvando(true);
    try {
      const res = await fetch('/api/admin/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: novoNome }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Erro'); return; }
      setCategorias(prev => [...prev, data]);
      setNovoNome('');
      toast.success('Categoria criada!');
    } catch { toast.error('Erro ao criar'); }
    finally { setSalvando(false); }
  }

  function iniciarEdicao(c: Categoria) {
    setEditId(c.id);
    setEditValues({ nome: c.nome, descricao: c.descricao ?? '', imagem_url: c.imagem_url ?? '' });
  }

  async function salvarEdicao(id: string) {
    setSalvando(true);
    try {
      const res = await fetch('/api/admin/categorias', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...editValues }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Erro'); return; }
      setCategorias(prev => prev.map(c => c.id === id ? data : c));
      setEditId(null);
      toast.success('Categoria atualizada!');
      await fetch('/api/revalidar', { method: 'POST' });
    } catch { toast.error('Erro ao salvar'); }
    finally { setSalvando(false); }
  }

  async function toggleAtivo(c: Categoria) {
    try {
      const res = await fetch('/api/admin/categorias', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: c.id, ativo: !c.ativo }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Erro'); return; }
      setCategorias(prev => prev.map(x => x.id === c.id ? data : x));
      toast.success(c.ativo ? 'Categoria desativada' : 'Categoria ativada');
    } catch { toast.error('Erro'); }
  }

  async function excluir(id: string) {
    try {
      const res = await fetch('/api/admin/categorias', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Erro ao excluir'); return; }
      setCategorias(prev => prev.filter(c => c.id !== id));
      setConfirmarExclusao(null);
      toast.success('Categoria excluída');
    } catch { toast.error('Erro'); }
  }

  async function uploadImagem(file: File, categoriaId: string) {
    if (file.size > 2 * 1024 * 1024) { toast.error('Arquivo acima de 2MB'); return; }
    setUploadingFor(categoriaId);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('pasta', 'categorias');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const d = await res.json();
      if (!d.url) { toast.error('Erro no upload'); return; }
      setEditValues(prev => ({ ...prev, imagem_url: d.url }));
      toast.success('Imagem enviada!');
    } catch { toast.error('Erro no upload'); }
    finally { setUploadingFor(null); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif text-charcoal tracking-tight">Categorias</h1>
          <p className="text-gray-400 text-sm mt-1">{categorias.length} categorias · gerencie nomes e capas</p>
        </div>
      </div>

      {/* Adicionar nova */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <Plus size={18} className="text-gold" />
          </div>
          <input
            value={novoNome}
            onChange={e => setNovoNome(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); adicionar(); } }}
            placeholder="Nome da nova categoria (ex: Lançamentos, Promoção...)"
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-gold/50 focus:ring-2 focus:ring-gold/10 outline-none transition-all"
          />
          <button
            onClick={adicionar}
            disabled={!novoNome.trim() || salvando}
            className="bg-gradient-to-r from-gold to-gold-600 text-white px-5 py-2.5 rounded-xl text-xs font-semibold disabled:opacity-50 hover:from-gold-600 hover:to-gold-700 transition-all">
            {salvando ? 'Criando...' : 'Criar'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-gray-100 rounded-2xl py-16 text-center shadow-sm">
          <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Carregando...</p>
        </div>
      ) : categorias.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl py-16 text-center shadow-sm">
          <Layers size={36} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">Nenhuma categoria cadastrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {categorias.map(c => {
            const editando = editId === c.id;
            return (
              <div key={c.id} className={`bg-white border rounded-2xl shadow-sm overflow-hidden ${editando ? 'border-gold' : 'border-gray-100'}`}>
                {/* Cover */}
                <div className="relative bg-gray-100" style={{ aspectRatio: '16/9' }}>
                  {(editando ? editValues.imagem_url : c.imagem_url) ? (
                    <Image src={editando ? editValues.imagem_url : c.imagem_url!} alt={c.nome} fill className="object-cover" sizes="400px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                      <span className="text-gray-300 text-xs">Sem capa</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <a href={`/categorias/${c.slug}`} target="_blank" rel="noopener"
                      className="w-7 h-7 bg-white/90 backdrop-blur rounded-lg flex items-center justify-center text-gray-600 hover:text-gold transition-colors">
                      <Eye size={13} />
                    </a>
                    {!editando && (
                      <button onClick={() => setConfirmarExclusao(c.id)}
                        className="w-7 h-7 bg-white/90 backdrop-blur rounded-lg flex items-center justify-center text-gray-600 hover:text-red-500 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  {!c.ativo && (
                    <div className="absolute top-2 left-2 bg-red-500/90 text-white text-[10px] font-semibold uppercase px-2 py-0.5 rounded">Inativa</div>
                  )}
                </div>

                {/* Body */}
                <div className="p-4 space-y-3">
                  {editando ? (
                    <>
                      <div>
                        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">Nome</label>
                        <input
                          value={editValues.nome}
                          onChange={e => setEditValues(p => ({ ...p, nome: e.target.value }))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-gold outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">Descrição</label>
                        <input
                          value={editValues.descricao}
                          onChange={e => setEditValues(p => ({ ...p, descricao: e.target.value }))}
                          placeholder="Conjuntos coordenados de alta costura"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-gold outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">Capa da página interna</label>
                        <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-gold rounded-lg py-3 cursor-pointer transition-colors">
                          {uploadingFor === c.id ? (
                            <><div className="w-3 h-3 border-2 border-gold/30 border-t-gold rounded-full animate-spin" /> <span className="text-xs text-gray-500">Enviando...</span></>
                          ) : (
                            <><Upload size={13} className="text-gray-400" /> <span className="text-xs text-gray-500">{editValues.imagem_url ? 'Trocar imagem' : 'Enviar imagem'}</span></>
                          )}
                          <input type="file" accept="image/*" className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) uploadImagem(f, c.id); }} />
                        </label>
                        <p className="text-[10px] text-gray-400 mt-1">Tamanho ideal: 1600×600px (banner). Max 2MB.</p>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => salvarEdicao(c.id)} disabled={salvando}
                          className="flex-1 bg-gold text-white text-xs font-semibold py-2 rounded-lg hover:bg-gold-600 transition-colors disabled:opacity-50">
                          Salvar
                        </button>
                        <button onClick={() => setEditId(null)}
                          className="px-3 text-xs text-gray-500 hover:text-charcoal">
                          Cancelar
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="font-semibold text-charcoal">{c.nome}</p>
                        <p className="text-[11px] text-gray-400 font-mono">/{c.slug}</p>
                        {c.descricao && <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{c.descricao}</p>}
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-gray-100">
                        <button onClick={() => iniciarEdicao(c)}
                          className="flex-1 text-xs font-semibold text-gold border border-gold/30 hover:bg-gold/5 py-2 rounded-lg transition-colors">
                          Editar
                        </button>
                        <button onClick={() => toggleAtivo(c)}
                          className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-colors ${c.ativo ? 'text-gray-500 border border-gray-200 hover:bg-gray-50' : 'text-emerald-600 border border-emerald-200 hover:bg-emerald-50'}`}>
                          {c.ativo ? 'Desativar' : 'Ativar'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal exclusão */}
      {confirmarExclusao && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setConfirmarExclusao(null)}>
          <div className="bg-white border border-gray-100 p-6 max-w-md w-full rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-4">
              <AlertTriangle size={20} className="text-red-500" />
            </div>
            <h3 className="font-semibold text-charcoal text-lg mb-2">Excluir categoria</h3>
            <p className="text-sm text-gray-500 mb-6">Não é possível excluir se existirem produtos vinculados.</p>
            <div className="flex gap-3">
              <button onClick={() => excluir(confirmarExclusao)}
                className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-red-600">
                Sim, excluir
              </button>
              <button onClick={() => setConfirmarExclusao(null)}
                className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
