// pages/dashboard.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import ModuleCard from '../components/dashboard/ModuleCard';

// Importe os ícones que você vai usar
import { AiOutlineFilePdf, AiOutlineCalculator } from 'react-icons/ai';
import { FaUsers, FaCube } from 'react-icons/fa';

// --- CONFIGURAÇÃO CENTRAL DE MÓDULOS ---
// Esta é a forma mais escalável de gerenciar módulos.
// A chave (ex: 'extrair-pdf') deve ser EXATAMENTE igual ao 'modulo_nome' no Supabase.
const MODULE_DEFINITIONS = {
  'extrair-pdf': {
    name: 'Extrair PDF',
    path: '/modulos/extrair-pdf',
    icon: AiOutlineFilePdf,
  },
  'gestao-usuarios': {
    name: 'Gestão de Usuários',
    path: '/admin/usuarios',
    icon: FaUsers,
  },
  'calculadora': {
    name: 'Calculadora',
    path: '/modulos/calculadora',
    icon: AiOutlineCalculator,
  },
  // Adicione futuros módulos aqui...
};

const DashboardPage = () => {
  const router = useRouter();
  const user = useUser();
  const supabaseClient = useSupabaseClient();

  const [allowedModules, setAllowedModules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Lógica de busca de permissões refatorada para ser direta e robusta
  useEffect(() => {
    // Espera o hook useUser definir o estado do usuário
    if (user === undefined) {
      return; 
    }

    // Se não houver usuário, redireciona para o login
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchPermissions = async () => {
      // Busca as permissões diretamente aqui, sem usar 'getPermissoes.ts'
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
      
      console.log('Permissões carregadas do Supabase:', permissions);

      // Mapeia os nomes dos módulos do banco para os objetos completos
      const userModules = permissions
        .map(p => MODULE_DEFINITIONS[p.modulo_nome])
        .filter(Boolean); // Filtra para remover módulos não definidos no frontend

      setAllowedModules(userModules);
      setIsLoading(false);
    };

    fetchPermissions();
  }, [user, router, supabaseClient]);

  // Tela de carregamento enquanto busca os dados
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Carregando painel...</div>;
  }

  // O DashboardLayout agora recebe os módulos permitidos para passar para a Sidebar
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
