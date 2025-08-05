// pages/dashboard.tsx

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { getPermissoes } from '../lib/getPermissoes';
import DashboardLayout from '../components/layout/DashboardLayout';
import Sidebar from '../components/sidebar/Sidebar';
import ModuleCard from '../components/dashboard/ModuleCard';
import { FaFilePdf, FaMoneyBillWave, FaFileCode, FaCheckCircle, FaCube } from 'react-icons/fa';

// Interface para a estrutura de dados da permissão
interface Permissao {
  id: number;
  user_id: string;
  modulo: string;
  ativo: boolean;
  criado_em: string;
}

// Mapeamento de ícones por nome de módulo
const iconesPorModulo = {
  "extrair-pdf": FaFilePdf,
  "gerar-boletos": FaMoneyBillWave,
  "analise-de-xml": FaFileCode,
  "validar-darf": FaCheckCircle,
};
const IconePadrao = FaCube;

// Função utilitária para converter nome do módulo em URL
const getModulePath = (moduleName: string) => {
  return moduleName.toLowerCase().replace(/\s+/g, '-');
};

export default function DashboardPage() {
  const [permissoes, setPermissoes] = useState<Permissao[] | null>(null);
  const [userProfile, setUserProfile] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUserDataAndPermissoes = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      const user = session.user;
      setUserProfile({
        name: user.user_metadata.full_name || user.email || 'Usuário',
        email: user.email || 'N/A'
      });

      const userPermissoes = await getPermissoes();
      setPermissoes(userPermissoes);
      setLoading(false);
    };

    fetchUserDataAndPermissoes();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <p className="text-gray-600">Carregando painel...</p>
      </div>
    );
  }
  
  const getModuleIcon = (moduleName: string) => {
    const moduleKey = getModulePath(moduleName);
    const IconComponent = iconesPorModulo[moduleKey] || IconePadrao;
    return <IconComponent />;
  };

  return (
    <DashboardLayout>
      <Sidebar userProfile={userProfile} />
      <div className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Módulos Disponíveis</h1>
        {permissoes && permissoes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {permissoes.map((permissao) => (
              <ModuleCard
                key={permissao.id}
                title={permissao.modulo}
                icon={getModuleIcon(permissao.modulo)}
                onClick={() => router.push(`/modulos/${getModulePath(permissao.modulo)}`)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
            <p className="font-bold">Aviso</p>
            <p>Nenhum módulo disponível para o seu usuário. Contate o administrador.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
