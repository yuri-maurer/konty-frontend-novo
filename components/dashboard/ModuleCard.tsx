// components/dashboard/ModuleCard.tsx
import { useRouter } from 'next/router';
import type { IconType } from 'react-icons';
import { FaStar, FaRegStar } from 'react-icons/fa';

interface ModuleCardProps {
  title: string;
  path: string;
  icon: IconType;
  description?: string;
  category?: string;
  status?: 'Novo' | 'Beta' | 'Em breve' | 'Restrito';
  isFavorite: boolean;
  onToggleFavorite: () => void;
  color?: string; // Optional custom color
}

// Mapping styles for status badge
const statusStyles: Record<string, string> = {
  Novo: 'bg-blue-100 text-blue-800',
  Beta: 'bg-purple-100 text-purple-800',
  'Em breve': 'bg-gray-100 text-gray-800',
  Restrito: 'bg-amber-100 text-amber-800',
};

const ModuleCard: React.FC<ModuleCardProps> = ({
  title,
  path,
  icon: Icon,
  description,
  category,
  status,
  isFavorite,
  onToggleFavorite,
  color = 'blue',
}) => {
  const router = useRouter();
  const handleNavigate = () => {
    router.push(path);
  };

  // Determine base styling based on color
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
      className={`group relative flex flex-col p-6 rounded-lg shadow-md cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${baseClass} ${hoverClass}`}
    >
      {/* Favorite toggle */}
      <button
        className="absolute top-2 right-2 z-10 p-1 rounded-full bg-white shadow hover:bg-gray-100"
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
      >
        {isFavorite ? (
          <FaStar className="text-yellow-400" size={18} />
        ) : (
          <FaRegStar className="text-gray-400 group-hover:text-yellow-400" size={18} />
        )}
      </button>
      {/* Status badge */}
      {status && (
        <span
          className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium ${
            statusStyles[status]
          }`}
        >
          {status}
        </span>
      )}
      {/* Icon */}
      <Icon
        size={42}
        className={`mb-4 ${iconClass} transition-colors duration-300 group-hover:text-white`}
      />
      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-800 mb-1 transition-colors duration-300 group-hover:text-white">
        {title}
      </h3>
      {/* Description */}
      {description && <p className="text-sm text-gray-600 mb-1 truncate">{description}</p>}
      {/* Category */}
      {category && <span className="text-xs font-medium text-gray-500">{category}</span>}
    </div>
  );
};

export default ModuleCard;