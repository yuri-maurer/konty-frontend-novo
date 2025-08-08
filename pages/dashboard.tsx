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

  const toggleFavorite = (path: string) => {
    setFavorites(prev => prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]);
  };

  const [query, setQuery] = useState('');
  useEffect(() => {
    const handler = (e: Event) => {
      const value = (e as CustomEvent<string>).detail ?? '';
      setQuery(value?.toLowerCase?.() || '');
    };
    window.addEventListener('global-search', handler as EventListener);
    return () => window.removeEventListener('global-search', handler as EventListener);
  }, []);

  const filtered = useMemo(() => {
    const list = allowedModules;
    if (!query) return list;
    return list.filter((m) => {
      const blob = `${m.name} ${m.description ?? ''} ${m.category ?? ''}`.toLowerCase();
      return blob.includes(query);
    });
  }, [allowedModules, query]);

  return (
    <DashboardLayout
      modules={allowedModules.map((m) => ({ name: m.name, path: m.path, icon: (() => null) as any }))}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Módulos ativos</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{allowedModules.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Favoritos</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{favorites.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Pendências</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {allowedModules.filter((m) => m.status === 'Pendente').length}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Novos</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {allowedModules.filter((m) => m.status === 'Novo').length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-500">
            Nenhum módulo encontrado.
          </div>
        ) : (
          filtered.map((m) => {
            const isFav = favorites.includes(m.path);
            return (
              <div key={m.key} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-gray-900">{m.name}</div>
                  <button
                    onClick={() => toggleFavorite(m.path)}
                    title={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                    className={`text-lg ${isFav ? 'text-yellow-500' : 'text-gray-300'} hover:scale-110 transition`}
                  >
                    {isFav ? '★' : '☆'}
                  </button>
                </div>
                <p className="text-sm text-gray-600">{m.description || '—'}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs border border-gray-200 text-gray-600">
                    {m.category || 'Geral'}
                  </span>
                  <a href={m.path} className="text-sm font-medium text-blue-700 hover:underline">Abrir</a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
}
