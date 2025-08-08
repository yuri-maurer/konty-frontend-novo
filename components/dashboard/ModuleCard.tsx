// components/dashboard/ModuleCard.tsx
import { useRouter } from 'next/router';
import type { IconType } from 'react-icons';
import { FaRegStar, FaStar } from 'react-icons/fa';

type Status = 'Novo' | 'Beta' | 'Em breve' | 'Restrito';

interface ModuleCardProps {
  title: string;
  path: string;
  icon: IconType;
  description?: string;
  category?: string;
  status?: Status;
  color?: 'blue' | 'green' | 'red';
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

const statusStyles: Record<Status, string> = {
  'Novo': 'bg-blue-100 text-blue-700',
  'Beta': 'bg-purple-100 text-purple-700',
  'Em breve': 'bg-gray-100 text-gray-700',
  'Restrito': 'bg-amber-100 text-amber-800',
};

export default function ModuleCard({
  title,
  path,
  icon: Icon,
  description,
  category,
  status,
  color = 'blue',
  isFavorite = false,
  onToggleFavorite,
}: ModuleCardProps) {
  const router = useRouter();

  const go = () => router.push(path);

  const borderColor =
    color === 'green' ? 'border-green-200' : color === 'red' ? 'border-red-200' : 'border-blue-200';

  return (
    <div
      className={`group relative bg-white border ${borderColor} rounded-xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer`}
      onClick={go}
    >
      {/* Status badge */}
      {status && (
        <span className={`absolute -top-2 left-4 px-2 py-0.5 text-[10px] font-semibold rounded-full ${statusStyles[status]}`}>
          {status}
        </span>
      )}

      {/* Favorite */}
      {onToggleFavorite && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className="absolute top-3 right-3 text-gray-400 hover:text-yellow-500 transition"
          aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          title={isFavorite ? 'Desfavoritar' : 'Favoritar'}
        >
          {isFavorite ? <FaStar /> : <FaRegStar />}
        </button>
      )}

      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 group-hover:bg-gray-100 transition">
          <Icon size={22} className="text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          {description && (
            <p className="mt-1 text-sm text-gray-600 line-clamp-2">{description}</p>
          )}
          {category && (
            <p className="mt-2 text-xs text-gray-500">{category}</p>
          )}
        </div>
      </div>
    </div>
  );
}
