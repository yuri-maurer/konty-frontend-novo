// pages/login.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { FiLogIn, FiKey, FiEye, FiEyeOff } from 'react-icons/fi';

// --- Componente para o formulário de definir/resetar a senha (sem alterações) ---
const UpdatePasswordForm = () => {
  const supabase = useSupabaseClient();
  const router = useRouter();
  const user = useUser();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      {user?.email && (
        <p className="text-center text-gray-600 mb-6">
          A criar senha para: <span className="font-medium text-indigo-600">{user.email}</span>
        </p>
      )}
      
      <form onSubmit={handlePasswordUpdate} className="space-y-4">
        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
            Nova Senha
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="new-password"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-indigo-600">
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">A senha deve ter no mínimo 6 caracteres.</p>
        </div>
        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
            Confirmar Senha
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirm-password"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="********"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-indigo-600">
              {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
        </div>
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mt-2">{error}</div>}
        {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md mt-2">{success}</div>}
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mt-6"
          disabled={loading || !!success}
        >
          <FiKey />
          {loading ? 'A salvar...' : 'Salvar Nova Senha'}
        </button>
      </form>
    </div>
  );
};


// --- Componente para o formulário de Login normal (sem alterações) ---
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


// --- Página principal que decide qual formulário mostrar (LÓGICA FINAL E ROBUSTA) ---
export default function LoginPage() {
  // 1. Detecção síncrona do fluxo: verificamos o hash uma única vez na renderização inicial do cliente.
  const [isInviteFlow] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.location.hash.includes('type=invite');
    }
    return false;
  });

  const [view, setView] = useState<'login' | 'update_password' | 'loading'>('loading');
  const user = useUser();
  const router = useRouter();

  useEffect(() => {
    // 2. Lógica reativa que depende do fluxo detectado e do estado do utilizador.
    if (isInviteFlow) {
      // Se for um fluxo de convite, esperamos pacientemente pelo objeto 'user'.
      if (user) {
        // Quando o 'user' estiver disponível (sessão estabelecida pelo Supabase), mostramos o formulário.
        setView('update_password');
      }
      // Se 'user' ainda for nulo, a view continua como 'loading', aguardando a re-renderização que será causada pela atualização do hook useUser.
    } else if (user) {
      // Se NÃO for um fluxo de convite e o utilizador estiver logado, redirecionamos.
      router.push('/dashboard');
    } else {
      // Se não for fluxo de convite e não houver utilizador, é um login normal.
      setView('login');
    }
  }, [user, isInviteFlow, router]); // Dependemos explicitamente de 'user' e 'isInviteFlow'.

  // Renderização condicional com base no estado 'view'
  const renderView = () => {
    switch (view) {
      case 'update_password':
        return <UpdatePasswordForm />;
      case 'login':
        return <LoginForm />;
      case 'loading':
      default:
        return <div className="text-gray-600 animate-pulse">A verificar autenticação...</div>;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      {renderView()}
    </div>
  );
}
