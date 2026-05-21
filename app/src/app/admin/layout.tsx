'use client';

import AdminSidebar from '@/components/admin/Sidebar';
import { useState, useEffect, useRef } from 'react';
import { Menu, X, Bell, Search, User, Settings, LogOut, Camera, Save, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

interface AdminPerfil {
  id: string;
  nome: string;
  nivel: string;
  email: string;
  foto_url?: string;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [perfilOpen, setPerfilOpen] = useState(false);
  const [modalPerfil, setModalPerfil] = useState(false);
  const [admin, setAdmin] = useState<AdminPerfil | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editFotoUrl, setEditFotoUrl] = useState('');
  const [uploadandoFoto, setUploadandoFoto] = useState(false);
  const [editSenhaAtual, setEditSenhaAtual] = useState('');
  const [editNovaSenha, setEditNovaSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const perfilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    carregarAdmin();
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (perfilRef.current && !perfilRef.current.contains(e.target as Node)) {
        setPerfilOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function carregarAdmin() {
    try {
      const res = await fetch('/api/admin/perfil', { cache: 'no-store' });

      // 🔒 Proteção dupla: se a API rejeitar (401/403), redireciona pro login
      if (res.status === 401) {
        const path = encodeURIComponent(window.location.pathname);
        window.location.href = `/login?next=${path}&motivo=sessao_expirada`;
        return;
      }
      if (res.status === 403) {
        window.location.href = '/?acesso=negado';
        return;
      }
      if (!res.ok) return;

      const data = await res.json();
      setAdmin({
        id: data.id,
        nome: data.nome,
        nivel: data.nivel,
        email: data.email ?? '',
        foto_url: data.foto_url ?? '',
      });
      setEditNome(data.nome === (data.email?.split('@')[0] ?? '') ? '' : data.nome);
      setEditFotoUrl(data.foto_url ?? '');
    } catch {
      // Falha de rede → tenta de novo daqui a 3s; se falhar de novo, redireciona
      setTimeout(async () => {
        try {
          const retry = await fetch('/api/admin/perfil', { cache: 'no-store' });
          if (!retry.ok) {
            const path = encodeURIComponent(window.location.pathname);
            window.location.href = `/login?next=${path}&erro=conexao`;
          }
        } catch {
          window.location.href = '/login?erro=conexao';
        }
      }, 3000);
    }
  }

  function abrirPerfil() {
    setPerfilOpen(false);
    setModalPerfil(true);
    setEditNome(admin?.nome ?? '');
    setEditFotoUrl(admin?.foto_url ?? '');
    setEditSenhaAtual('');
    setEditNovaSenha('');
  }

  async function salvarPerfil() {
    if (!editNome.trim()) { toast.error('Nome é obrigatório'); return; }
    if (editNovaSenha && editNovaSenha.length < 6) { toast.error('Nova senha deve ter no mínimo 6 caracteres'); return; }
    setSalvando(true);
    try {
      const res = await fetch('/api/admin/perfil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: editNome.trim(),
          foto_url: editFotoUrl,
          nova_senha: editNovaSenha || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Erro ao salvar'); return; }
      if (data.perfil) {
        setAdmin({
          id: data.perfil.id,
          nome: data.perfil.nome,
          nivel: data.perfil.nivel,
          email: data.perfil.email ?? '',
          foto_url: data.perfil.foto_url ?? '',
        });
      } else {
        setAdmin(prev => prev ? { ...prev, nome: editNome.trim(), foto_url: editFotoUrl } : prev);
      }
      toast.success('Perfil atualizado com sucesso!');
      setModalPerfil(false);
    } catch { toast.error('Erro ao salvar perfil'); }
    finally { setSalvando(false); }
  }

  async function sair() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  const iniciais = admin?.nome
    ? admin.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'BM';

  return (
    <div className="min-h-screen bg-[#f5f6fa] flex">
      {/* Sidebar desktop */}
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      {/* Sidebar mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10 animate-slide-in"><AdminSidebar /></div>
          <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 z-20 text-white bg-black/30 rounded-full p-1">
            <X size={20} />
          </button>
        </div>
      )}

      <main className="flex-1 overflow-auto min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-14 sm:h-16 gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-charcoal-muted hover:text-charcoal transition-colors flex-shrink-0">
                <Menu size={20} />
              </button>
              <div className="hidden sm:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 w-full max-w-xs md:max-w-sm focus-within:border-gold/50 transition-all">
                <Search size={13} className="text-gray-400 flex-shrink-0" />
                <input type="text" placeholder="Buscar..." className="bg-transparent text-sm text-charcoal placeholder:text-gray-400 outline-none w-full" />
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <button className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 hover:text-charcoal hover:bg-gray-100 transition-all">
                <Bell size={15} />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-gold rounded-full border-2 border-white" />
              </button>

              {/* Avatar clicável */}
              <div ref={perfilRef} className="relative">
                <button
                  onClick={() => setPerfilOpen(!perfilOpen)}
                  className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-gray-200 hover:opacity-80 transition-opacity"
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden shadow-sm shadow-gold/20 flex-shrink-0">
                    {admin?.foto_url
                      ? <img src={admin.foto_url} alt={admin.nome} className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-gradient-to-br from-gold to-gold-600 flex items-center justify-center text-white text-xs font-bold">{iniciais}</div>
                    }
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-[11px] font-semibold text-charcoal leading-tight">{admin?.nome ?? 'Admin'}</p>
                    <p className="text-[10px] text-gray-400 leading-tight capitalize">{admin?.nivel ?? 'admin'}</p>
                  </div>
                </button>

                {/* Dropdown do perfil */}
                {perfilOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                    {/* Info do admin */}
                    <div className="px-4 py-4 bg-gradient-to-br from-gold/5 to-amber-50 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden shadow-md shadow-gold/20">
                          {admin?.foto_url
                            ? <img src={admin.foto_url} alt={admin.nome} className="w-full h-full object-cover" />
                            : <div className="w-full h-full bg-gradient-to-br from-gold to-gold-600 flex items-center justify-center text-white font-bold text-base">{iniciais}</div>
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-charcoal text-sm truncate">{admin?.nome ?? 'Admin'}</p>
                          <p className="text-xs text-gray-500 truncate">{admin?.email}</p>
                          <span className="text-[10px] font-semibold text-gold uppercase tracking-wider">{admin?.nivel ?? 'admin'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="p-2">
                      <button onClick={abrirPerfil}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-charcoal hover:bg-gray-50 rounded-xl transition-colors text-left">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                          <User size={15} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">Meu Perfil</p>
                          <p className="text-[11px] text-gray-400">Nome, senha e dados</p>
                        </div>
                      </button>

                      <button onClick={() => { setPerfilOpen(false); window.location.href = '/admin/config'; }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-charcoal hover:bg-gray-50 rounded-xl transition-colors text-left">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                          <Settings size={15} className="text-amber-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">Configurações</p>
                          <p className="text-[11px] text-gray-400">Loja, pagamento, frete</p>
                        </div>
                      </button>

                      <div className="border-t border-gray-100 my-2" />

                      <button onClick={sair}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors text-left">
                        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                          <LogOut size={15} className="text-red-500" />
                        </div>
                        <p className="font-semibold text-sm">Sair</p>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="p-3 sm:p-5 lg:p-8 max-w-[1400px]">
          {children}
        </div>
      </main>

      {/* Modal de Perfil */}
      {modalPerfil && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setModalPerfil(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-br from-gold/10 to-amber-50 px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-4">
                {/* Avatar com upload */}
                <div className="relative group">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg shadow-gold/20">
                    {editFotoUrl
                      ? <img src={editFotoUrl} alt="Foto" className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-gradient-to-br from-gold to-gold-600 flex items-center justify-center text-white text-xl font-bold">{iniciais}</div>
                    }
                  </div>
                  <label className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    {uploadandoFoto
                      ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <Camera size={18} className="text-white" />
                    }
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={uploadandoFoto}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 2 * 1024 * 1024) { toast.error('Máximo 2MB'); return; }
                        setUploadandoFoto(true);
                        const fd = new FormData();
                        fd.append('file', file);
                        fd.append('pasta', 'admins');
                        try {
                          const res = await fetch('/api/upload', { method: 'POST', body: fd });
                          const d = await res.json();
                          if (d.url) setEditFotoUrl(d.url);
                          else toast.error('Erro ao enviar foto');
                        } catch { toast.error('Erro de conexão'); }
                        finally { setUploadandoFoto(false); e.target.value = ''; }
                      }}
                    />
                  </label>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gold border-2 border-white flex items-center justify-center">
                    <Camera size={9} className="text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="font-serif text-lg text-charcoal">{admin?.nome}</h3>
                  <p className="text-sm text-gray-500">{admin?.email}</p>
                  <span className="text-[10px] font-bold text-gold uppercase tracking-wider">{admin?.nivel}</span>
                  <p className="text-[10px] text-gray-400 mt-0.5">Passe o mouse na foto para trocar</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Nome */}
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Nome de exibição
                </label>
                <input
                  value={editNome}
                  onChange={e => setEditNome(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-gold/50 focus:ring-2 focus:ring-gold/10 transition-all"
                />
                <p className="text-[10px] text-gray-400 mt-1">Aparece no header e na sidebar do admin</p>
              </div>

              {/* Email — apenas leitura */}
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Email (login)
                </label>
                <input
                  value={admin?.email ?? ''}
                  readOnly
                  className="w-full border border-gray-100 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                />
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Alterar senha (opcional)</p>
                <div className="relative">
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    value={editNovaSenha}
                    onChange={e => setEditNovaSenha(e.target.value)}
                    placeholder="Nova senha (mín. 6 caracteres)"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-gold/50 focus:ring-2 focus:ring-gold/10 transition-all pr-10"
                  />
                  <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {mostrarSenha ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Deixe em branco para manter a senha atual</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={salvarPerfil}
                  disabled={salvando}
                  className="flex-1 bg-gradient-to-r from-gold to-gold-600 text-white py-3 rounded-xl text-sm font-semibold hover:from-gold-600 hover:to-gold-700 transition-all shadow-md shadow-gold/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {salvando
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Salvando...</>
                    : <><Save size={14} /> Salvar alterações</>
                  }
                </button>
                <button onClick={() => setModalPerfil(false)}
                  className="px-4 text-sm text-gray-500 hover:text-charcoal font-medium">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
