// components/sidebar/Sidebar.tsx
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import type { IconType } from 'react-icons';

type View = 'root' | 'favoritos' | 'modulos';

interface Module {
  name: string;
  path: string;
  icon: IconType;
}

interface SidebarProps {
  modules: Module[];
}

const getInitials = (email?: string | null) => {
  if (!email) return 'U';
  const handle = email.split('@')[0] || 'user';
  return handle.slice(0, 2).toUpperCase();
};

const Sidebar: React.FC<SidebarProps> = ({ modules }) => {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const user = useUser();

  // ----- Favoritos (localStorage: "moduleFavorites") -----
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('moduleFavorites');
      if (raw) setFavorites(JSON.parse(raw));
    } catch {}
  }, []);

  // Emit and persist on change
  useEffect(() => {
    try { localStorage.setItem('moduleFavorites', JSON.stringify(favorites)); } catch {}
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('favorites-updated', { detail: favorites }));
    }
  }, [favorites]);

  const toggleFavorite = (path: string) => {
    setFavorites(prev => prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]);
  };

  // ----- Navegação em 2 níveis dentro da própria sidebar -----
  const [view, setView] = useState<View>('root');
  const rootFirstRef = useRef<HTMLAnchorElement | HTMLButtonElement>(null);
  const panelFirstRef = useRef<HTMLButtonElement>(null);

  // Foco ao trocar de view (acessibilidade)
  useEffect(() => {
    const el = view === 'root' ? rootFirstRef.current : panelFirstRef.current;
    el?.focus();
  }, [view]);

  // ESC volta ao root
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && view !== 'root') {
        e.preventDefault();
        setView('root');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Lista a renderizar no painel
  const panelList: Module[] = useMemo(() => {
    if (view === 'modulos') return modules;
    if (view === 'favoritos') return modules.filter(m => favorites.includes(m.path));
    return [];
  }, [view, modules, favorites]);

  return (
    <aside className="bg-white flex flex-col border-r border-gray-200 w-[280px] overflow-hidden">
      {/* Brand */}
      <div className="h-14 flex items-center px-4">
        <Link href="/dashboard" className="text-2xl font-bold text-blue-700">
          Konty Sistemas
        </Link>
      </div>

      {/* Área deslizável: ROOT ↔ PAINEL */}
      <div className="relative flex-1 overflow-hidden">
        <div
          className={`absolute inset-0 flex transition-transform duration-300 ease-out ${
            view === 'root' ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ width: '200%' }}
        >
          {/* ROOT */}
          <div className="w-1/2 flex flex-col overflow-y-auto px-2 pt-2 space-y-1">
            <Link
              href="/dashboard"
              ref={rootFirstRef as any}
              className={`block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition ${
                router.pathname === '/dashboard' ? 'bg-gray-100 font-semibold' : ''
              }`}
            >
              Início
            </Link>
            <button
              className="text-left px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition"
              onClick={() => setView('favoritos')}
            >
              Favoritos
            </button>
            <button
              className="text-left px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition"
              onClick={() => setView('modulos')}
            >
              Módulos
            </button>

            <p className="px-3 pt-3 text-xs font-semibold text-gray-400 uppercase">Navegação</p>
            <ul className="mt-1 space-y-1 pb-3">
              {modules.map((m) => (
                <li key={m.path}>
                  <Link
                    href={m.path}
                    className={`block px-3 py-2 rounded-md transition ${
                      router.pathname.startsWith(m.path)
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {m.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* PAINEL (Favoritos ou Módulos) */}
          <div className="w-1/2 flex flex-col border-l border-gray-100">
            <div className="h-14 flex items-center justify-between px-2 sm:px-3 border-b">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setView('root')}
                  className="p-2 rounded-md hover:bg-gray-100"
                  aria-label="Voltar"
                  title="Voltar"
                >
                  ←
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
                    return (
                      <li key={m.path} className="flex items-center justify-between">
                        <button
                          ref={idx === 0 ? panelFirstRef : undefined}
                          onClick={() => router.push(m.path)}
                          className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-gray-50 text-left flex-1"
                          title={m.name}
                        >
                          <div className="w-2 h-2 rounded-full bg-blue-600" />
                          <span className="text-sm text-gray-800 truncate">{m.name}</span>
                        </button>
                        <button
                          onClick={() => toggleFavorite(m.path)}
                          title={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                          className={`px-2 py-1 text-sm rounded-md ${isFav ? 'text-yellow-600' : 'text-gray-300'}`}
                          aria-label={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
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

      {/* Rodapé com usuário */}
      <div className="border-t border-gray-200 p-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-semibold">
            {getInitials(user?.email)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{user?.email || 'Usuário'}</p>
            <div className="flex items-center gap-3 mt-1">
              <Link href="/perfil" className="text-xs text-gray-600 hover:underline">Perfil</Link>
              <button onClick={handleLogout} className="text-xs text-red-600 hover:underline">Sair</button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
