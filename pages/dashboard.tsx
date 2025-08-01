import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Função para verificar se o usuário está logado
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Se não houver sessão, redireciona para a página de login
      if (!session) {
        router.push('/login');
      }
    };

    checkUser();
  }, [router]);

  const handleLogout = async () => {
    // Chama a função de logout do Supabase
    await supabase.auth.signOut();
    // Redireciona para a página de login após o logout
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-200 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Bem-vindo ao painel!</h1>
        <p className="text-gray-600">
          Você está logado. Esta é uma área protegida.
        </p>
        <button
          onClick={handleLogout}
          className="mt-6 px-4 py-2 bg-red-600 text-white rounded-md shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-150 ease-in-out"
        >
          Sair
        </button>
      </div>
    </div>
  );
}
