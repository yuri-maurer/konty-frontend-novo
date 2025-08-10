// pages/admin/index.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import DashboardLayout from '../../components/layout/DashboardLayout';

// Hook personalizado para verificar a função do utilizador
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

// --- INTERFACES ---
interface AppUser {
  id: string;
  email: string;
  created_at: string;
}

interface ModuleDef {
  key: string;
  name: string;
}

// --- NOVO COMPONENTE: MODAL DE GESTÃO DE PERMISSÕES ---
const ManagePermissionsModal = ({ user, onClose }: { user: AppUser; onClose: () => void; }) => {
  const supabase = useSupabaseClient();
  const [modules, setModules] = useState<ModuleDef[]>([]);
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        // 1. Buscar todos os módulos disponíveis
        const { data: modulesData, error: modulesError } = await supabase
          .from('modulos')
          .select('key, name');
        if (modulesError) throw modulesError;
        setModules(modulesData || []);

        // 2. Buscar as permissões atuais do utilizador selecionado
        const { data: permsData, error: permsError } = await supabase
          .from('permissoes')
          .select('modulo_nome')
          .eq('user_id', user.id)
          .eq('ativo', true);
        if (permsError) throw permsError;
        setPermissions(new Set(permsData.map(p => p.modulo_nome)));

      } catch (error) {
        console.error("Erro ao buscar dados para o modal:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [supabase, user.id]);

  const handleTogglePermission = (moduleKey: string) => {
    setPermissions(prev => {
      const newPerms = new Set(prev);
      if (newPerms.has(moduleKey)) {
        newPerms.delete(moduleKey);
      } else {
        newPerms.add(moduleKey);
      }
      return newPerms;
    });
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      // 1. Deletar todas as permissões existentes do utilizador para um "reset" limpo
      const { error: deleteError } = await supabase
        .from('permissoes')
        .delete()
        .eq('user_id', user.id);
      if (deleteError) throw deleteError;

      // 2. Inserir as novas permissões
      const newPermsToInsert = Array.from(permissions).map(moduleKey => ({
        user_id: user.id,
        modulo_nome: moduleKey,
        ativo: true,
      }));

      if (newPermsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('permissoes')
          .insert(newPermsToInsert);
        if (insertError) throw insertError;
      }
      
      alert('Permissões atualizadas com sucesso!');
      onClose();

    } catch (error) {
      console.error("Erro ao salvar permissões:", error);
      alert('Falha ao salvar as permissões. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b">
          <h3 className="text-lg font-bold text-gray-900">Gerir Permissões</h3>
          <p className="text-sm text-gray-600 mt-1">Utilizador: <span className="font-medium">{user.email}</span></p>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <p>A carregar módulos e permissões...</p>
          ) : (
            <fieldset className="space-y-4">
              <legend className="sr-only">Módulos</legend>
              {modules.map(module => (
                <div key={module.key} className="relative flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id={`module-${module.key}`}
                      name={`module-${module.key}`}
                      type="checkbox"
                      checked={permissions.has(module.key)}
                      onChange={() => handleTogglePermission(module.key)}
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor={`module-${module.key}`} className="font-medium text-gray-700">{module.name}</label>
                  </div>
                </div>
              ))}
            </fieldset>
          )}
        </div>
        <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end items-center gap-3">
          <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50">
            Cancelar
          </button>
          <button type="button" onClick={handleSaveChanges} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:bg-indigo-400">
            {saving ? 'A salvar...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
};


export default function AdminPage() {
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const supabase = useSupabaseClient();

  const [users, setUsers] = useState<AppUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);

  // --- NOVO ESTADO PARA CONTROLAR O MODAL ---
  const [managingUser, setManagingUser] = useState<AppUser | null>(null);

  useEffect(() => {
    if (isAdmin) {
      async function fetchUsers() {
        try {
          const { data, error } = await supabase.rpc('get_all_users');
          if (error) throw new Error('Não foi possível carregar a lista de utilizadores.');
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

  if (adminLoading || !isAdmin) {
    return (
      <DashboardLayout modules={[]}>
        <div className="p-4">
          <p className="text-gray-600">A verificar permissões...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <DashboardLayout modules={[]}>
        <div className="p-4 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Painel de Administração
          </h1>
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold">Gestão de Utilizadores</h2>
            <p className="text-gray-600 mt-2 mb-6">
              Visualize todos os utilizadores do sistema. O próximo passo será gerir as permissões de cada um.
            </p>
            
            {usersLoading ? (
              <p className="text-gray-500">A carregar utilizadores...</p>
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
                          {/* O botão agora está ativo e abre o modal */}
                          <button onClick={() => setManagingUser(user)} className="text-indigo-600 hover:text-indigo-900">
                            Gerir
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

      {/* --- RENDERIZAÇÃO CONDICIONAL DO MODAL --- */}
      {managingUser && (
        <ManagePermissionsModal 
          user={managingUser} 
          onClose={() => setManagingUser(null)} 
        />
      )}
    </>
  );
}
