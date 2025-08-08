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

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, modules }) => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Emite evento global de busca
  const emitSearch = (value: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('global-search', { detail: value }));
    }
  };

  // Atalhos "/" e "Esc"
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isTyping = tag === 'input' || tag === 'textarea' || (e.target as HTMLElement)?.isContentEditable;

      if (e.key === '/' && !isTyping) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        if (document.activeElement === inputRef.current || !isTyping) {
          setQuery('');
          emitSearch('');
          inputRef.current?.blur();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    emitSearch(value);
  };

  const clear = () => {
    setQuery('');
    emitSearch('');
    inputRef.current?.focus();
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <Sidebar modules={modules} />

      {/* Área principal */}
      <main className="flex flex-col flex-1 overflow-y-hidden">
        {/* Topbar clean: apenas voltar + busca */}
        <header className="h-14 flex items-center gap-3 px-3 sm:px-4 bg-white border-b border-gray-200">
          {/* Botão voltar */}
          <button
            onClick={() => router.back()}
            className="p-2 rounded-md hover:bg-gray-100 transition"
            aria-label="Voltar"
            title="Voltar"
          >
            {/* Caret simples */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Campo de busca central e fluido */}
          <div className="flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 max-w-3xl">
            <svg className="text-gray-500 mr-2" width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
              <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={onChange}
              className="bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400 w-full"
              placeholder="Buscar (atalho /)"
            />
            {query && (
              <button
                onClick={clear}
                className="ml-2 text-gray-400 hover:text-gray-600"
                aria-label="Limpar busca"
                title="Limpar"
              >
                ×
              </button>
            )}
          </div>
        </header>

        {/* Conteúdo com container mais enxuto */}
        <section className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 lg:px-5 py-5">
            {children}
          </div>
        </section>
      </main>
    </div>
  );
};

export default DashboardLayout;
