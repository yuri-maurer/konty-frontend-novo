// pages/admin/index.tsx
import { useEffect, useState, createContext, useContext, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { FiPlus, FiMail, FiCheckCircle, FiXCircle, FiAlertTriangle, FiTrash2, FiMoreVertical, FiEdit, FiSend } from 'react-icons/fi';

// --- INTERFACES GLOBAIS PARA A PÁGINA ---
interface AppUser {
  id: string;
  email: string;
  created_at: string;
  status: string;
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
          className={`fixed bottom-5 right-5 p-4 rounded-lg shadow-lg text-white z-[100] transition-all flex items-center gap-3 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
        >
          {toast.type === 'success' ? <FiCheckCircle className="h-5 w-5" /> : <FiXCircle className="h-5 w-5" />}
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

// --- COMPONENTES DE MODAIS ---
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
        setPermissions(new Set(permsData.map((p: any) => p.modulo_nome)));
      } catch (error) {
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
      await supabase.from('permissoes').delete().eq('user_id', user.id);
      const newPermsToInsert = Array.from(permissions).map(moduleKey => ({ user_id: user.id, modulo_nome: moduleKey, ativo: true }));
      if (newPermsToInsert.length > 0) {
        const { error: insertError } = await supabase.from('permissoes').insert(newPermsToInsert);
        if (insertError) throw insertError;
      }
      showToast('Permissões atualizadas com sucesso!', 'success');
      onPermissionsUpdate(); 
      onClose();
    } catch (error) {
      showToast('Falha ao salvar as permissões.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/75 z-50 flex justify-center items-center p-4 transition-opacity animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all animate-slide-up">
        <div className="p-6 border-b"><h3 className="text-xl font-bold text-gray-900">Gerir Permissões</h3><p className="text-sm text-gray-600 mt-1">Utilizador: <span className="font-medium text-indigo-600">{user.email}</span></p></div>
        <div className="p-6 max-h-[60vh] overflow-y-auto bg-gray-50/50">
          {loading ? <p className="text-center text-gray-500">A carregar...</p> : (
            <fieldset className="space-y-3">
              <legend className="sr-only">Módulos</legend>
              {modules.map(module => (
                <label key={module.key} htmlFor={`module-${module.key}`} className="flex items-center justify-between p-4 rounded-lg bg-white border border-gray-200 hover:border-indigo-400 cursor-pointer transition-all has-[:checked]:bg-indigo-50 has-[:checked]:border-indigo-500">
                  <span className="font-medium text-gray-800">{module.name}</span>
                  <input id={`module-${module.key}`} type="checkbox" checked={permissions.has(module.key)} onChange={() => handleTogglePermission(module.key)} className="h-5 w-5 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500" />
                </label>
              ))}
            </fieldset>
          )}
        </div>
        <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end items-center gap-3"><button type="button" onClick={onClose} disabled={saving} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50">Cancelar</button><button type="button" onClick={handleSaveChanges} disabled={saving} className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:bg-indigo-400">{saving ? 'A salvar...' : 'Salvar Alterações'}</button></div>
      </div>
    </div>
  );
};

const InviteUserModal = ({ onClose, onUserInvited }: { onClose: () => void; onUserInvited: () => void; }) => {
  const supabase = useSupabaseClient();
  const showToast = useToast();
  const [email, setEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showToast('Por favor, insira um email.', 'error');
      return;
    }
    setInviting(true);
    try {
      const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
        redirectTo: 'https://www.konty.com.br/login',
      });
      if (error) throw error;
      showToast(`Convite enviado para ${email} com sucesso!`, 'success');
      onUserInvited();
      onClose();
    } catch (error: any) {
      showToast(error.message || 'Falha ao enviar o convite.', 'error');
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/75 z-50 flex justify-center items-center p-4 transition-opacity animate-fade-in">
      <form onSubmit={handleInvite} className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all animate-slide-up">
        <div className="p-6 border-b"><h3 className="text-xl font-bold text-gray-900">Convidar Novo Utilizador</h3><p className="text-sm text-gray-600 mt-1">O utilizador receberá um email para definir a sua senha.</p></div>
        <div className="p-6">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email do Utilizador</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FiMail className="h-5 w-5 text-gray-400" /></div>
            <input type="email" name="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="nome@exemplo.com" required />
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end items-center gap-3"><button type="button" onClick={onClose} disabled={inviting} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50">Cancelar</button><button type="submit" disabled={inviting} className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:bg-indigo-400">{inviting ? 'A enviar...' : 'Enviar Convite'}</button></div>
      </form>
    </div>
  );
};

const DeleteUserModal = ({ user, onClose, onConfirm, loading }: { user: AppUser; onClose: () => void; onConfirm: () => void; loading: boolean; }) => {
  return (
    <div className="fixed inset-0 bg-gray-900/75 z-50 flex justify-center items-center p-4 transition-opacity animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all animate-slide-up">
        <div className="p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <FiAlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
          </div>
          <h3 className="mt-5 text-xl font-bold text-gray-900">Excluir Utilizador</h3>
          <div className="mt-2">
            <p className="text-sm text-gray-600">
              Tem a certeza que quer excluir o utilizador <span className="font-bold">{user.email}</span>?
            </p>
            <p className="text-sm text-red-600 mt-1">Esta ação é irreversível.</p>
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-center items-center gap-3">
          <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50">
            Cancelar
          </button>
          <button type="button" onClick={onConfirm} disabled={loading} className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50 disabled:bg-red-400">
            {loading ? 'A excluir...' : 'Sim, Excluir'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE: MENU DE AÇÕES ---
const ActionsDropdown = ({ user, onManage, onResend, onDelete, loading }: { user: AppUser; onManage: () => void; onResend: () => void; onDelete: () => void; loading: boolean; }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} disabled={loading} className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none disabled:opacity-50">
        Ações
        <FiMoreVertical className="-mr-1 ml-2 h-5 w-5" />
      </button>
      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {user.status === 'Ativo' && (
              <button onClick={() => handleAction(onManage)} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                <FiEdit className="h-4 w-4" /> Gerir permissões
              </button>
            )}
            {user.status === 'Convite enviado' && (
              <button onClick={() => handleAction(onResend)} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                <FiSend className="h-4 w-4" /> Reenviar convite
              </button>
            )}
            <div className="border-t border-gray-100 my-1"></div>
            <button onClick={() => handleAction(onDelete)} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50" role="menuitem">
              <FiTrash2 className="h-4 w-4" /> Excluir
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- COMPONENTE PRINCIPAL DA PÁGINA (REFATORADO) ---
function AdminConsole() {
  const supabase = useSupabaseClient();
  const currentUser = useUser();
  const showToast = useToast();

  const [users, setUsers] = useState<AppUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [managingUser, setManagingUser] = useState<AppUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AppUser | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [permittedModules, setPermittedModules] = useState<ModuleDef[]>([]);

  const fetchPermittedModules = useCallback(async () => {
    if (!currentUser) return;
    try {
      const { data, error } = await supabase.rpc('get_permitted_modules_for_user', { p_user_id: currentUser.id });
      if (error) throw error;
      setPermittedModules(data || []);
    } catch (error) { console.error("Erro ao buscar módulos permitidos:", error); }
  }, [supabase, currentUser]);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_all_users');
      if (error) throw error;
      setUsers(data || []);
      setUsersError(null);
    } catch (err: any) {
      setUsersError(err.message);
    } finally {
      setUsersLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchPermittedModules();
    fetchUsers();
  }, [fetchPermittedModules, fetchUsers]);

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.auth.admin.deleteUser(deletingUser.id);
      if (error) throw error;
      showToast(`Utilizador ${deletingUser.email} excluído com sucesso.`, 'success');
      setDeletingUser(null);
      fetchUsers();
    } catch (error: any) {
      showToast(error.message || 'Falha ao excluir o utilizador.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResendInvite = async (userToResend: AppUser) => {
    setActionLoading(true);
    try {
      // CORRIGIDO: Usar o método padrão e mais fiável do Supabase.
      const { error } = await supabase.auth.resetPasswordForEmail(userToResend.email, {
        redirectTo: 'https://www.konty.com.br/login',
      });
      if (error) throw error;
      showToast(`Link de ativação reenviado para ${userToResend.email}.`, 'success');
    } catch (error: any) {
      showToast(error.message || 'Falha ao reenviar o link.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <DashboardLayout modules={permittedModules.map(m => ({ name: m.name, path: m.path, icon: (() => null) as any }))}>
        <div className="p-4 sm:p-6 lg:p-8">
          <h1 className="text-2xl font-bold text-gray-900">Painel de Administração</h1>
          <div className="mt-8 bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="p-6 flex justify-between items-center border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Gestão de Utilizadores</h2>
                <p className="text-sm text-gray-500 mt-1">Visualize, convide e gira as permissões dos utilizadores.</p>
              </div>
              <button onClick={() => setIsInviteModalOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <FiPlus className="h-4 w-4" /> Convidar Utilizador
              </button>
            </div>
            {usersLoading ? <div className="p-6 text-gray-500">A carregar utilizadores...</div> : usersError ? <div className="p-6 text-red-600">{usersError}</div> : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data de Cadastro</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(user.created_at).toLocaleDateString('pt-BR')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'Ativo' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <ActionsDropdown 
                            user={user}
                            onManage={() => setManagingUser(user)}
                            onResend={() => handleResendInvite(user)}
                            onDelete={() => setDeletingUser(user)}
                            loading={actionLoading}
                          />
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
      {isInviteModalOpen && <InviteUserModal onClose={() => setIsInviteModalOpen(false)} onUserInvited={fetchUsers} />}
      {managingUser && <ManagePermissionsModal user={managingUser} onClose={() => setManagingUser(null)} onPermissionsUpdate={fetchPermittedModules} />}
      {deletingUser && <DeleteUserModal user={deletingUser} onClose={() => setDeletingUser(null)} onConfirm={handleDeleteUser} loading={actionLoading} />}
    </>
  );
}

export default function AdminPage() {
  const { isAdmin, loading: adminLoading } = useAdminCheck();

  if (adminLoading) {
    return <DashboardLayout modules={[]}><div className="p-4"><p>A verificar permissões...</p></div></DashboardLayout>;
  }
  
  if (!isAdmin) return null;

  // O ToastProvider agora envolve o componente principal que usa o hook
  return (
    <ToastProvider>
      <AdminConsole />
    </ToastProvider>
  );
}
