// components/sidebar/Sidebar.tsx
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { FiHome, FiStar, FiPackage, FiChevronRight } from 'react-icons/fi';
import type { IconType } from 'react-icons';

type View = 'root' | 'favoritos' | 'modulos';
const STORAGE_KEY = 'sidebar:view';

interface Module {
  name: string;
  path: string;
  icon: IconType;
}

interface SidebarProps {
  modules: Module[];
  collapsed?: boolean;
  onToggle?: () => void;
  onOpenPanel?: (type: 'favoritos' | 'modulos') => void;
}

const getInitials = (email?: string | null) => {
  if (!email) return 'U';
  const handle = email.split('@')[0] || 'user';
  return handle.slice(0, 2).toUpperCase();
};

const Sidebar: React.FC<SidebarProps> = ({ modules }) => {
  const router = useRouter();
  const supabaseClient = useSupabaseClient();
  const user = useUser();

  const [favorites, setFavorites] = useState<string[]>([]);
  const [favHydrated, setFavHydrated] = useState(false);

  // EFEITO MODIFICADO: Adiciona uma limpeza defensiva no carregamento inicial.
  useEffect(() => {
    try {
      const raw = localStorage.getItem('moduleFavorites');
      const storedFavorites = raw ? JSON.parse(raw) : [];

      // Apenas aceita favoritos que já estão no formato de path (começam com '/').
      // Isso evita que a UI mostre uma contagem errada caso carregue com dados antigos.
      if (Array.isArray(storedFavorites)) {
        const cleanedFavorites = storedFavorites.filter(fav => typeof fav === 'string' && fav.startsWith('/'));
        setFavorites(cleanedFavorites);
      } else {
        setFavorites([]);
      }
    } catch (error) {
      console.error("Falha ao carregar favoritos na sidebar:", error);
      setFavorites([]);
    }
    setFavHydrated(true);
  }, []); // Roda apenas uma vez na montagem do componente.

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string[]>).detail || [];
      setFavorites(Array.isArray(detail) ? detail : []);
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
    // A escrita no localStorage é controlada principalmente pelo dashboard.
    // Este componente reage às mudanças.
    if (!favHydrated) return;
    // A linha abaixo é mantida para o caso de a sidebar modificar os favoritos diretamente.
    try { localStorage.setItem('moduleFavorites', JSON.stringify(favorites)); } catch {}
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('favorites-updated', { detail: favorites }));
    }
  }, [favorites, favHydrated]);

  const toggleFavorite = (path: string) => {
    setFavorites(prev => {
        const next = prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path];
        return Array.from(new Set(next));
    });
  };

  const [view, setView] = useState<View>('root');
  const rootFirstRef = useRef<HTMLAnchorElement | HTMLButtonElement>(null);
  const panelFirstRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY) as View | null;
      if (stored === 'favoritos' || stored === 'modulos' || stored === 'root') {
        setView(stored);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const el = view === 'root' ? rootFirstRef.current : panelFirstRef.current;
    el?.focus();
  }, [view]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && view !== 'root') {
        e.preventDefault();
        setView('root');
        try { sessionStorage.setItem(STORAGE_KEY, 'root'); } catch {}
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view]);

  const panelList = useMemo(() => {
    if (view === 'modulos') return modules;
    if (view === 'favoritos') return modules.filter(m => favorites.includes(m.path));
    return [];
  }, [view, modules, favorites]);

  const isActiveRoot = (path: string) => router.pathname === path;

  return (
    <aside className="bg-white flex flex-col border-r border-gray-200 w-[280px] overflow-hidden">
      <div className="h-14 flex items-center px-4">
        <Link href="/dashboard" className="text-2xl font-bold text-blue-700" onClick={() => { try { sessionStorage.setItem(STORAGE_KEY, 'root'); } catch {} }}>
          Konty Sistemas
        </Link>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <div
          className={`absolute inset-0 flex transition-transform duration-300 ease-out ${view === 'root' ? 'translate-x-0' : '-translate-x-1/2'}`}
          style={{ width: '200%' }}
        >
          <div className="w-1/2 flex flex-col overflow-y-auto px-2 pt-2 space-y-1">
            <Link
              href="/dashboard"
              ref={rootFirstRef as any}
              onClick={() => { try { sessionStorage.setItem(STORAGE_KEY, 'root'); } catch {} }}
              className={`flex items-center justify-between px-3 py-2 rounded-md transition group ${
                isActiveRoot('/dashboard') ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <FiHome className="group-hover:text-blue-500" />
                Início
              </span>
            </Link>
            <button
              className={`flex items-center justify-between w-full px-3 py-2 rounded-md transition group ${
                view === 'favoritos' ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => { setView('favoritos'); try { sessionStorage.setItem(STORAGE_KEY, 'favoritos'); } catch {} }}
            >
              <span className="flex items-center gap-2">
                <FiStar className="group-hover:text-blue-500" />
                Favoritos
              </span>
              <FiChevronRight />
            </button>
            <button
              className={`flex items-center justify-between w-full px-3 py-2 rounded-md transition group ${
                view === 'modulos' ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => { setView('modulos'); try { sessionStorage.setItem(STORAGE_KEY, 'modulos'); } catch {} }}
            >
              <span className="flex items-center gap-2">
                <FiPackage className="group-hover:text-blue-500" />
                Módulos
              </span>
              <FiChevronRight />
            </button>
          </div>

          <div className="w-1/2 flex flex-col border-l border-gray-100">
            <div className="h-14 flex items-center justify-between px-2 sm:px-3 border-b">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setView('root'); try { sessionStorage.setItem(STORAGE_KEY, 'root'); } catch {} }}
                  className="p-2 rounded-lg border border-blue-100 text-blue-600 bg-gray-100 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
                  aria-label="Voltar"
                  title="Voltar"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <h3 className="text-sm font-semibold text-gray-800">
                  {view === 'favoritos' ? 'Favoritos' : 'Módulos'}
                </h3>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-2">
              {panelList.length === 0 ? (
                <p className="text-sm text-gray-500 px-2">
                  {view === 'favoritos' ? 'Nenhum favorito ainda.' : 'Nenhum módulo disponível.'}
                </p>
              ) : (
                <ul className="space-y-1">
                  {panelList.map((m, idx) => {
                    const isFav = favorites.includes(m.path);
                    const isActive = router.pathname.startsWith(m.path);
                    return (
                      <li key={m.path} className="flex items-center justify-between">
                        <button
                          ref={idx === 0 ? panelFirstRef : undefined}
                          onClick={() => { try { sessionStorage.setItem(STORAGE_KEY, view); } catch {} ; router.push(m.path); }}
                          className={`flex items-center gap-0 px-3 py-2 rounded-md text-left flex-1 bg-white hover:bg-gray-50 ${isActive ? 'bg-blue-50 text-blue-700' : ''}`}
                          title={m.name}
                        >
                          <span className={`text-base font-medium ${isActive ? 'text-blue-700' : 'text-gray-800'} truncate`}>{m.name}</span>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(m.path); }}
                          title={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                          className={`shrink-0 p-3 text-2xl rounded-md drop-shadow-sm transition ${isFav ? 'text-yellow-400' : 'text-gray-500'} hover:scale-110`}
                          aria-label={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                          type="button"
                        >
                          {isFav ? '★' : '☆'}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 p-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-semibold">
            {getInitials(user?.email)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{user?.email || 'Usuário'}</p>
            <div className="flex items-center gap-3 mt-1">
              <Link href="/perfil" className="text-xs text-gray-600 hover:underline">Perfil</Link>
              <button onClick={async () => { await supabaseClient.auth.signOut(); router.push('/login'); }} className="text-xs text-red-600 hover:underline">Sair</button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
