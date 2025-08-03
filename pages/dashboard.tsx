import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { getPermissoes } from '../lib/getPermissoes'; // Importa a nova função de permissões

// Interface para a estrutura de dados da permissão, para garantir tipagem
interface Permissao {
  id: number;
  user_id: string;
  modulo: string;
  ativo: boolean;
  criado_em: string;
}

export default function DashboardPage() {
  const [permissoes, setPermissoes] = useState<Permissao[] | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchPermissoes = async () => {
      // Função para verificar se o usuário está logado
      const { data: { session } } = await supabase.auth.getSession();
      
      // Se não houver sessão, redireciona para a página de login
      if (!session) {
        router.push('/login');
        return;
      }

      // Busca as permissões do usuário logado
      const userPermissoes = await getPermissoes();
      setPermissoes(userPermissoes);
      setLoading(false);
    };

    fetchPermissoes();
  }, [router]);

  const handleLogout = async () => {
    // Chama a função de logout do Supabase
    await supabase.auth.signOut();
    // Redireciona para a página de login após o logout
    router.push('/login');
  };

  // Exibe a mensagem de carregamento enquanto as permissões são buscadas
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <p className="text-gray-600">Carregando módulos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-200 text-center">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Painel</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-md shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-150 ease-in-out"
          >
            Sair
          </button>
        </div>

        {permissoes && permissoes.length > 0 ? (
          <>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Módulos Disponíveis</h2>
            <div className="flex flex-col space-y-4">
              {permissoes.map((permissao) => (
                <button
                  key={permissao.id}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
                >
                  {permissao.modulo}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
            <p className="font-bold">Aviso</p>
            <p>Nenhum módulo disponível para o seu usuário. Contate o administrador.</p>
          </div>
        )}
      </div>
    </div>
  );
}
