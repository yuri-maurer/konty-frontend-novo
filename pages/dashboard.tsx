// pages/dashboard.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import ModuleCard from '../components/dashboard/ModuleCard';
import { AiOutlineFilePdf, AiOutlineCalculator } from 'react-icons/ai';
import { FaUsers } from 'react-icons/fa';

// Define module metadata including description, category, status and optional color
interface ModuleDefinition {
  name: string;
  path: string;
  icon: any;
  description?: string;
  category?: string;
  status?: 'Novo' | 'Beta' | 'Em breve' | 'Restrito';
  color?: string;
}

// Central configuration of available modules
const MODULE_DEFINITIONS: Record<string, ModuleDefinition> = {
  'extrair-pdf': {
    name: 'Extrair PDF',
    path: '/modulos/extrair-pdf',
    icon: AiOutlineFilePdf,
    description: 'Extrai recibos de PDFs de notas fiscais.',
    category: 'Documentos',
    status: 'Novo',
    color: 'blue',
  },
  'gestao-usuarios': {
    name: 'Gestão de Usuários',
    path: '/admin/usuarios',
    icon: FaUsers,
    description: 'Administra usuários e permissões.',
    category: 'Administração',
    status: 'Restrito',
    color: 'green',
  },
  calculadora: {
    name: 'Calculadora',
    path: '/modulos/calculadora',
    icon: AiOutlineCalculator,
    description: 'Realiza cálculos diversos.',
    category: 'Ferramentas',
    status: 'Beta',
    color: 'red',
  },
};

// List of categories available for filtering
const CATEGORIES = [
  'Documentos',
  'Administração',
  'Ferramentas',
  'Financeiro',
  'Fiscal',
  'RH',
  'Integrações',
];

const DashboardPage = () => {
  const router = useRouter();
  const user = useUser();
  const supabaseClient = useSupabaseClient();
  // Modules that the user has permission to access
  const [allowedModules, setAllowedModules] = useState<ModuleDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Favorites state (stores module paths)
  const [favorites, setFavorites] = useState<string[]>([]);
  // Tab: whether to show all modules or only favorites
  const [tab, setTab] = useState<'todos' | 'favoritos'>('todos');
  // Search query for filtering modules by name/description
  const [searchQuery, setSearchQuery] = useState('');
  // Category filter; null means no category filter
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  // Fetch user's module permissions from Supabase
  useEffect(() => {
    if (user === undefined) return;
    if (!user) {
      router.push('/login');
      return;
    }
    const fetchPermissions = async () => {
      const { data: permissions, error } = await supabaseClient
        .from('permissoes')
        .select('modulo_nome')
        .eq('user_id', user.id)
        .eq('ativo', true);
      if (error) {
        console.error('Erro ao buscar permissões:', error.message);
        setIsLoading(false);
        return;
      }
      const userModules =
        permissions?.map((p: any) => MODULE_DEFINITIONS[p.modulo_nome]).filter(Boolean) || [];
      setAllowedModules(userModules);
      setIsLoading(false);
    };
    fetchPermissions();
  }, [user, router, supabaseClient]);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('moduleFavorites');
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch {
        setFavorites([]);
      }
    }
  }, []);

  // Persist favorites to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('moduleFavorites', JSON.stringify(favorites));
  }, [favorites]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">A carregar painel...</div>;
  }

  // Toggle favorite state for a module path
  const toggleFavorite = (modulePath: string) => {
    setFavorites((prev) =>
      prev.includes(modulePath) ? prev.filter((p) => p !== modulePath) : [...prev, modulePath],
    );
  };

  // Filter modules by search, tab and category
  const modulesFiltered = allowedModules.filter((mod) => {
    if (tab === 'favoritos' && !favorites.includes(mod.path)) return false;
    if (
      searchQuery &&
      !mod.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(mod.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    if (categoryFilter && mod.category !== categoryFilter) return false;
    return true;
  });

  // Derive lists of favorites and others from filtered modules
  const favoritesModules = modulesFiltered.filter((mod) => favorites.includes(mod.path));
  const otherModules = modulesFiltered.filter((mod) => !favorites.includes(mod.path));

  return (
    <DashboardLayout modules={allowedModules}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Módulos</h1>
        {/* Search bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar módulo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-72 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {/* Tabs for All vs Favorites */}
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setTab('todos')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === 'todos' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setTab('favoritos')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === 'favoritos' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Favoritos
          </button>
        </div>
        {/* Category filter chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
              className={`px-3 py-1 text-xs font-medium rounded-full border ${
                categoryFilter === cat
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              } transition-colors`}
            >
              {cat}
            </button>
          ))}
          {categoryFilter && (
            <button
              onClick={() => setCategoryFilter(null)}
              className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 hover:bg-red-200 transition-colors"
            >
              Limpar filtro
            </button>
          )}
        </div>
      </div>
      {/* Section for favorites when tab is 'todos' */}
      {tab === 'todos' && favoritesModules.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Favoritos</h2>
          <div className="w-full flex justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {favoritesModules.map((mod) => (
                <ModuleCard
                  key={mod.path}
                  title={mod.name}
                  description={mod.description}
                  category={mod.category}
                  status={mod.status}
                  path={mod.path}
                  icon={mod.icon}
                  isFavorite={favorites.includes(mod.path)}
                  onToggleFavorite={() => toggleFavorite(mod.path)}
                  color={mod.color}
                />
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Main module listing */}
      <h2 className="text-xl font-semibold text-gray-800 mb-3">
        {tab === 'favoritos' ? 'Módulos Favoritos' : 'Todos os Módulos'}
      </h2>
      <div className="w-full flex justify-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {(tab === 'favoritos' ? favoritesModules : otherModules).map((mod) => (
            <ModuleCard
              key={mod.path}
              title={mod.name}
              description={mod.description}
              category={mod.category}
              status={mod.status}
              path={mod.path}
              icon={mod.icon}
              isFavorite={favorites.includes(mod.path)}
              onToggleFavorite={() => toggleFavorite(mod.path)}
              color={mod.color}
            />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;