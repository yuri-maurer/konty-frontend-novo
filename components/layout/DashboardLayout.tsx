// components/layout/DashboardLayout.tsx
import React, { useState } from 'react';
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

          {/* Busca placeholder (funcional em passo futuro) */}
          <div className="hidden md:flex items-center bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 w-72">
            <AiOutlineSearch className="text-gray-500 mr-2" size={18} />
            <input
              disabled
              className="bg-transparent outline-none text-sm text-gray-600 placeholder:text-gray-400 w-full"
              placeholder="Buscar (atalho /) — em breve"
            />
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
