// components/layout/DashboardLayout.tsx
import Sidebar from '../sidebar/Sidebar';
import type { IconType } from 'react-icons';

// Define a estrutura de um módulo para a Sidebar
interface Module {
  name: string;
  path: string;
  icon: IconType;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  modules: Module[]; // Recebe a lista de módulos para passar para a Sidebar
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, modules }) => {
  return (
    // O contêiner principal que ocupa 100% da altura da tela (h-screen)
    // e organiza os filhos (Sidebar e main) em linha (flex)
    <div className="flex h-screen bg-gray-100 font-sans">
      <Sidebar modules={modules} />
      
      {/* * ESTA É A CORREÇÃO PRINCIPAL
        * 'flex-1': Faz esta área principal ocupar todo o espaço horizontal restante.
        * 'flex flex-col': Transforma a área principal num contêiner de coluna.
        * Isso permite que o conteúdo filho (children) use 'flex-1' ou 'h-full' para preencher a altura.
      */}
      <main className="flex flex-col flex-1 overflow-y-hidden">
          {/* * O 'children' (seu módulo) é renderizado aqui. 
           * Como o pai (<main>) agora é um contêiner flexível de coluna,
           * o 'h-full' que colocámos no 'extrair-pdf.tsx' finalmente terá efeito.
           * O padding foi removido daqui para dar controlo total ao componente filho.
          */}
          {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
