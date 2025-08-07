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
}

const Sidebar: React.FC<SidebarProps> = ({ modules }) => {
  const router = useRouter();
  const supabaseClient = useSupabaseClient();
  const user = useUser();

  const handleLogout = async () => {
    await supabaseClient.auth.signOut();
    router.push('/login');
  };

  return (
    <aside className="w-64 bg-white flex flex-col shadow-lg flex-shrink-0">
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold text-blue-700">Konty Sistemas</h1>
        {user && (
          <p className="text-sm text-gray-500 mt-2 truncate" title={user.email}>
            {user.email}
          </p>
        )}
      </div>

      <nav className="flex-grow p-4">
        <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase">Módulos</p>
        <ul>
          {modules.map((module) => {
            // O ícone é renderizado aqui como um componente
            const Icon = module.icon; 
            return (
              <li key={module.path}>
                <Link href={module.path}>
                  <a
                    className={`flex items-center px-4 py-3 my-1 rounded-lg transition-colors duration-200 ${
                      router.pathname.startsWith(module.path)
                        ? 'bg-blue-100 text-blue-700 font-semibold'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={22} className="mr-3" />
                    <span>{module.name}</span>
                  </a>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 mt-auto border-t">
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-3 rounded-lg text-gray-600 hover:bg-red-100 hover:text-red-700 transition-colors duration-200"
        >
          <AiOutlineLogout size={22} className="mr-3" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
