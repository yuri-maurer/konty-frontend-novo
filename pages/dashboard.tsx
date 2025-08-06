// pages/dashboard.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import ModuleCard from '../components/dashboard/ModuleCard';

// AQUI ESTÁ A CORREÇÃO: 'Sidebar' com 'S' maiúsculo para corresponder ao nome do arquivo.
import Sidebar from '../components/sidebar/Sidebar'; 

// Importe os ícones que serão usados
import { AiOutlineFilePdf, AiOutlineCalculator } from 'react-icons/ai';
import { FaUsers } from 'react-icons/fa';

// --- CONFIGURAÇÃO CENTRAL DE MÓDULOS ---
const MODULE_DEFINITIONS = {
  'extrair-pdf': { // Usando hífen para corresponder ao Supabase
    name: 'Extrair PDF',
    path: '/modulos/extrair-pdf',
    icon: AiOutlineFilePdf,
  },
  'gestao_usuarios': {
    name: 'Gestão de Usuários',
    path: '/admin/usuarios',
    icon: FaUsers,
  },
  'calculadora_financeira': {
    name: 'Calculadora',
    path: '/modulos/calculadora',
    icon: AiOutlineCalculator,
  },
};

// Define a interface para a permissão, esperando 'modulo_nome'
interface Permissao {
    modulo_nome: keyof typeof MODULE_DEFINITIONS;
}

const DashboardPage = () => {
  const router = useRouter();
  const user = useUser();
  const supabaseClient = useSupabaseClient();

  const [allowedModules, setAllowedModules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUserAndFetchPermissions = async () => {
        // Primeiro, verifica se o objeto 'user' está disponível
        if (!user) {
            // Se o usuário não estiver logado (após a verificação inicial), redireciona
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (!session) {
                router.push('/login');
            }
            return;
        }

        setIsLoading(true);
        
        const { data: permissions, error } = await supabaseClient
            .from('permissoes')
            .select('modulo_nome')
            .eq('user_id', user.id)
            .eq('ativo', true);

        if (error) {
            console.error('Erro ao buscar permissões:', error);
            setIsLoading(false);
            return;
        }

        const userModules = permissions
            .map((p: Permissao) => MODULE_DEFINITIONS[p.modulo_nome])
            .filter(Boolean);

        setAllowedModules(userModules);
        setIsLoading(false);
    };

    checkUserAndFetchPermissions();
  }, [user, router, supabaseClient]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Carregando painel...</div>;
  }

  return (
    <DashboardLayout modules={allowedModules}>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Módulos Disponíveis</h1>
      
      {allowedModules.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {allowedModules.map((module) => (
            <ModuleCard
              key={module.path}
              title={module.name}
              path={module.path}
              icon={module.icon}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 px-6 bg-white rounded-lg shadow-md">
            <p className="text-gray-600">Nenhum módulo disponível para seu usuário.</p>
            <p className="text-sm text-gray-500 mt-2">Entre em contato com o administrador do sistema.</p>
        </div>
      )}
    </DashboardLayout>
  );
};

export default DashboardPage;
