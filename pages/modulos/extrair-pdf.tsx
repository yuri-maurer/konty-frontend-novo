// pages/modulos/extrair-pdf.tsx
import { useState, useEffect, useCallback, useRef, FC } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { saveAs } from 'file-saver';
import DashboardLayout from '../../components/layout/DashboardLayout';

type LogEntry = {
  dateTime: string;
  file: string;
  action: string;
  result: 'Sucesso' | 'Erro' | 'Processando';
  details: string;
};

type StatusMessage = {
  text: string;
  type: 'success' | 'error' | 'processing';
} | null;

const ExtrairPdfPage: FC = () => {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const user = useUser();

  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'dividir' | 'logs'>('dividir');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [statusMessage, setStatusMessage] = useState<StatusMessage>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user === undefined) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const checkPermissions = async () => {
      if (!user || !supabase) return;
      try {
        const { data: permission, error } = await supabase
          .from('permissoes')
          .select('ativo')
          .eq('user_id', user.id)
          .eq('modulo_nome', 'extrair-pdf')
          .single();
        if (error || !permission?.ativo) {
          router.push('/dashboard?error=unauthorized');
        } else {
          setIsAuthorized(true);
          fetchLogs();
        }
      } catch (e) {
        console.error("Erro ao verificar permissões:", e);
        router.push('/dashboard?error=unauthorized');
      } finally {
        setIsLoading(false);
      }
    };
    checkPermissions();
  }, [user, supabase, router]);

  const addLog = useCallback((action: string, result: LogEntry['result'], details: string = '', fileName?: string) => {
    const now = new Date();
    const newLog: LogEntry = {
      dateTime: now.toLocaleString('pt-BR'),
      file: fileName || file?.name || 'N/A',
      action,
      result,
      details,
    };
    setLogs(prevLogs => [newLog, ...prevLogs]);
  
    // Persistência no Supabase (não bloqueia a UI)
    try {
      const userId = (user as any)?.id || (user as any)?.user?.id;
      if (userId) {
        // roda em fire-and-forget para não travar UX
        (async () => {
          try {
            await supabase.from('user_module_logs').insert({
              user_id: userId,
              module_slug: 'extrair-pdf',
              action,
              result,
              details,
              filename: fileName || (file?.name ?? null),
            });
          } catch (e) {
            console.warn('Falha ao gravar log no Supabase:', (e as any)?.message || e);
          }
        })();
      }
    } catch (e) {
      console.warn('Supabase indisponível para logs:', (e as any)?.message || e);
    }
    }, [file?.name]);
  // Carrega logs persistidos do Supabase para este usuário (modulo extrair-pdf)
  const fetchLogs = useCallback(async () => {
    try {
      const userId = (user as any)?.id || (user as any)?.user?.id;
      if (!userId) return;
      const { data, error } = await supabase
        .from('user_module_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('module_slug', 'extrair-pdf')
        .gte('timestamp', new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString())
        .order('timestamp', { ascending: false })
        .limit(100);
      if (!error && Array.isArray(data)) {
        setLogs(data.map((l: any) => ({
          dateTime: new Date(l.timestamp).toLocaleString('pt-BR'),
          file: l.filename ?? '',
          action: l.action,
          result: l.result,
          details: l.details ?? '',
        })));
      }
    } catch (e) {
      console.warn('Falha ao carregar logs do Supabase:', (e as any)?.message || e);
    }
  }, [supabase, user]);


  const handleFileSelect = useCallback((selectedFile: File | null) => {
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setStatusMessage(null);
        addLog('Seleção de Arquivo', 'Sucesso', 'Arquivo PDF selecionado.', selectedFile.name);
      } else {
        setStatusMessage({ text: 'Formato de arquivo inválido. Por favor, selecione um PDF.', type: 'error' });
        addLog('Seleção de Arquivo', 'Erro', 'Formato de arquivo inválido.', selectedFile.name);
        setFile(null);
      }
    }
  }, [addLog]);

  const handleRemoveFile = () => {
    const fileName = file?.name;
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    addLog('Remoção de Arquivo', 'Sucesso', 'Arquivo selecionado removido.', fileName);
  };

  const handleSubmit = async () => {
    if (!file) {
      setStatusMessage({ text: 'Por favor, selecione um arquivo PDF primeiro.', type: 'error' });
      addLog('Processamento', 'Erro', 'Tentativa de processar sem arquivo selecionado.');
      return;
    }

    setIsProcessing(true);
    setStatusMessage({ text: 'A enviar PDF para processamento...', type: 'processing' });
    addLog('Envio para Backend', 'Processando', 'A iniciar upload do PDF.');

    const formData = new FormData();
    formData.append('pdf_file', file); // O backend FastAPI espera 'pdf_file'
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

    try {
      // CORREÇÃO: Adicionado o prefixo '/modulos' ao URL da API
      const response = await fetch(`${apiUrl}/modulos/processar-pdf`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Erro desconhecido no backend.' }));
        throw new Error(errorData.detail || `Erro do servidor: ${response.status}`);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'recibos_processados.zip';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      saveAs(blob, filename);
      setStatusMessage({ text: `Arquivo ZIP '${filename}' baixado com sucesso!`, type: 'success' });
      addLog('Processamento e Download', 'Sucesso', `Arquivo ZIP '${filename}' baixado.`);
    } catch (error: any) {
      console.error("Erro ao processar PDF:", error);
      const errorMessage = error.message || 'Não foi possível conectar ao backend.';
      setStatusMessage({ text: `Erro: ${errorMessage}`, type: 'error' });
      addLog('Processamento Backend', 'Erro', errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleExportLogs = () => {
    if (!logs.length) {
      alert('Não há logs para exportar.');
      return;
    }
    const csvHeader = "Data/Hora,Arquivo,Ação,Resultado,Detalhes\n";
    const csvRows = logs.map(log => 
      `"${log.dateTime}","${log.file}","${log.action}","${log.result}","${log.details.replace(/"/g, '""')}"`
    ).join('\n');
    const csvContent = csvHeader + csvRows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `logs_extrator_pdf_${new Date().toISOString().slice(0,10)}.csv`);
    addLog('Exportar Logs', 'Sucesso', 'Logs exportados para CSV.');
  };

  if (isLoading) {
    return (
      <DashboardLayout modules={[{ name: 'Extrair PDF', path: '/modulos/extrair-pdf', icon: (() => null) as any }]}>
        <div className="flex flex-col h-full items-center justify-center bg-gray-50 text-gray-600">
          <p>A verificar permissões do módulo...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthorized) return null;

  const ModuleUI = (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="p-4 border-b border-gray-200 bg-white">
        <nav className="flex space-x-2">
            <button onClick={() => setActiveTab('dividir')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'dividir' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
                Dividir PDF
            </button>
            <button onClick={() => setActiveTab('logs')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'logs' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
                Logs
            </button>
        </nav>
      </div>
      
      <div className="flex-1 p-6 overflow-y-auto">
        {activeTab === 'dividir' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragEnter}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300 ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
            >
              <div className="flex flex-col items-center justify-center">
                <i className="fas fa-cloud-upload-alt text-4xl text-blue-500 mb-3"></i>
                <p className="text-gray-600 mb-1">Arraste e solte o seu arquivo PDF aqui</p>
                <p className="text-gray-500 text-sm mb-4">ou</p>
                <input type="file" id="file-input" className="hidden" accept=".pdf" ref={fileInputRef} onChange={(e) => handleFileSelect(e.target.files ? e.target.files[0] : null)} />
                <label htmlFor="file-input" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-5 rounded-lg transition duration-300 ease-in-out shadow-sm hover:shadow-md cursor-pointer">
                  Selecionar PDF
                </label>
              </div>
            </div>

            {file && (
              <div className="mt-4">
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <i className="fas fa-file-pdf text-2xl text-red-500 flex-shrink-0"></i>
                    <span className="font-medium text-gray-800 truncate" title={file.name}>{file.name}</span>
                  </div>
                  <button onClick={handleRemoveFile} className="text-red-500 hover:text-red-700 transition-colors ml-4">
                    <i className="fas fa-times-circle text-xl"></i>
                  </button>
                </div>
              </div>
            )}
            
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleSubmit}
                disabled={!file || isProcessing}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-200 flex items-center disabled:bg-gray-400 disabled:cursor-not-allowed text-lg shadow-md hover:shadow-lg disabled:shadow-none"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    A processar...
                  </>
                ) : ( 'Processar e Baixar PDF' )}
              </button>
            </div>

             {statusMessage && (
                <div className={`mt-6 p-4 rounded-lg text-center font-medium transition-all duration-300 ${ statusMessage.type === 'success' ? 'bg-green-100 text-green-800' : statusMessage.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800' }`}>
                    {statusMessage.text}
                </div>
            )}
          </div>
        )}
        {activeTab === 'logs' && (
          <div className="bg-white rounded-lg shadow-md">
             <div className="flex justify-between items-center p-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">Histórico de Processamento</h2>
                <button onClick={handleExportLogs} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center space-x-2 shadow-sm hover:shadow-md">
                    <i className="fas fa-download"></i>
                    <span>Exportar Logs</span>
                </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data/Hora</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Arquivo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ação</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resultado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.length > 0 ? (
                    logs.map((log, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{log.dateTime}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 truncate max-w-xs" title={log.file}>{log.file}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{log.action}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                           <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${ log.result === 'Sucesso' ? 'bg-green-100 text-green-800' :  log.result === 'Erro' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800' }`}>
                                {log.result}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 truncate max-w-sm" title={log.details}>{log.details}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-gray-500">Nenhum registo de log encontrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <DashboardLayout modules={[{ name: 'Extrair PDF', path: '/modulos/extrair-pdf', icon: (() => null) as any }]}>
      {ModuleUI}
    </DashboardLayout>
  );
};

export default ExtrairPdfPage;
