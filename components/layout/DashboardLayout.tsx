// components/layout/DashboardLayout.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Sidebar from '../sidebar/Sidebar';
import type { IconType } from 'react-icons';

interface Module {
  name: string;
  path: string;
  icon: IconType;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  modules: Module[];
}

type PanelType = 'favoritos' | 'modulos' | null;

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, modules }) => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Painel e favoritos
  const [panel, setPanel] = useState<PanelType>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Carregar favoritos do localStorage
  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('moduleFavorites') : null;
    if (stored) {
      try { setFavorites(JSON.parse(stored)); } catch { setFavorites([]); }
    }
  }, []);

  // Ouvir sincronização vinda do dashboard (favorites-updated)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string[]>).detail || [];
      setFavorites(detail);
      try { localStorage.setItem('moduleFavorites', JSON.stringify(detail)); } catch {}
    };
    window.addEventListener('favorites-updated', handler as EventListener);
    return () => window.removeEventListener('favorites-updated', handler as EventListener);
  }, []);

  const openPanel = (type: PanelType) => setPanel(type);
  const closePanel = () => setPanel(null);

  // ESC: fecha painel ou limpa busca | / foca busca
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isTyping = tag === 'input' || tag === 'textarea' || (e.target as HTMLElement)?.isContentEditable;

      if (e.key === 'Escape') {
        if (panel) { e.preventDefault(); closePanel(); return; }
        if (document.activeElement === inputRef.current || !isTyping) {
          setQuery('');
          emitSearch('');
          inputRef.current?.blur();
        }
      }
      if (e.key === '/' && !isTyping) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panel]);

  // Busca global (emite evento)
  const emitSearch = (value: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('global-search', { detail: value }));
    }
  };

  const onChangeSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    emitSearch(value);
  };

  const clearSearch = () => {
    setQuery('');
    emitSearch('');
    inputRef.current?.focus();
  };

  // Itens do painel conforme tipo
  const panelItems: Module[] =
    panel === 'modulos'
      ? modules
      : modules.filter((m) => favorites.includes(m.path));

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        modules={modules}
        onOpenPanel={openPanel}
      />

      {/* Painel secundário (sem animação) */}
      {panel && (
        <aside className="w-72 bg-white border-r border-gray-200 flex flex-col">
          <div className="h-14 flex items-center justify-between px-3 border-b">
            <h3 className="text-sm font-semibold text-gray-800">
              {panel === 'favoritos' ? 'Favoritos' : 'Módulos'}
            </h3>
            <button
              onClick={closePanel}
              className="p-2 rounded-md hover:bg-gray-100"
              aria-label="Fechar painel"
              title="Fechar"
            >
              ×
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {panelItems.length === 0 ? (
              <p className="text-sm text-gray-500 p-3">
                {panel === 'favoritos' ? 'Nenhum favorito ainda.' : 'Nenhum módulo disponível.'}
              </p>
            ) : (
              <ul className="p-2 space-y-1">
                {panelItems.map((m) => (
                  <li key={m.path} className="flex items-center justify-between">
                    <button
                      onClick={() => router.push(m.path)}
                      className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-gray-50 text-left flex-1"
                      title={m.name}
                    >
                      <div className="w-8 h-8 rounded-md bg-gray-50 flex items-center justify-center">
                        {/* Ícone renderizado no card do painel */}
                        <span className="text-blue-600">•</span>
                      </div>
                      <span className="text-sm text-gray-800 truncate">{m.name}</span>
                    </button>
                    <span
                      className={`px-2 py-1 text-sm rounded-md ${favorites.includes(m.path) ? 'text-yellow-600' : 'text-gray-300'}`}
                      title={favorites.includes(m.path) ? 'Favorito' : 'Não favorito'}
                      aria-label={favorites.includes(m.path) ? 'Favorito' : 'Não favorito'}
                    >
                      {favorites.includes(m.path) ? '★' : '☆'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      )}

      {/* Área principal */}
      <main className="flex flex-col flex-1 overflow-y-hidden">
        {/* Topbar clean: voltar + busca */}
        <header className="h-14 flex items-center gap-3 px-3 sm:px-4 bg-white border-b border-gray-200">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-md hover:bg-gray-100 transition"
            aria-label="Voltar"
            title="Voltar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <div className="flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 max-w-3xl">
            <svg className="text-gray-500 mr-2" width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
              <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={onChangeSearch}
              className="bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400 w-full"
              placeholder="Buscar (atalho /)"
            />
            {query && (
              <button
                onClick={clearSearch}
                className="ml-2 text-gray-400 hover:text-gray-600"
                aria-label="Limpar busca"
                title="Limpar"
              >
                ×
              </button>
            )}
          </div>
        </header>

        {/* Conteúdo com gap reduzido */}
        <section className="flex-1 overflow-y-auto">
          <div className="px-4 lg:px-5 py-5">
            {children}
          </div>
        </section>
      </main>
    </div>
  );
};

export default DashboardLayout;
