// components/sidebar/Sidebar.tsx
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { AiOutlineLogout } from 'react-icons/ai';
import type { IconType } from 'react-icons';

interface Module {
  name: string;
  path: string;
  icon: IconType;
}

interface SidebarProps {
  modules: Module[];
  collapsed?: boolean;
  onToggle?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ modules, collapsed = false, onToggle }) => {
  const router = useRouter();
  const supabaseClient = useSupabaseClient();
  const user = useUser();

  const handleLogout = async () => {
    await supabaseClient.auth.signOut();
    router.push('/login');
  };

  const widthClass = collapsed ? 'w-16' : 'w-64';

  return (
    <aside className={`${widthClass} bg-white flex flex-col shadow-lg flex-shrink-0 transition-all duration-200`}>
      {/* Topo da sidebar */}
      <div className="p-4 border-b flex items-center justify-between">
        <h1 className={`font-bold text-blue-700 ${collapsed ? 'text-base' : 'text-2xl'}`}>
          {collapsed ? 'KS' : 'Konty Sistemas'}
        </h1>
        <button
          onClick={onToggle}
          className="ml-2 px-2 py-1 rounded-md hover:bg-gray-100 transition"
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          title={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {/* Chevrons fake */}
          <span className="block w-3 h-3 border-t-2 border-r-2 border-gray-600 rotate-45" />
        </button>
      </div>

      {/* Usuário */}
      {!collapsed && user && (
        <div className="px-4 pt-2 pb-3 border-b">
          <p className="text-sm text-gray-500 truncate" title={user.email || ''}>
            {user.email}
          </p>
        </div>
      )}

      {/* Navegação */}
      <nav className="flex-grow p-2">
        {!collapsed && (
          <p className="px-2 py-2 text-xs font-semibold text-gray-400 uppercase">Navegação</p>
        )}
        <ul className="space-y-1">
          {modules.map((module) => {
            const Icon = module.icon;
            const isActive = router.pathname.startsWith(module.path);
            return (
              <li key={module.path} title={collapsed ? module.name : undefined}>
                <Link
                  href={module.path}
                  className={`flex items-center ${collapsed ? 'justify-center' : ''} px-3 py-3 rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={22} className={`${collapsed ? '' : 'mr-3'}`} />
                  {!collapsed && <span>{module.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-3 mt-auto border-t">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} px-3 py-3 rounded-lg text-gray-600 hover:bg-red-100 hover:text-red-700 transition-colors duration-200`}
          title={collapsed ? 'Sair' : undefined}
        >
          <AiOutlineLogout size={22} className={`${collapsed ? '' : 'mr-3'}`} />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
