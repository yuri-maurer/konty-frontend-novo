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
      
      {/*
        * CORREÇÃO DE LAYOUT:
        * - 'flex flex-col': Transforma o main em um contêiner de coluna flexível.
        * - 'flex-1': Garante que ele ocupe o espaço restante.
        * - 'overflow-hidden': Impede que o próprio main tenha uma barra de rolagem.
        */}
      <main className="flex flex-col flex-1 overflow-hidden">
        {/*
         * - A rolagem e o padding foram movidos para este div interno.
         * - 'flex-1': Faz com que este div cresça para preencher o <main>.
         * - 'overflow-y-auto': Adiciona a barra de rolagem apenas aqui.
         */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
