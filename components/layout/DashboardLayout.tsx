// components/layout/DashboardLayout.tsx
import React from 'react';
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
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar fixa 280px */}
      <Sidebar modules={modules} />

      {/* Área principal */}
      <main className="flex flex-col flex-1 overflow-y-hidden">
        {/* Topbar limpa (faixa branca) */}
        <header className="h-14 flex items-center px-3 sm:px-4 bg-white border-b border-gray-200">
          {/* Mantém altura e estilo, mas sem seta nem busca */}
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
