// pages/ativar-conta.tsx
// NOTA IMPORTANTE PARA O BUILD:
// O código abaixo está correto para o ambiente Next.js/Vercel.
// O erro "Could not resolve module" acontece se as dependências não estiverem
// instaladas. É ESSENCIAL executar o comando `npm install` no seu terminal
// para que a Vercel consiga encontrar estes pacotes.

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient, useUser, useSessionContext } from '@supabase/auth-helpers-react';
import { FiKey, FiEye, FiEyeOff } from 'react-icons/fi';

// O formulário de atualização de senha não tem alterações.
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
      setSuccess('Senha definida com sucesso! A redirecionar...');
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err: any) {
      setError(err.message || 'Não foi possível definir a senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-200 animate-fade-in">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Bem-vindo(a)! Defina a sua Senha</h1>
      {user?.email && <p className="text-center text-gray-600 mb-6">Para: <span className="font-medium text-indigo-600">{user.email}</span></p>}
      <form onSubmit={handlePasswordUpdate} className="space-y-4">
        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
          <div className="relative"><input type={showPassword ? 'text' : 'password'} id="new-password" className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="********" value={password} onChange={(e) => setPassword(e.target.value)} required /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-indigo-600">{showPassword ? <FiEyeOff /> : <FiEye />}</button></div>
          <p className="text-xs text-gray-500 mt-1">A senha deve ter no mínimo 6 caracteres.</p>
        </div>
        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">Confirmar Senha</label>
          <div className="relative"><input type={showConfirmPassword ? 'text' : 'password'} id="confirm-password" className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="********" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required /><button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-indigo-600">{showConfirmPassword ? <FiEyeOff /> : <FiEye />}</button></div>
        </div>
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mt-2">{error}</div>}
        {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md mt-2">{success}</div>}
        <button type="submit" className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mt-6" disabled={loading || !!success}><FiKey />{loading ? 'A salvar...' : 'Salvar Nova Senha'}</button>
      </form>
    </div>
  );
};

// --- Página principal que reage ao estado global ---
export default function ActivateAccountPage() {
  const router = useRouter();
  const supabase = useSupabaseClient();

  // Fallback: tenta trocar o token manualmente se a sessão ainda não estiver pronta
  useEffect(() => {
    const run = async () => {
      if (session) return;
      if (isLoading) return;

      const hash = window.location.hash || '';
      const hasOtp = /access_token=|code=/i.test(hash);
      if (hasOtp) {
        const { error } = await supabase.auth.exchangeCodeForSession(hash);
        if (!error) return; // sessão criada com sucesso
      }

      // Última tentativa
      const { data } = await supabase.auth.getSession();
      if (data.session) return; // sessão obtida
      // Se chegou aqui, a sessão não existe — manterá o fluxo de link inválido
    };
    run();
  }, [isLoading, session, supabase]);

  const { isLoading, session } = useSessionContext();

  // Se o Supabase ainda está a processar a sessão...
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="text-gray-600 animate-pulse">A verificar a sua sessão...</div>
      </div>
    );
  }

  // Se terminou de carregar e existe uma sessão, o token foi validado com sucesso. Mostra o formulário.
  if (session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <UpdatePasswordForm />
      </div>
    );
  }
  
  // Se terminou de carregar e não há sessão, o link é inválido ou expirou.
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="text-red-600 bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        Link de convite inválido ou expirado. Por favor, solicite um novo convite.
      </div>
    </div>
  );
}
