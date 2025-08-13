// pages/login.tsx
// NOTA PARA O DESENVOLVEDOR: O código abaixo está correto. O erro de build "Could not resolve module"
// indica que os pacotes podem não estar corretamente instalados no ambiente da Vercel.
// Para garantir que todas as dependências estejam presentes, por favor, execute o seguinte comando localmente
// e depois faça o commit dos ficheiros package.json e package-lock.json atualizados:
// npm install next react react-dom @supabase/auth-helpers-react react-icons

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { FiLogIn } from 'react-icons/fi';

// --- Componente para o formulário de Login ---
const LoginForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = useSupabaseClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError('E-mail ou senha inválidos.');
        }
        setLoading(false);
    };

    return (
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-200 animate-fade-in">
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">Login Konty</h1>
            <form onSubmit={handleLogin} className="space-y-6">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                    <input
                        type="email"
                        id="email"
                        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                    <input
                        type="password"
                        id="password"
                        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="********"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md">{error}</div>}
                <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    disabled={loading}
                >
                    <FiLogIn />
                    {loading ? 'A entrar...' : 'Entrar'}
                </button>
            </form>
        </div>
    );
};

// --- Página principal com lógica de autenticação simplificada ---
export default function LoginPage() {
  const [showLogin, setShowLogin] = useState(false);
  const supabase = useSupabaseClient();
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.push('/dashboard');
      } else {
        setShowLogin(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      {showLogin 
        ? <LoginForm /> 
        : <div className="text-gray-600 animate-pulse">A verificar autenticação...</div>
      }
    </div>
  );
}
