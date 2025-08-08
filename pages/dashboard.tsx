// pages/dashboard.tsx
import { useEffect, useMemo, useState } from 'react';
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
  const user = useUser();
  const supabase = useSupabaseClient();

  // Permissões -> módulos liberados
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
        // fallback: libera tudo se houver falha (evita travar o dashboard)
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

  // Favoritos (array de paths) + sincronização via evento
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('moduleFavorites');
      if (stored) setFavorites(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem('moduleFavorites', JSON.stringify(favorites)); } catch {}
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('favorites-updated', { detail: favorites }));
    }
  }, [favorites]);

  return (
    <DashboardLayout
      modules={allowedModules.map((m) => ({ name: m.name, path: m.path, icon: (() => null) as any }))}
    >
      {/* Cards de métricas: apenas "Módulos ativos" e "Favoritos" */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
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
