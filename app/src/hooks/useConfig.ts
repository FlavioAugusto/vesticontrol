'use client';

import { useState, useEffect } from 'react';

interface SiteConfig {
  logo: string;
  nome: string;
  telefone: string;
  horario: string;
  email: string;
  whatsapp: string;
}

const DEFAULTS: SiteConfig = {
  logo: '/images/logo.svg',
  nome: 'By Marcelo Medeiros',
  telefone: '(81) 99422-8240',
  horario: 'Seg–Sex: 08:00–18:00 | Sáb e Dom: sem atendimento',
  email: '',
  whatsapp: '81994228240',
};

let cachedConfig: SiteConfig | null = null;

function getWindowConfig(): Partial<SiteConfig> {
  if (typeof window === 'undefined') return {};
  return (window as Window & { __SITE_CONFIG__?: Partial<SiteConfig> }).__SITE_CONFIG__ ?? {};
}

async function fetchConfig(): Promise<SiteConfig> {
  if (cachedConfig) return cachedConfig;
  try {
    const res = await fetch('/api/config');
    const d = await res.json();
    cachedConfig = { ...DEFAULTS, ...d };
    return cachedConfig!;
  } catch {
    return DEFAULTS;
  }
}

export function useConfig(): SiteConfig {
  const winConf = getWindowConfig();
  const [config, setConfig] = useState<SiteConfig>({
    ...DEFAULTS,
    ...(cachedConfig ?? {}),
    ...winConf,
  });

  useEffect(() => {
    // Prioridade: cache → window config → fetch API
    if (cachedConfig) { setConfig({ ...DEFAULTS, ...cachedConfig }); return; }
    const wc = getWindowConfig();
    if (wc.logo) { setConfig(prev => ({ ...prev, ...wc })); }
    fetchConfig().then(c => setConfig(c));
  }, []);

  return config;
}

export { DEFAULTS as configDefaults };
