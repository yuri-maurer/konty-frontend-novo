// pages/admin/index.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import DashboardLayout from '../../components/layout/DashboardLayout';

// Hook personalizado para verificar a função do usuário
const useAdminCheck = () => {
  const router = useRouter();
  const user = useUser();
  const supabase = useSupabaseClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkRole() {
      if (!user) {
        // Se não houver usuário, redireciona para o login após um breve momento
        setTimeout(() => router.push('/login'), 100);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error || data?.role !== 'admin') {
          // Se não for admin, redireciona para o dashboard
          router.push('/dashboard');
        } else {
          setIsAdmin(true);
        }
      } catch {
        // Em caso de erro, redireciona por segurança
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    }
    checkRole();
  }, [user, supabase, router]);

  return { isAdmin, loading };
};

export default function AdminPage() {
  const { isAdmin, loading } = useAdminCheck();

  // Enquanto verifica, mostra uma mensagem de carregamento
  if (loading || !isAdmin) {
    return (
      <DashboardLayout modules={[]}>
        <div className="p-4">
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </DashboardLayout>
    );
  }

  // Se for admin, mostra o conteúdo da página
  return (
    <DashboardLayout modules={[]}>
      <div className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Painel de Administração
        </h1>
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold">Gestão de Usuários</h2>
          <p className="text-gray-600 mt-2">
            Aqui você poderá visualizar todos os usuários do sistema e gerenciar suas permissões de acesso aos módulos.
          </p>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-700">
            Funcionalidade em desenvolvimento.
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
