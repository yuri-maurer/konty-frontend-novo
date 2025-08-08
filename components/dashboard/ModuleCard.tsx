// components/dashboard/ModuleCard.tsx (patched)
import { useRouter } from 'next/router';
import type { IconType } from 'react-icons';

interface ModuleCardProps {
  title: string;
  path: string;
  icon: IconType;
  color?: string;
}

const ModuleCard: React.FC<ModuleCardProps> = ({ title, path, icon: Icon, color = 'blue' }) => {
  const router = useRouter();

  const handleNavigate = () => {
    router.push(path);
  };

  // Define classes based on color
  let baseClass = '';
  let hoverClass = '';
  let iconClass = '';
  switch (color) {
    case 'green':
      baseClass = 'bg-green-50';
      hoverClass = 'hover:bg-green-600';
      iconClass = 'text-green-600';
      break;
    case 'red':
      baseClass = 'bg-red-50';
      hoverClass = 'hover:bg-red-600';
      iconClass = 'text-red-600';
      break;
    case 'blue':
    default:
      baseClass = 'bg-blue-50';
      hoverClass = 'hover:bg-blue-600';
      iconClass = 'text-blue-600';
      break;
  }

  return (
    <div
      onClick={handleNavigate}
      className={`group flex flex-col items-center justify-center p-6 rounded-lg shadow-md cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${baseClass} ${hoverClass}`}
    >
      <Icon size={40} className={`mb-4 ${iconClass} transition-colors duration-300 group-hover:text-white`} />
      <h3 className="text-lg font-semibold text-gray-800 transition-colors duration-300 group-hover:text-white">
        {title}
      </h3>
    </div>
  );
};

export default ModuleCard;
