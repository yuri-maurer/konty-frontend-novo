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
  iconClass?: string;
}

const ALL_MODULES: Record<string, ModuleDef> = {
  'extrair-pdf': {
    key: 'extrair-pdf',
    name: 'Extrair PDF',
    path: '/modulos/extrair-pdf',
    // ATUALIZAÇÃO DE TEXTO:
    description: 'Separa recibo de pagamento por condomínio',
    category: 'Documentos',
    status: 'Ativo',
    color: 'blue',
    iconClass: 'fa-regular fa-file-lines',
  },
};

/**
 * Normaliza a lista de favoritos, convertendo chaves antigas para paths
 * e removendo duplicatas ou entradas inválidas.
 * @param rawFavorites - O array lido diretamente do localStorage.
 * @param allModules - O dicionário de todos os módulos para mapear chaves para paths.
 * @returns Um array de paths de favoritos limpo e normalizado.
 */
const normalizeFavorites = (rawFavorites: unknown, allModules: Record<string, ModuleDef>): string[] => {
  if (!Array.isArray(rawFavorites)) {
    return [];
  }

  const pathMap = Object.values(allModules).reduce((acc, mod) => {
    acc[mod.key] = mod.path;
    return acc;
  }, {} as Record<string, string>);

  const normalized = rawFavorites.map(fav => {
    // Se já for um path, mantém.
    if (typeof fav === 'string' && fav.startsWith('/')) {
      return fav;
    }
    // Se for uma chave antiga, converte para path.
    if (typeof fav === 'string' && pathMap[fav]) {
      return pathMap[fav];
    }
    // Caso contrário, é uma entrada inválida e será descartada.
    return null;
  }).filter((p): p is string => p !== null); // Filtra nulos e garante o tipo.

  // Remove duplicatas resultantes da migração e retorna.
  return Array.from(new Set(normalized));
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

  // ---------- Favoritos (PADRÃO POR PATH, para sincronizar com Sidebar) ----------
  const STORAGE_KEY = 'moduleFavorites';
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favHydrated, setFavHydrated] = useState(false);

  // EFEITO MODIFICADO: Adiciona a lógica de normalização no carregamento inicial.
  useEffect(() => {
    try {
      const storedRaw = localStorage.getItem(STORAGE_KEY);
      const rawFavorites = storedRaw ? JSON.parse(storedRaw) : [];
      
      // 1. Normaliza a lista de favoritos usando a função helper.
      const cleanedFavorites = normalizeFavorites(rawFavorites, ALL_MODULES);

      // 2. Atualiza o estado local com a lista já limpa.
      setFavorites(cleanedFavorites);

      // 3. Se a normalização alterou a lista, salva de volta no localStorage
      //    e dispara um evento para notificar outros componentes (como a Sidebar).
      if (JSON.stringify(rawFavorites) !== JSON.stringify(cleanedFavorites)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedFavorites));
        window.dispatchEvent(new CustomEvent('favorites-updated', { detail: cleanedFavorites }));
      }
    } catch (error) {
      console.error("Falha ao carregar ou normalizar favoritos:", error);
      setFavorites([]);
    }
    setFavHydrated(true);
  }, []); // Roda apenas uma vez na montagem do componente.

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

  return (
    <DashboardLayout
      modules={allowedModules.map((m) => ({ name: m.name, path: m.path, icon: (() => null) as any }))}
    >
      {/* Blocos superiores */}
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

      {/* ===== Seção Acesso Rápido ===== */}
      <section aria-labelledby="acesso-rapido-title" className="mb-4">
        <h2 id="acesso-rapido-title" className="text-lg font-semibold text-gray-900 mb-3">
          Acesso Rápido
        </h2>

        {loadingPerms ? (
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
                {/* Favoritar por PATH (compatível com Sidebar) */}
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

                {/* Ícone + Título */}
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
