// pages/login.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { FiLogIn, FiKey } from 'react-icons/fi';

// --- Componente para o formulário de definir/resetar a senha ---
// Nenhuma alteração necessária aqui.
const UpdatePasswordForm = () => {
  const supabase = useSupabaseClient();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess('Senha atualizada com sucesso! A redirecionar para o dashboard...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err: any)      {
      setError(err.message || 'Não foi possível atualizar a senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-200 animate-fade-in">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Definir Nova Senha</h1>
      <p className="text-center text-gray-600 mb-6">Crie uma senha segura para aceder à sua conta.</p>
      <form onSubmit={handlePasswordUpdate} className="space-y-6">
        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
            Nova Senha
          </label>
          <input
            type="password"
            id="new-password"
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
            Confirmar Senha
          </label>
          <input
            type="password"
            id="confirm-password"
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="********"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md">{error}</div>}
        {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md">{success}</div>}
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          disabled={loading || !!success}
        >
          <FiKey />
          {loading ? 'A salvar...' : 'Salvar Nova Senha'}
        </button>
      </form>
    </div>
  );
};


// --- Componente para o formulário de Login normal ---
// Nenhuma alteração necessária aqui.
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
            setError(error.message);
        } else {
            router.push('/dashboard');
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


// --- Página principal que decide qual formulário mostrar (LÓGICA DE INVESTIGAÇÃO) ---
export default function LoginPage() {
  const [view, setView] = useState<'login' | 'update_password'>('login');
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useSupabaseClient();
  const user = useUser();
  const router = useRouter();

  useEffect(() => {
    // LOG DE INVESTIGAÇÃO 1: Verificar o hash do URL no momento exato da montagem do componente.
    console.log('LoginPage montado. Hash do URL:', window.location.hash);

    // Se o hash já estiver presente, podemos tentar definir a view imediatamente.
    if (window.location.hash.includes('type=recovery')) {
      console.log('Hash de recuperação encontrado. A definir view para "update_password".');
      setView('update_password');
    }

    // O listener de autenticação é a nossa fonte de verdade mais confiável.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // LOG DE INVESTIGAÇÃO 2: Ver o evento exato que o Supabase está a emitir.
      console.log('Evento onAuthStateChange disparado:', event);

      // Esta é a condição principal para mostrar o formulário de atualização de senha.
      if (event === 'PASSWORD_RECOVERY') {
        console.log('Evento PASSWORD_RECOVERY detetado. A forçar view para "update_password".');
        setView('update_password');
      } else if (event === 'SIGNED_IN' && session) {
        // Se o utilizador fez login com sucesso, redireciona para o dashboard.
        console.log('Evento SIGNED_IN detetado. A redirecionar para /dashboard.');
        router.push('/dashboard');
      }
    });

    // Se o utilizador já estiver logado ao carregar a página (e não for um fluxo de recuperação), redireciona.
    if (user && !window.location.hash.includes('type=recovery')) {
      console.log('Utilizador já logado. A redirecionar para /dashboard.');
      router.push('/dashboard');
    }

    setIsLoading(false);

    // Limpamos a subscrição quando o componente é desmontado para evitar leaks de memória.
    return () => {
      console.log('LoginPage desmontado. A limpar subscrição.');
      subscription.unsubscribe();
    };
  }, [user, router, supabase]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-gray-100">A verificar...</div>;
  }

  // LOG DE INVESTIGAÇÃO 3: Ver qual view está a ser renderizada.
  console.log('A renderizar LoginPage com a view:', view);
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      {view === 'update_password' ? <UpdatePasswordForm /> : <LoginForm />}
    </div>
  );
}
