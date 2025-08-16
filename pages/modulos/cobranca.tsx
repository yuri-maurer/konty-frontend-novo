// konty-frontend-novo/pages/modulos/cobranca.tsx
import { useState, useEffect, useCallback, FC } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { FaFileInvoiceDollar, FaFolder, FaHistory, FaCog, FaSyncAlt, FaPaperPlane, FaTrashAlt, FaPlus, FaCalendarAlt } from 'react-icons/fa';

// Tipos de Dados para o Módulo
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

  // Estados de Autenticação e UI
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'charges' | 'files' | 'logs' | 'settings'>('charges');

  // Estados de Dados
  const [clients, setClients] = useState<Client[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);

  // URL da API (deve vir de variáveis de ambiente)
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

  // Hook para verificar permissões
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
          .eq('modulo_nome', 'cobranca') // Nome do módulo no Supabase
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

  // Função para buscar todos os dados da API
  const fetchAllData = useCallback(async () => {
    try {
        const [clientsRes, chargesRes, logsRes, settingsRes] = await Promise.all([
            fetch(`${API_URL}/cobranca/clients`),
            // Adicionar outras chamadas de fetch aqui quando os endpoints existirem
        ]);

        if (clientsRes.ok) setClients(await clientsRes.json());
        // Processar outras respostas aqui

    } catch (error) {
        console.error("Falha ao buscar dados do módulo de cobrança:", error);
        // Adicionar tratamento de erro para o usuário
    }
  }, [API_URL]);


  // Componente de Loading
  if (isLoading) {
    return (
      <DashboardLayout modules={[]}>
        <div className="flex h-full items-center justify-center">
          <p>A verificar permissões...</p>
        </div>
      </DashboardLayout>
    );
  }

  // Componente de Não Autorizado (Renderiza null e redireciona)
  if (!isAuthorized) {
    return null;
  }

  // Abas do Módulo
  const tabs = [
    { id: 'charges', label: 'Cobranças', icon: FaFileInvoiceDollar },
    { id: 'files', label: 'Arquivos', icon: FaFolder },
    { id: 'logs', label: 'Logs', icon: FaHistory },
    { id: 'settings', label: 'Configurações', icon: FaCog },
  ];

  // Renderização do conteúdo da aba ativa
  const renderTabContent = () => {
    switch (activeTab) {
      case 'charges':
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-700">Visão Geral das Cobranças</h2>
              <div className="flex space-x-3">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition">
                  <FaSyncAlt className="inline mr-2" /> Atualizar Dados
                </button>
                <button className="bg-purple-600 text-white px-4 py-2 rounded-lg shadow hover:bg-purple-700 transition">
                  <FaPaperPlane className="inline mr-2" /> Enviar Todos
                </button>
                <button className="bg-red-500 text-white px-4 py-2 rounded-lg shadow hover:bg-red-600 transition">
                  <FaTrashAlt className="inline mr-2" /> Limpar Cobranças
                </button>
              </div>
            </div>
            {/* Aqui viria a tabela de cobranças */}
            <p>Tabela de cobranças será implementada aqui.</p>
          </div>
        );
      case 'files':
        return <div>Conteúdo da aba Arquivos</div>;
      case 'logs':
        return <div>Conteúdo da aba Logs</div>;
      case 'settings':
        return <div>Conteúdo da aba Configurações</div>;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout modules={[{ name: 'Sistema de Cobrança', path: '/modulos/cobranca', icon: FaCalendarAlt }]}>
      <div className="p-6 bg-gray-50 h-full">
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
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <tab.icon className="mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-6 bg-white p-6 rounded-lg shadow">
          {renderTabContent()}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CobrancaPage;
