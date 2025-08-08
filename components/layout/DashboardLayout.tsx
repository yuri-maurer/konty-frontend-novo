// components/layout/DashboardLayout.tsx
import React, { useEffect, useRef, useState } from 'react';
import Sidebar from '../sidebar/Sidebar';
import type { IconType } from 'react-icons';
import { AiOutlineSearch } from 'react-icons/ai';

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
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Emite o evento global para que páginas (ex.: dashboard) filtrem pela busca
  const emitSearch = (value: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('global-search', { detail: value }));
    }
  };

  // Atalhos: "/" foca, "Esc" limpa
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isTyping = tag === 'input' || tag === 'textarea' || (e.target as HTMLElement)?.isContentEditable;

      // Atalho: "/" para focar a busca (se não estiver digitando em outro campo)
      if (e.key === '/' && !isTyping) {
        e.preventDefault();
        inputRef.current?.focus();
      }

      // "Esc" limpa
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

  // Atualiza e emite a cada digitação
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    emitSearch(value);
  };

  // Botão de limpar (X)
  const clear = () => {
    setQuery('');
    emitSearch('');
    inputRef.current?.focus();
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <Sidebar
        modules={modules}
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
      />

      {/* Área principal */}
      <main className="flex flex-col flex-1 overflow-y-hidden">
        {/* Topbar fixa */}
        <header className="h-16 flex items-center justify-between px-4 bg-white border-b border-gray-200">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="px-2 py-1 rounded-md hover:bg-gray-100 transition"
              aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
              title={collapsed ? "Expandir menu" : "Recolher menu"}
            >
              {/* Ícone simples de menu */}
              <div className="w-5 h-0.5 bg-gray-700 mb-1" />
              <div className="w-5 h-0.5 bg-gray-700 mb-1" />
              <div className="w-5 h-0.5 bg-gray-700" />
            </button>
            <span className="text-lg font-semibold text-gray-800">Konty Sistemas</span>
          </div>

          {/* Busca funcional (global) */}
          <div className="hidden md:flex items-center bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 w-80">
            <AiOutlineSearch className="text-gray-500 mr-2" size={18} />
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

          <div className="flex items-center gap-2">
            <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 rounded-md transition">
              + Novo Módulo
            </button>
            {/* Avatar placeholder */}
            <div className="w-8 h-8 rounded-full bg-gray-200 border border-gray-300" title="Perfil" />
          </div>
        </header>

        {/* Conteúdo rolável */}
        <section className="flex-1 overflow-y-auto p-6">
          {children}
        </section>
      </main>
    </div>
  );
};

export default DashboardLayout;
