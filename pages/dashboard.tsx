// pages/dashboard.tsx (patched)
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import ModuleCard from '../components/dashboard/ModuleCard';

// Importe os ícones que você vai usar
import { AiOutlineFilePdf, AiOutlineCalculator } from 'react-icons/ai';
import { FaUsers } from 'react-icons/fa';

// --- CONFIGURAÇÃO CENTRAL DE MÓDULOS ---
const MODULE_DEFINITIONS = {
  'extrair-pdf': {
    name: 'Extrair PDF',
    path: '/modulos/extrair-pdf',
    icon: AiOutlineFilePdf,
    color: 'blue',
  },
  'gestao-usuarios': {
    name: 'Gestão de Usuários',
    path: '/admin/usuarios',
    icon: FaUsers,
    color: 'green',
  },
  'calculadora': {
    name: 'Calculadora',
    path: '/modulos/calculadora',
    icon: AiOutlineCalculator,
    color: 'red',
  },
};

const DashboardPage = () => {
  const router = useRouter();
  const user = useUser();
  const supabaseClient = useSupabaseClient();

  const [allowedModules, setAllowedModules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      const userModules = permissions
        .map((p: any) => MODULE_DEFINITIONS[p.modulo_nome])
        .filter(Boolean);
      setAllowedModules(userModules);
      setIsLoading(false);
    };
    fetchPermissions();
  }, [user, router, supabaseClient]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">A carregar painel...</div>;
  }

  return (
    <DashboardLayout modules={allowedModules}>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Módulos Disponíveis</h1>
      {allowedModules.length > 0 ? (
        // Envolver o grid em um contêiner flex para centralizar os cartões quando houver poucos módulos
        <div className="w-full flex justify-center">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {allowedModules.map((module: any) => (
              <ModuleCard
                key={module.path}
                title={module.name}
                path={module.path}
                icon={module.icon}
                color={module.color}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-10 px-6 bg-white rounded-lg shadow-md">
          <p className="text-gray-600">Nenhum módulo disponível para o seu utilizador.</p>
          <p className="text-sm text-gray-500 mt-2">Entre em contacto com o administrador do sistema.</p>
        </div>
      )}
    </DashboardLayout>
  );
};

export default DashboardPage;
