// pages/admin/index.tsx
import { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import type { IconType } from 'react-icons';

// --- INTERFACES GLOBAIS PARA A PÁGINA ---
interface AppUser {
  id: string;
  email: string;
  created_at: string;
}

interface ModuleDef {
  key: string;
  name: string;
  path: string;
}

// --- SISTEMA DE NOTIFICAÇÕES (TOAST) ---
const ToastContext = createContext<(message: string, type?: 'success' | 'error') => void>(() => {});

const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toast && (
        <div 
          className={`fixed bottom-5 right-5 p-4 rounded-lg shadow-lg text-white z-[100] transition-transform transform ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
        >
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
};

const useToast = () => useContext(ToastContext);

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
        const timer = setTimeout(() => {
            if(!user && !supabase.auth.getSession()) {
                router.push('/login');
            }
        }, 500);
        return () => clearTimeout(timer);
      }
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        if (data?.role === 'admin') {
          setIsAdmin(true);
        } else {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error("Erro ao verificar a função de admin:", error);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    }
    checkRole();
  }, [user, supabase, router]);

  return { isAdmin, loading };
};

// --- COMPONENTE: MODAL DE GESTÃO DE PERMISSÕES ---
// ATUALIZADO: Aceita onPermissionsUpdate para notificar o pai sobre a atualização.
const ManagePermissionsModal = ({ user, onClose, onPermissionsUpdate }: { user: AppUser; onClose: () => void; onPermissionsUpdate: () => void; }) => {
  const supabase = useSupabaseClient();
  const showToast = useToast();
  const [modules, setModules] = useState<ModuleDef[]>([]);
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: modulesData, error: modulesError } = await supabase.from('modulos').select('key, name, path');
        if (modulesError) throw modulesError;
        setModules(modulesData || []);

        const { data: permsData, error: permsError } = await supabase.from('permissoes').select('modulo_nome').eq('user_id', user.id).eq('ativo', true);
        if (permsError) throw permsError;
        setPermissions(new Set(permsData.map(p => p.modulo_nome)));
      } catch (error) {
        console.error("Erro ao buscar dados para o modal:", error);
        showToast('Não foi possível carregar os dados.', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [supabase, user.id, showToast]);

  const handleTogglePermission = (moduleKey: string) => {
    setPermissions(prev => {
      const newPerms = new Set(prev);
      if (newPerms.has(moduleKey)) newPerms.delete(moduleKey);
      else newPerms.add(moduleKey);
      return newPerms;
    });
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      const { error: deleteError } = await supabase.from('permissoes').delete().eq('user_id', user.id);
      if (deleteError) throw deleteError;

      const newPermsToInsert = Array.from(permissions).map(moduleKey => ({ user_id: user.id, modulo_nome: moduleKey, ativo: true }));

      if (newPermsToInsert.length > 0) {
        const { error: insertError } = await supabase.from('permissoes').insert(newPermsToInsert);
        if (insertError) throw insertError;
      }
      
      showToast('Permissões atualizadas com sucesso!', 'success');
      onPermissionsUpdate(); // ATUALIZADO: Chama a função de callback para atualizar a UI.
      onClose();
    } catch (error) {
      console.error("Erro ao salvar permissões:", error);
      showToast('Falha ao salvar as permissões.', 'error');
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
          {loading ? <p>A carregar...</p> : (
            <fieldset className="space-y-4">
              <legend className="sr-only">Módulos</legend>
              {modules.map(module => (
                <div key={module.key} className="relative flex items-start">
                  <div className="flex items-center h-5">
                    <input id={`module-${module.key}`} name={`module-${module.key}`} type="checkbox" checked={permissions.has(module.key)} onChange={() => handleTogglePermission(module.key)} className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded" />
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
          <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50">Cancelar</button>
          <button type="button" onClick={handleSaveChanges} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:bg-indigo-400">{saving ? 'A salvar...' : 'Salvar Alterações'}</button>
        </div>
      </div>
    </div>
  );
};

export default function AdminPage() {
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const supabase = useSupabaseClient();
  const user = useUser(); // Hook para obter o utilizador logado.

  const [users, setUsers] = useState<AppUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [managingUser, setManagingUser] = useState<AppUser | null>(null);
  
  // ATUALIZADO: Estado para os módulos permitidos do *utilizador logado* (para a sidebar).
  const [permittedModules, setPermittedModules] = useState<ModuleDef[]>([]);

  // ATUALIZADO: Função para buscar os módulos permitidos do utilizador logado.
  const fetchPermittedModules = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.rpc('get_permitted_modules_for_user', { p_user_id: user.id });
      if (error) throw error;
      setPermittedModules(data || []);
    } catch (error) {
      console.error("Erro ao buscar módulos permitidos para a sidebar:", error);
      setPermittedModules([]); // Garante que a lista fica vazia em caso de erro.
    }
  }, [supabase, user]);

  // Efeito para buscar os módulos permitidos quando a página carrega.
  useEffect(() => {
    if (isAdmin) {
      fetchPermittedModules();
    }
  }, [isAdmin, fetchPermittedModules]);

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

  if (adminLoading) {
    return <DashboardLayout modules={[]}><div className="p-4"><p>A verificar permissões...</p></div></DashboardLayout>;
  }
  
  if (!isAdmin) return null;

  return (
    <ToastProvider>
      {/* ATUALIZADO: Passa os módulos permitidos para o layout, garantindo que a sidebar está sempre correta. */}
      <DashboardLayout modules={permittedModules.map(m => ({ name: m.name, path: m.path, icon: (() => null) as any }))}>
        <div className="p-4 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Painel de Administração</h1>
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold">Gestão de Utilizadores</h2>
            <p className="text-gray-600 mt-2 mb-6">Visualize todos os utilizadores do sistema e gira as suas permissões.</p>
            {usersLoading ? <p>A carregar utilizadores...</p> : usersError ? <p className="text-red-600">{usersError}</p> : (
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data de Cadastro</th>
                      <th scope="col" className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(user.created_at).toLocaleDateString('pt-BR')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button onClick={() => setManagingUser(user)} className="text-indigo-600 hover:text-indigo-900">Gerir</button>
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

      {managingUser && (
        <ManagePermissionsModal 
          user={managingUser} 
          onClose={() => setManagingUser(null)} 
          // ATUALIZADO: Passa a função de atualização para o modal.
          onPermissionsUpdate={fetchPermittedModules}
        />
      )}
    </ToastProvider>
  );
}
