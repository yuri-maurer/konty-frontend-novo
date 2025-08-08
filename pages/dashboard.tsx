// pages/dashboard.tsx
// Passo 2: Busca global funcional na Topbar (evento 'global-search') + cards informativos
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import ModuleCard from '../components/dashboard/ModuleCard';
import { AiOutlineFilePdf, AiOutlineCalculator } from 'react-icons/ai';
import { FaUsers, FaStar } from 'react-icons/fa';

interface ModuleDefinition {
  name: string;
  path: string;
  icon: any;
  description?: string;
  category?: string;
  status?: 'Novo' | 'Beta' | 'Em breve' | 'Restrito';
  color?: string;
}

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

const DashboardPage = () => {
  const router = useRouter();
  const user = useUser();
  const supabase = useSupabaseClient();

  const [allowedModules, setAllowedModules] = useState<ModuleDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [globalQuery, setGlobalQuery] = useState('');

  // Ouve o evento 'global-search' vindo da Topbar
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail || '';
      setGlobalQuery(detail);
    };
    window.addEventListener('global-search', handler as EventListener);
    return () => window.removeEventListener('global-search', handler as EventListener);
  }, []);

  // Permissões
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

  // Favoritos (localStorage)
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

  useEffect(() => {
    localStorage.setItem('moduleFavorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (modulePath: string) => {
    setFavorites((prev) =>
      prev.includes(modulePath) ? prev.filter((p) => p !== modulePath) : [...prev, modulePath],
    );
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">A carregar painel...</div>;
  }

  const ativos = allowedModules.length;
  const favs = favorites.filter((p) => allowedModules.some((m) => m.path === p)).length;
  const pendencias = 0; // placeholder

  // Filtro por busca global (nome + descrição)
  const filtered = allowedModules.filter((m) => {
    if (!globalQuery) return true;
    const q = globalQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      (m.description || '').toLowerCase().includes(q)
    );
  });

  return (
    <DashboardLayout modules={allowedModules}>
      {/* Cards informativos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Módulos Ativos</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{ativos}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Favoritos</p>
            <FaStar className="text-yellow-400" />
          </div>
          <p className="text-3xl font-bold text-gray-800 mt-1">{favs}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Ações Pendentes</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{pendencias}</p>
        </div>
      </div>

      {/* Título e espaçamento refinados */}
      <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-2">Módulos</h1>
      <p className="text-sm text-gray-500 mb-6">Acesse rapidamente os módulos disponíveis para o seu perfil.</p>

      {/* Grid de módulos centralizado */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 px-6 bg-white rounded-lg shadow-md">
          <p className="text-gray-600">Nenhum módulo encontrado.</p>
          <p className="text-sm text-gray-500 mt-2">Tente ajustar a busca ou limpar o campo (Esc).</p>
        </div>
      ) : (
        <div className="w-full flex justify-center">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map((mod) => (
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
