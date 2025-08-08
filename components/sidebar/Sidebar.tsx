// components/sidebar/Sidebar.tsx
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
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
  onOpenPanel?: (type: 'favoritos' | 'modulos') => void;
}

const getInitials = (email?: string | null) => {
  if (!email) return 'U';
  const handle = email.split('@')[0] || 'user';
  return handle.slice(0, 2).toUpperCase();
};

const Sidebar: React.FC<SidebarProps> = ({ modules, onOpenPanel }) => {
  const router = useRouter();
  const supabaseClient = useSupabaseClient();
  const user = useUser();

  const handleLogout = async () => {
    await supabaseClient.auth.signOut();
    router.push('/login');
  };

  return (
    <aside className="w-60 bg-white flex flex-col border-r border-gray-200">
      {/* Brand */}
      <div className="h-14 flex items-center px-4">
        <Link href="/dashboard" className="text-lg font-semibold text-blue-700">
          Konty Sistemas
        </Link>
      </div>

      {/* Navegação raiz */}
      <nav className="flex-grow px-2 pt-2 space-y-1">
        <Link
          href="/dashboard"
          className={`block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition ${
            router.pathname === '/dashboard' ? 'bg-gray-100 font-semibold' : ''
          }`}
        >
          Início
        </Link>
        <button
          className="w-full text-left px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition"
          onClick={() => onOpenPanel && onOpenPanel('favoritos')}
        >
          Favoritos
        </button>
        <button
          className="w-full text-left px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition"
          onClick={() => onOpenPanel && onOpenPanel('modulos')}
        >
          Módulos
        </button>

        {/* Lista simples (continua como navegação rápida) */}
        <p className="px-3 pt-3 text-xs font-semibold text-gray-400 uppercase">Navegação</p>
        <ul className="mt-1 space-y-1">
          {modules.map((m) => (
            <li key={m.path}>
              <Link
                href={m.path}
                className={`block px-3 py-2 rounded-md transition ${
                  router.pathname.startsWith(m.path)
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {m.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Rodapé com identidade do usuário */}
      <div className="mt-auto border-t border-gray-200 p-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-semibold">
            {getInitials(user?.email)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{user?.email || 'Usuário'}</p>
            <div className="flex items-center gap-3 mt-1">
              <Link href="/perfil" className="text-xs text-gray-600 hover:underline">Perfil</Link>
              <button onClick={handleLogout} className="text-xs text-red-600 hover:underline">Sair</button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
