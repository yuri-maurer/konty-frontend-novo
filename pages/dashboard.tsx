// pages/dashboard.tsx
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import DashboardLayout from '../components/layout/DashboardLayout';

// A interface do Módulo permanece a mesma, mas agora ela reflete
// a estrutura da sua tabela 'modulos' no Supabase.
interface ModuleDef {
  key: string;
  name: string;
  path: string;
  description?: string;
  iconClass?: string;
  // Outros campos como 'category', 'status', 'color' foram removidos
  // pois não estão na nova tabela 'modulos'. Podem ser adicionados lá se necessário.
}

/**
 * Normaliza a lista de favoritos, convertendo chaves antigas para paths.
 * Esta função agora aceita um array de ModuleDef, vindo diretamente do Supabase.
 * @param rawFavorites - O array lido diretamente do localStorage.
 * @param allModules - O array de todos os módulos disponíveis no sistema.
 * @returns Um array de paths de favoritos limpo e normalizado.
 */
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

  // --- NOVOS ESTADOS PARA CARREGAMENTO DINÂMICO ---
  // Armazena a lista de TODOS os módulos vindos da tabela 'modulos'
  const [allModules, setAllModules] = useState<ModuleDef[]>([]);
  // Armazena as chaves dos módulos que o usuário atual tem permissão para usar
  const [allowedKeys, setAllowedKeys] = useState<string[]>([]);
  
  // Controla o estado de carregamento das duas fontes de dados
  const [loadingModules, setLoadingModules] = useState(true);
  const [loadingPerms, setLoadingPerms] = useState(true);

  // --- EFEITO 1: BUSCAR O CATÁLOGO DE MÓDULOS ---
  // Este useEffect roda uma vez para buscar a lista completa de módulos do Supabase.
  useEffect(() => {
    async function fetchAllModules() {
      try {
        // Seleciona todas as colunas de todos os registros da tabela 'modulos'
        const { data, error } = await supabase.from('modulos').select('*');
        if (error) throw error;
        setAllModules(data || []);
      } catch (error) {
        console.error("Erro ao buscar o catálogo de módulos:", error);
        setAllModules([]); // Em caso de erro, a lista fica vazia
      } finally {
        setLoadingModules(false);
      }
    }
    fetchAllModules();
  }, [supabase]);

  // --- EFEITO 2: BUSCAR AS PERMISSÕES DO USUÁRIO ---
  // Este useEffect busca as permissões do usuário logado.
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

  // --- LÓGICA DE MÓDULOS PERMITIDOS (useMemo) ---
  // Este hook reage às mudanças e calcula a lista final de módulos permitidos
  // cruzando a lista de todos os módulos com as chaves de permissão do usuário.
  const allowedModules = useMemo<ModuleDef[]>(() => {
    if (loadingModules || loadingPerms) return [];
    return allModules.filter(module => allowedKeys.includes(module.key));
  }, [allModules, allowedKeys, loadingModules, loadingPerms]);

  // ---------- LÓGICA DE FAVORITOS (Adaptada) ----------
  const STORAGE_KEY = 'moduleFavorites';
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favHydrated, setFavHydrated] = useState(false);

  // Este useEffect agora depende do carregamento dos módulos para poder normalizar.
  useEffect(() => {
    // Só executa a lógica de normalização DEPOIS que a lista de módulos for carregada.
    if (loadingModules) return; 
    
    try {
      const storedRaw = localStorage.getItem(STORAGE_KEY);
      const rawFavorites = storedRaw ? JSON.parse(storedRaw) : [];
      
      // Usa a lista 'allModules' vinda do banco de dados para a normalização.
      const cleanedFavorites = normalizeFavorites(rawFavorites, allModules);

      setFavorites(cleanedFavorites);

      if (JSON.stringify(rawFavorites) !== JSON.stringify(cleanedFavorites)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedFavorites));
        window.dispatchEvent(new CustomEvent('favorites-updated', { detail: cleanedFavorites }));
      }
    } catch (error) {
      console.error("Falha ao carregar ou normalizar favoritos:", error);
      setFavorites([]);
    }
    setFavHydrated(true);
  }, [loadingModules, allModules]); // Depende de 'allModules' para funcionar corretamente.

  // O restante da lógica de favoritos permanece igual, reagindo a eventos.
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
      if (e.key === STORAGE_KEY) {
        try { setFavorites(JSON.parse(e.newValue || '[]')); } catch {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (!favHydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites)); } catch {}
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('favorites-updated', { detail: favorites }));
    }
  }, [favorites, favHydrated]);

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
      {/* Blocos superiores */}
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
            {isLoading ? '...' : favorites.length}
          </p>
        </div>
      </div>

      {/* ===== Seção Acesso Rápido ===== */}
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
