// components/dashboard/ModuleCard.tsx
import { useRouter } from 'next/router';
import type { IconType } from 'react-icons';

interface ModuleCardProps {
  title: string;
  path: string;
  icon: IconType; // Recebe o componente do ícone como uma propriedade
}

const ModuleCard: React.FC<ModuleCardProps> = ({ title, path, icon: Icon }) => {
  const router = useRouter();

  const handleNavigate = () => {
    router.push(path);
  };

  return (
    <div
      onClick={handleNavigate}
      className="group flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:bg-blue-600"
    >
      {/* Renderiza o ícone como um componente, que é a forma correta */}
      <Icon size={40} className="mb-4 text-blue-600 transition-colors duration-300 group-hover:text-white" />
      <h3 className="text-lg font-semibold text-gray-800 transition-colors duration-300 group-hover:text-white">
        {title}
      </h3>
    </div>
  );
};

export default ModuleCard;
