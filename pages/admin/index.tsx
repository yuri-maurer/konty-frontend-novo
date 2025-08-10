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
          router.push('/dashboard');
        } else {
          setIsAdmin(true);
        }
      } catch {
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    }
    checkRole();
  }, [user, supabase, router]);

  return { isAdmin, loading };
};

// --- NOVA INTERFACE PARA OS DADOS DO USUÁRIO ---
interface AppUser {
  id: string;
  email: string;
  created_at: string;
}

export default function AdminPage() {
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const supabase = useSupabaseClient();

  // --- NOVOS ESTADOS PARA A LISTA DE USUÁRIOS ---
  const [users, setUsers] = useState<AppUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);

  // --- NOVO EFEITO PARA BUSCAR USUÁRIOS QUANDO FOR ADMIN ---
  useEffect(() => {
    if (isAdmin) {
      async function fetchUsers() {
        try {
          // Chama a função RPC 'get_all_users' que criamos no Supabase
          const { data, error } = await supabase.rpc('get_all_users');
          if (error) {
            throw new Error('Não foi possível carregar a lista de usuários.');
          }
          setUsers(data || []);
        } catch (err: any) {
          setUsersError(err.message);
        } finally {
          setUsersLoading(false);
        }
      }
      fetchUsers();
    }
  }, [isAdmin, supabase]);

  // Enquanto verifica as permissões de admin, mostra uma mensagem
  if (adminLoading || !isAdmin) {
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
          <p className="text-gray-600 mt-2 mb-6">
            Visualize todos os usuários do sistema. O próximo passo será gerenciar as permissões de cada um.
          </p>
          
          {/* --- RENDERIZAÇÃO DA LISTA DE USUÁRIOS --- */}
          {usersLoading ? (
            <p className="text-gray-500">Carregando usuários...</p>
          ) : usersError ? (
            <p className="text-red-600">{usersError}</p>
          ) : (
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data de Cadastro</th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-indigo-600 hover:text-indigo-900 disabled:text-gray-400" disabled>
                          Gerenciar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
