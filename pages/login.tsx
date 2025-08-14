// pages/login.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import { FiLogIn, FiMail, FiLock } from 'react-icons/fi';

export default function LoginPage() {
  const supabase = useSupabaseClient();
  const session = useSession();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redireciona se o usuário já estiver logado.
  // O middleware já faz isso no servidor, mas mantemos como fallback no cliente.
  useEffect(() => {
    if (session) {
      router.replace('/dashboard');
    }
  }, [session, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Mapeia erros comuns para mensagens mais amigáveis
        if (error.message === 'Invalid login credentials') {
          throw new Error('E-mail ou senha inválidos. Por favor, tente novamente.');
        }
        throw error;
      }
      
      // O redirecionamento será tratado pelo useEffect ou pelo middleware
      router.push('/dashboard');

    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao tentar fazer login.');
    } finally {
      setLoading(false);
    }
  };

  // Não renderiza o formulário se a sessão já existir (evita piscar a tela)
  if (session) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="text-gray-600">Redirecionando...</div>
        </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Konty Sistemas</h1>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                E-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="seu.email@exemplo.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="********"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
                <p>{error}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-md shadow-sm text-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
              >
                <FiLogIn />
                {loading ? 'A entrar...' : 'Entrar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
