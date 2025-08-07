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
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Renderiza a Sidebar, passando os módulos permitidos */}
      <Sidebar modules={modules} />
      
      {/* Área de conteúdo principal */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
