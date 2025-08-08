// pages/dashboard.tsx
// This version implements search, favorites, category filtering, and status badges.
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import ModuleCard from '../components/dashboard/ModuleCard';
import { AiOutlineFilePdf, AiOutlineCalculator } from 'react-icons/ai';
import { FaUsers } from 'react-icons/fa';

// Type describing the module metadata, including description, category, status, and color
interface ModuleDefinition {
  name: string;
  path: string;
  icon: any;
  description?: string;
  category?: string;
  status?: 'Novo' | 'Beta' | 'Em breve' | 'Restrito';
  color?: string;
}

// Central module definitions used to map permission names to metadata
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

// List of available categories to filter by
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
  const supabase = useSupabaseClient();

  // Modules the user is allowed to access
  const [allowedModules, setAllowedModules] = useState<ModuleDefinition[]>([]);
  // Loading indicator while fetching permissions
  const [isLoading, setIsLoading] = useState(true);
  // Paths of favorite modules (persisted in localStorage)
  const [favorites, setFavorites] = useState<string[]>([]);
  // Current tab: all modules or favorites only
  const [tab, setTab] = useState<'todos' | 'favoritos'>('todos');
  // Search term for filtering modules by name or description
  const [searchQuery, setSearchQuery] = useState('');
  // Currently selected category filter
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  // Fetch user permissions from Supabase on mount or when user changes
  useEffect(() => {
    if (user === undefined) return;
    if (!user) {
      router.push('/login');
      return;
    }
    const fetchPermissions = async () => {
      const { data: permissions, error } = await supabase
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
  }, [user, router, supabase]);

  // Load favorites from localStorage when component mounts
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

  // Persist favorites to localStorage whenever favorites state changes
  useEffect(() => {
    localStorage.setItem('moduleFavorites', JSON.stringify(favorites));
  }, [favorites]);

  // Function to toggle a module as favorite or not
  const toggleFavorite = (modulePath: string) => {
    setFavorites((prev) =>
      prev.includes(modulePath) ? prev.filter((p) => p !== modulePath) : [...prev, modulePath],
    );
  };

  // Filter modules based on current search term, selected tab, and category
  const modulesFiltered = allowedModules.filter((mod) => {
    // Filter by tab
    if (tab === 'favoritos' && !favorites.includes(mod.path)) return false;
    // Filter by search term in name or description
    if (
      searchQuery &&
      !mod.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(mod.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    // Filter by category
    if (categoryFilter && mod.category !== categoryFilter) return false;
    return true;
  });

  // Separate favorites and other modules within the filtered list
  const favoritesModules = modulesFiltered.filter((m) => favorites.includes(m.path));
  const otherModules = modulesFiltered.filter((m) => !favorites.includes(m.path));

  // Display loading state while permissions are being fetched
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">A carregar painel...</div>;
  }

  return (
    <DashboardLayout modules={allowedModules}>
      <div className="mb-6">
        {/* Title */}
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
        {/* Tabs: All or Favorites */}
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

      {/* Section for favorites when showing all modules */}
      {tab === 'todos' && favoritesModules.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Favoritos</h2>
          <div className="w-full flex justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {favoritesModules.map((mod) => (
                <ModuleCard
                  key={mod.path}
                  title={mod.name}
                  path={mod.path}
                  icon={mod.icon}
                  description={mod.description}
                  category={mod.category}
                  status={mod.status}
                  color={mod.color}
                  isFavorite={favorites.includes(mod.path)}
                  onToggleFavorite={() => toggleFavorite(mod.path)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main list of modules (favorites or others depending on tab) */}
      <h2 className="text-xl font-semibold text-gray-800 mb-3">
        {tab === 'favoritos' ? 'Módulos Favoritos' : 'Todos os Módulos'}
      </h2>
      {modulesFiltered.length === 0 ? (
        // Empty state when no modules match the filters
        <div className="text-center py-10 px-6 bg-white rounded-lg shadow-md">
          <p className="text-gray-600">Nenhum módulo encontrado.</p>
          {categoryFilter && (
            <p className="text-sm text-gray-500 mt-2">
              Tente limpar o filtro ou ajustar a pesquisa.
            </p>
          )}
        </div>
      ) : (
        <div className="w-full flex justify-center">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {(tab === 'favoritos' ? favoritesModules : otherModules).map((mod) => (
              <ModuleCard
                key={mod.path}
                title={mod.name}
                path={mod.path}
                icon={mod.icon}
                description={mod.description}
                category={mod.category}
                status={mod.status}
                color={mod.color}
                isFavorite={favorites.includes(mod.path)}
                onToggleFavorite={() => toggleFavorite(mod.path)}
              />
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default DashboardPage;