// pages/dashboard.tsx
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import DashboardLayout from '../components/layout/DashboardLayout';

type Status = 'Ativo' | 'Pendente' | 'Novo';

interface ModuleDef {
  key: string;
  name: string;
  path: string;
  description?: string;
  category?: string;
  status?: Status;
  color?: string;
}

const ALL_MODULES: Record<string, ModuleDef> = {
  'extrair-pdf': {
    key: 'extrair-pdf',
    name: 'Extrair PDF',
    path: '/modulos/extrair-pdf',
    description: 'Extrai recibos de PDFs de notas fiscais.',
    category: 'Documentos',
    status: 'Ativo',
    color: 'blue',
  },
};

export default function DashboardPage() {
  const router = useRouter();
  const user = useUser();
  const supabase = useSupabaseClient();

  const [allowedKeys, setAllowedKeys] = useState<string[]>([]);
  const [loadingPerms, setLoadingPerms] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadPerms() {
      try {
        if (!user) return;
        const { data, error } = await supabase
          .from('permissoes')
          .select('modulo_nome, ativo')
          .eq('user_id', user.id)
          .eq('ativo', true);
        if (error) throw error;
        const keys = (data || []).map((r: any) => r.modulo_nome).filter(Boolean);
        if (isMounted) setAllowedKeys(keys);
      } catch {
        if (isMounted) setAllowedKeys(Object.keys(ALL_MODULES));
      } finally {
        if (isMounted) setLoadingPerms(false);
      }
    }
    loadPerms();
    return () => { isMounted = false; };
  }, [supabase, user]);

  const allowedModules = useMemo<ModuleDef[]>(() => {
    const keys = allowedKeys.length ? allowedKeys : Object.keys(ALL_MODULES);
    return keys.map((k) => ALL_MODULES[k]).filter(Boolean);
  }, [allowedKeys]);

  // ---------- Favoritos (hidratar antes de persistir) ----------
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favHydrated, setFavHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('moduleFavorites');
      if (stored) setFavorites(JSON.parse(stored));
    } catch {}
    setFavHydrated(true);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const value = (e as CustomEvent<string[]>).detail || [];
      setFavorites(Array.isArray(value) ? value : []);
    };
    window.addEventListener('favorites-updated', handler as EventListener);
    return () => window.removeEventListener('favorites-updated', handler as EventListener);
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'moduleFavorites') {
        try { setFavorites(JSON.parse(e.newValue || '[]')); } catch {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (!favHydrated) return;
    try { localStorage.setItem('moduleFavorites', JSON.stringify(favorites)); } catch {}
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('favorites-updated', { detail: favorites }));
    }
  }, [favorites, favHydrated]);

  return (
    <DashboardLayout
      modules={allowedModules.map((m) => ({ name: m.name, path: m.path, icon: (() => null) as any }))}
    >
      {/* SOMENTE os dois blocos solicitados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Módulos ativos</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{allowedModules.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Favoritos</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{favorites.length}</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
