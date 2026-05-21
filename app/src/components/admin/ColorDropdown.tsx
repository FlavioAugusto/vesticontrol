'use client';

import { useState, useEffect, useRef } from 'react';
import { Check } from 'lucide-react';

export const CORES_PREDEFINIDAS = [
  { nome: 'Preto', hex: '#000000' },
  { nome: 'Branco', hex: '#FFFFFF' },
  { nome: 'Vermelho', hex: '#C0392B' },
  { nome: 'Azul Marinho', hex: '#1B2A4A' },
  { nome: 'Azul Royal', hex: '#2E86C1' },
  { nome: 'Azul Bebê', hex: '#AED6F1' },
  { nome: 'Rosa', hex: '#E91E8C' },
  { nome: 'Rosa Bebê', hex: '#F5B7C5' },
  { nome: 'Rosa Antigo', hex: '#C4848C' },
  { nome: 'Nude', hex: '#D2B48C' },
  { nome: 'Bege', hex: '#F5F0E8' },
  { nome: 'Dourado', hex: '#B89155' },
  { nome: 'Prata', hex: '#C0C0C0' },
  { nome: 'Verde', hex: '#27AE60' },
  { nome: 'Verde Militar', hex: '#556B2F' },
  { nome: 'Verde Esmeralda', hex: '#2ECC71' },
  { nome: 'Bordô', hex: '#800020' },
  { nome: 'Vinho', hex: '#722F37' },
  { nome: 'Marsala', hex: '#986868' },
  { nome: 'Lilás', hex: '#C39BD3' },
  { nome: 'Lavanda', hex: '#D7BDE2' },
  { nome: 'Amarelo', hex: '#F1C40F' },
  { nome: 'Laranja', hex: '#E67E22' },
  { nome: 'Coral', hex: '#FF7F50' },
  { nome: 'Terracota', hex: '#CC5A3A' },
  { nome: 'Cinza', hex: '#808080' },
  { nome: 'Cinza Claro', hex: '#D5D5D5' },
  { nome: 'Creme', hex: '#FFFDD0' },
  { nome: 'Caramelo', hex: '#C68E42' },
  { nome: 'Marrom', hex: '#6B3A2A' },
  { nome: 'Off-White', hex: '#FAF0E6' },
  { nome: 'Estampado', hex: '#RAINBOW' },
];

function isRainbow(hex: string) { return hex === '#RAINBOW'; }

function colorStyle(hex: string): React.CSSProperties {
  if (isRainbow(hex)) return { background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' };
  return { backgroundColor: hex };
}

interface Props {
  value: string;
  hexValue: string;
  onChange: (nome: string, hex: string) => void;
}

export default function ColorDropdown({ value, hexValue, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [customColors, setCustomColors] = useState<{ nome: string; hex: string }[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        // Busca loja_id do admin logado antes de pedir as cores
        const lojaRes = await fetch('/api/admin/minha-loja', { cache: 'no-store' });
        let lojaId = '';
        if (lojaRes.ok) {
          const d = await lojaRes.json();
          lojaId = d.loja_id || '';
        }
        const url = lojaId
          ? `/api/admin/cores?loja_id=${encodeURIComponent(lojaId)}`
          : '/api/admin/cores';
        const coresRes = await fetch(url, { cache: 'no-store' });
        const data = await coresRes.json();
        if (Array.isArray(data)) setCustomColors(data);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const allColors = [...CORES_PREDEFINIDAS, ...customColors];

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 border border-gray-200 rounded-sm px-3 py-2 text-sm hover:border-gold transition-colors bg-white">
        <div className="w-5 h-5 rounded-full border border-gray-300 flex-shrink-0"
          style={colorStyle(hexValue || '#ccc')} />
        <span className="flex-1 text-left truncate">{value || 'Selecionar cor...'}</span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-[580px] max-w-[95vw] bg-white border border-gray-200 rounded-xl shadow-2xl overflow-y-auto max-h-[70vh]">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-2.5 z-10">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Cores predefinidas</p>
          </div>
          {/* Cores predefinidas em grid 4 colunas */}
          <div className="grid grid-cols-4 gap-0.5 p-2">
            {CORES_PREDEFINIDAS.map((c) => (
              <button key={c.nome} type="button"
                onClick={() => { onChange(c.nome, c.hex); setOpen(false); }}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs hover:bg-cream transition-colors border ${value === c.nome ? 'bg-gold/10 border-gold' : 'border-transparent'}`}>
                <div className="w-5 h-5 rounded-full border border-gray-200 flex-shrink-0 shadow-sm" style={colorStyle(c.hex)} />
                <span className="flex-1 text-left truncate">{c.nome}</span>
                {value === c.nome && <Check size={12} className="text-gold flex-shrink-0" />}
              </button>
            ))}
          </div>

          {/* Cores personalizadas */}
          {customColors.length > 0 && (
            <>
              <div className="px-4 py-2 bg-amber-50 border-y border-amber-100">
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">⭐ Minhas cores personalizadas ({customColors.length})</p>
              </div>
              <div className="grid grid-cols-4 gap-0.5 p-2">
                {customColors.map((c) => (
                  <button key={c.nome} type="button"
                    onClick={() => { onChange(c.nome, c.hex); setOpen(false); }}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs hover:bg-amber-50 transition-colors border ${value === c.nome ? 'bg-gold/10 border-gold' : 'border-transparent'}`}>
                    <div className="w-5 h-5 rounded-full border border-gray-200 flex-shrink-0 shadow-sm" style={colorStyle(c.hex)} />
                    <span className="flex-1 text-left truncate">{c.nome}</span>
                    {value === c.nome && <Check size={12} className="text-gold flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Link para gerenciar */}
          <div className="border-t border-gray-100 bg-gray-50 px-3 py-2.5">
            <a href="/admin/cores" target="_blank"
              className="text-xs text-gold font-semibold hover:underline flex items-center gap-1.5">
              + Gerenciar cores personalizadas
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
