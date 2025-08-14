// pages/dashboard.tsx
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import DashboardLayout from '../components/layout/DashboardLayout';

interface ModuleDef {
  key: string;
  name: string;
  path: string;
  description?: string;
  iconClass?: string;
}

const normalizeFavorites = (rawFavorites: unknown, allModules: ModuleDef[]): string[] => {
  if (!Array.isArray(rawFavorites) || allModules.length === 0) {
    return [];
  }

  const pathMap = allModules.reduce((acc, mod) => {
    acc[mod.key] = mod.path;
    return acc;
  }, {} as Record<string, string>);

  const normalized = rawFavorites.map(fav => {
    if (typeof fav === 'string' && fav.startsWith('/')) return fav;
    if (typeof fav === 'string' && pathMap[fav]) return pathMap[fav];
    return null;
  }).filter((p): p is string => p !== null);

  return Array.from(new Set(normalized));
};

export default function DashboardPage() {
  const router = useRouter();
  const user = useUser();
  const supabase = useSupabaseClient();

  const [allModules, setAllModules] = useState<ModuleDef[]>([]);
  const [allowedKeys, setAllowedKeys] = useState<string[]>([]);
  
  const [loadingModules, setLoadingModules] = useState(true);
  const [loadingPerms, setLoadingPerms] = useState(true);

  useEffect(() => {
    async function fetchAllModules() {
      try {
        const { data, error } = await supabase.from('modulos').select('*');
        if (error) throw error;
        setAllModules(data || []);
      } catch (error) {
        console.error("Erro ao buscar o catálogo de módulos:", error);
        setAllModules([]);
      } finally {
        setLoadingModules(false);
      }
    }
    fetchAllModules();
  }, [supabase]);

  useEffect(() => {
    async function fetchUserPermissions() {
      if (!user) {
        setLoadingPerms(false);
        return;
      };
      try {
        const { data, error } = await supabase
          .from('permissoes')
          .select('modulo_nome')
          .eq('user_id', user.id)
          .eq('ativo', true);
        if (error) throw error;
        const keys = (data || []).map((r: any) => r.modulo_nome).filter(Boolean);
        setAllowedKeys(keys);
      } catch (error) {
        console.error("Erro ao buscar permissões do usuário:", error);
        setAllowedKeys([]);
      } finally {
        setLoadingPerms(false);
      }
    }
    fetchUserPermissions();
  }, [supabase, user]);

  const allowedModules = useMemo<ModuleDef[]>(() => {
    if (loadingModules || loadingPerms) return [];
    return allModules.filter(module => allowedKeys.includes(module.key));
  }, [allModules, allowedKeys, loadingModules, loadingPerms]);

  // ---------- LÓGICA DE FAVORITOS CORRIGIDA ----------

  // CORREÇÃO: A chave do localStorage agora é dinâmica, baseada no ID do usuário.
  // Isso garante que os favoritos de cada usuário sejam armazenados separadamente.
  const STORAGE_KEY = useMemo(() => {
    if (!user) return null; // Retorna null se o usuário não estiver logado
    return `moduleFavorites_${user.id}`;
  }, [user]);

  const [favorites, setFavorites] = useState<string[]>([]);
  const [favHydrated, setFavHydrated] = useState(false);

  // Carrega os favoritos do localStorage quando a chave (STORAGE_KEY) estiver disponível.
  useEffect(() => {
    // Não executa se os módulos não foram carregados ou se não há um usuário logado (STORAGE_KEY é null)
    if (loadingModules || !STORAGE_KEY) return; 
    
    try {
      const storedRaw = localStorage.getItem(STORAGE_KEY);
      const rawFavorites = storedRaw ? JSON.parse(storedRaw) : [];
      
      const cleanedFavorites = normalizeFavorites(rawFavorites, allModules);

      setFavorites(cleanedFavorites);

      // Se a normalização limpou a lista, atualiza o localStorage
      if (JSON.stringify(rawFavorites) !== JSON.stringify(cleanedFavorites)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedFavorites));
      }
    } catch (error) {
      console.error("Falha ao carregar ou normalizar favoritos:", error);
      localStorage.removeItem(STORAGE_KEY); // Remove dados corrompidos
      setFavorites([]);
    }
    setFavHydrated(true);
  }, [loadingModules, allModules, STORAGE_KEY]); // Depende da STORAGE_KEY

  // Salva os favoritos no localStorage sempre que a lista 'favorites' ou a chave 'STORAGE_KEY' mudar.
  useEffect(() => {
    // Não salva se não estiver hidratado ou se não houver usuário logado
    if (!favHydrated || !STORAGE_KEY) return;
    try { 
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites)); 
    } catch (error) {
      console.error("Falha ao salvar favoritos no localStorage:", error);
    }
  }, [favorites, favHydrated, STORAGE_KEY]);

  const isFavoritePath = (path: string) => favorites.includes(path);
  
  const toggleFavoritePath = (path: string) => {
    setFavorites((prev) => {
      const next = prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path];
      return Array.from(new Set(next));
    });
  };

  const isLoading = loadingModules || loadingPerms;

  return (
    <DashboardLayout
      modules={allowedModules.map((m) => ({ name: m.name, path: m.path, icon: (() => null) as any }))}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Módulos ativos</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {isLoading ? '...' : allowedModules.length}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Favoritos</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {isLoading || !favHydrated ? '...' : favorites.length}
          </p>
        </div>
      </div>

      <section aria-labelledby="acesso-rapido-title" className="mb-4">
        <h2 id="acesso-rapido-title" className="text-lg font-semibold text-gray-900 mb-3">
          Acesso Rápido
        </h2>

        {isLoading ? (
          <div className="text-sm text-gray-500">Carregando módulos…</div>
        ) : allowedModules.length === 0 ? (
          <div className="text-sm text-gray-500">Nenhum módulo liberado para este usuário.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {allowedModules.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => router.push(m.path)}
                className="group text-left bg-white border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition rounded-xl p-4 relative focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <span className="absolute top-2 right-2">
                  <button
                    type="button"
                    aria-label={isFavoritePath(m.path) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                    onClick={(e) => { e.stopPropagation(); toggleFavoritePath(m.path); }}
                    className="p-1 rounded-md border border-gray-200 hover:border-yellow-300 hover:bg-yellow-50"
                    title={isFavoritePath(m.path) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                  >
                    <i className={isFavoritePath(m.path) ? 'fa-solid fa-star text-yellow-500' : 'fa-regular fa-star'} />
                  </button>
                </span>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 grid place-items-center rounded-lg bg-gray-50 border border-gray-200">
                    <i className={m.iconClass || 'fa-regular fa-circle'} />
                  </div>
                  <div>
                    <div className="text-base font-medium text-gray-900">{m.name}</div>
                    <p className="text-xs text-gray-500">
                      {m.description || 'Abrir módulo'}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}
