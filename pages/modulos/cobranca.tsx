// konty-frontend-novo/pages/modulos/cobranca.tsx
import { useState, useEffect, useCallback, FC } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { FaFileInvoiceDollar, FaFolder, FaHistory, FaCog, FaSyncAlt, FaPaperPlane, FaTrashAlt, FaPlus, FaCalendarAlt, FaSpinner } from 'react-icons/fa';

// --- Tipos de Dados para o Módulo ---
type Client = {
  id: string;
  name: string;
  phone: string;
  email: string;
};

type Charge = {
  id: string;
  clientName: string;
  clientPhone?: string;
  value: number;
  dueDate: string;
  competence: string;
  customMessage: string;
  sendStatus: 'Pendente' | 'Enviado' | 'Erro';
  importError?: string;
};

type Log = {
  id: string;
  timestamp: string;
  clientName: string;
  whatsapp: string;
  status: string;
  message: string;
  origin: 'Manual' | 'Recorrente';
};

type Settings = {
  zapiInstanceId: string;
  zapiToken: string;
  zapiSecurityToken: string;
  defaultMessage: string;
  dateFormat: 'DD/MM/YYYY' | 'YYYY-MM-DD';
  currencyFormat: 'BRL' | 'USD';
};

const CobrancaPage: FC = () => {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const user = useUser();

  // --- Estados de UI e Autenticação ---
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'charges' | 'files' | 'logs' | 'settings'>('charges');
  const [isFetchingData, setIsFetchingData] = useState(false);

  // --- Estados de Dados ---
  const [clients, setClients] = useState<Client[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

  // --- Hook de Verificação de Permissões ---
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    const checkPermissions = async () => {
      try {
        const { data: permission, error } = await supabase
          .from('permissoes')
          .select('ativo')
          .eq('user_id', user.id)
          .eq('modulo_nome', 'cobranca')
          .single();
        
        if (error || !permission?.ativo) {
          router.push('/dashboard?error=unauthorized');
        } else {
          setIsAuthorized(true);
          fetchAllData();
        }
      } catch (e) {
        router.push('/dashboard?error=unauthorized');
      } finally {
        setIsLoading(false);
      }
    };
    checkPermissions();
  }, [user, supabase, router]);

  // --- Função para buscar todos os dados da API ---
  const fetchAllData = useCallback(async () => {
    setIsFetchingData(true);
    try {
        const apiPrefix = `${API_URL}/cobranca`;
        const [clientsRes, chargesRes, logsRes, settingsRes] = await Promise.all([
            fetch(`${apiPrefix}/clients`),
            fetch(`${apiPrefix}/charges`),
            fetch(`${apiPrefix}/logs`),
            fetch(`${apiPrefix}/settings`),
        ]);

        if (clientsRes.ok) setClients(await clientsRes.json());
        if (chargesRes.ok) setCharges(await chargesRes.json());
        if (logsRes.ok) setLogs(await logsRes.json());
        if (settingsRes.ok) setSettings(await settingsRes.json());

    } catch (error) {
        console.error("Falha ao buscar dados do módulo de cobrança:", error);
        // Adicionar toast/notificação de erro para o usuário
    } finally {
        setIsFetchingData(false);
    }
  }, [API_URL]);

  // --- Renderização Condicional ---
  if (isLoading) {
    return (
      <DashboardLayout modules={[]}>
        <div className="flex h-full items-center justify-center"><FaSpinner className="animate-spin mr-2" /> A verificar permissões...</div>
      </DashboardLayout>
    );
  }
  if (!isAuthorized) return null;

  // --- Componentes da UI ---
  const tabs = [
    { id: 'charges', label: 'Cobranças', icon: FaFileInvoiceDollar },
    { id: 'files', label: 'Arquivos', icon: FaFolder },
    { id: 'logs', label: 'Logs', icon: FaHistory },
    { id: 'settings', label: 'Configurações', icon: FaCog },
  ];

  const renderTabContent = () => {
    if (isFetchingData) {
        return <div className="flex h-full items-center justify-center"><FaSpinner className="animate-spin mr-2" /> A carregar dados...</div>;
    }
    switch (activeTab) {
      case 'charges':
        return (
          <div>
            <h3 className="text-lg font-medium mb-4">Visão Geral das Cobranças</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {charges.length > 0 ? charges.map(charge => (
                    <tr key={charge.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{charge.clientName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(charge.value)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{new Date(charge.dueDate).toLocaleDateString('pt-BR')}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{charge.sendStatus}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} className="text-center py-4">Nenhuma cobrança encontrada.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'files':
        return <div><h3 className="text-lg font-medium mb-4">Gestão de Arquivos e Clientes</h3><p>Funcionalidade de importação e gestão de clientes será implementada aqui.</p></div>;
      case 'logs':
        return <div><h3 className="text-lg font-medium mb-4">Histórico de Envios</h3><p>Tabela de logs de envio será implementada aqui.</p></div>;
      case 'settings':
        return <div><h3 className="text-lg font-medium mb-4">Configurações do Módulo</h3><p>Formulário de configurações da Z-API e templates será implementado aqui.</p></div>;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout modules={[{ name: 'Sistema de Cobrança', path: '/modulos/cobranca', icon: FaCalendarAlt }]}>
      <div className="p-6 bg-gray-50 h-full flex flex-col">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">Sistema de Cobrança</h1>
        
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors`}
              >
                <tab.icon className="mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-6 bg-white p-6 rounded-lg shadow-sm flex-grow">
          {renderTabContent()}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CobrancaPage;
