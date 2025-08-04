// components/sidebar/Sidebar.tsx

import React from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import { FaSignOutAlt, FaTachometerAlt } from 'react-icons/fa';

interface UserProfile {
  name: string;
  email: string;
}

interface SidebarProps {
  userProfile: UserProfile | null;
}

export default function Sidebar({ userProfile }: SidebarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="w-64 flex flex-col bg-white shadow-md">
      <div className="p-6 flex items-center justify-center border-b border-gray-200">
        <h1 className="text-2xl font-bold text-indigo-600">Konty Sistemas</h1>
      </div>
      
      {userProfile && (
        <div className="p-4 border-b border-gray-200 text-center">
          <p className="font-semibold text-gray-800">{userProfile.name}</p>
          <p className="text-sm text-gray-500">{userProfile.email}</p>
        </div>
      )}

      <nav className="flex-1 px-2 py-4 space-y-2">
        <button
          onClick={() => router.push('/dashboard')}
          className={`flex items-center w-full px-4 py-2 rounded-md transition duration-150 ease-in-out
            ${router.pathname === '/dashboard' ? 'bg-indigo-100 text-indigo-700 font-bold' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          <FaTachometerAlt className="mr-3" />
          Painel
        </button>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-2 text-left text-red-600 rounded-md hover:bg-red-100 transition duration-150 ease-in-out"
        >
          <FaSignOutAlt className="mr-3" />
          Sair
        </button>
      </div>
    </div>
  );
}