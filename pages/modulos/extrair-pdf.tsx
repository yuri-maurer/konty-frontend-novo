// pages/modulos/extrair-pdf.tsx
import { useState, useEffect, useCallback, useRef, FC } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { saveAs } from 'file-saver';

// --- Tipos e Interfaces ---
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

// --- Componente do Módulo ---
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
      if (!supabase) return;

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
      }
      setIsLoading(false);
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
  }, [file?.name]);

  const handleFileSelect = useCallback((selectedFile: File | null) => {
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setStatusMessage(null);
        addLog('Seleção de Arquivo', 'Sucesso', 'Arquivo PDF selecionado.', selectedFile.name);
      } else {
        addLog('Seleção de Arquivo', 'Erro', 'Formato de arquivo inválido.', selectedFile.name);
        alert('Erro: Por favor, selecione um arquivo PDF.');
        setFile(null);
      }
    }
  }, [addLog]);

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    addLog('Remoção de Arquivo', 'Sucesso', 'Arquivo selecionado removido.');
  };

  const handleSubmit = async () => {
    if (!file) {
      alert('Por favor, selecione um arquivo PDF primeiro.');
      addLog('Processamento', 'Erro', 'Tentativa de processar sem arquivo selecionado.');
      return;
    }

    setIsProcessing(true);
    setStatusMessage({ text: 'A enviar PDF para processamento...', type: 'processing' });
    addLog('Envio para Backend', 'Processando', 'A iniciar upload do PDF.');

    const formData = new FormData();
    formData.append('pdfFile', file);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';

    try {
      const response = await fetch(`${apiUrl}/processar-pdf`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro do servidor: ${response.status}`);
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
  
  const handleExportLogs = () => {
    if (logs.length === 0) {
        alert('Não há logs para exportar.');
        return;
    }
    const csvHeader = "Data/Hora,Arquivo,Ação,Resultado,Detalhes\n";
    const csvRows = logs.map(log => `"${log.dateTime}","${log.file}","${log.action}","${log.result}","${log.details.replace(/"/g, '""')}"`).join('\n');
    const csvContent = csvHeader + csvRows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `logs_extrator_pdf_${new Date().toISOString().slice(0,10)}.csv`);
    addLog('Exportar Logs', 'Sucesso', 'Logs exportados para CSV.');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-600">A verificar permissões do módulo...</p>
      </div>
    );
  }

  if (!isAuthorized) {
     return null;
  }

  // Renderização principal do componente
  return (
    // CORREÇÃO: Adicionado 'flex flex-col h-full' para que o layout ocupe todo o espaço vertical.
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md">
      {/* Header com abas */}
      <div className="p-4 border-b border-gray-200">
        <nav className="flex space-x-2">
            <button onClick={() => setActiveTab('dividir')} className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'dividir' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                Dividir PDF
            </button>
            <button onClick={() => setActiveTab('logs')} className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'logs' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                Logs
            </button>
        </nav>
      </div>
      
      {/* Área de conteúdo da aba */}
      <div className="flex-1 p-6 overflow-y-auto">
        {activeTab === 'dividir' && (
          <div>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
              onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors duration-300 ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
            >
              <div className="flex flex-col items-center justify-center">
                <i className="fas fa-cloud-upload-alt text-5xl text-blue-500 mb-4"></i>
                <p className="text-lg text-gray-700 mb-2">Arraste e solte o seu arquivo PDF aqui</p>
                <p className="text-gray-500 text-sm mb-4">ou</p>
                <input type="file" id="file-input" className="hidden" accept=".pdf" ref={fileInputRef} onChange={(e) => handleFileSelect(e.target.files ? e.target.files[0] : null)} />
                <label htmlFor="file-input" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out shadow-md cursor-pointer">
                  Selecionar PDF
                </label>
              </div>
            </div>
            {file && (
              <div className="mt-6">
                <div className="flex items-center justify-between bg-gray-100 p-3 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-file-pdf text-2xl text-red-500"></i>
                    <span className="font-medium text-gray-800">{file.name}</span>
                  </div>
                  <button onClick={handleRemoveFile} className="text-red-500 hover:text-red-700 transition-colors">
                    <i className="fas fa-times-circle text-xl"></i>
                  </button>
                </div>
              </div>
            )}
            <div className="mt-8 flex justify-center">
              <button
                onClick={handleSubmit}
                disabled={!file || isProcessing}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-200 flex items-center disabled:bg-gray-400 disabled:cursor-not-allowed text-lg shadow-lg"
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
                <div className={`mt-6 p-4 rounded-lg text-center font-medium ${ statusMessage.type === 'success' ? 'bg-green-100 text-green-800' : statusMessage.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800' }`}>
                    {statusMessage.text}
                </div>
            )}
          </div>
        )}
        {activeTab === 'logs' && (
          <div className="bg-white rounded-lg">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Histórico de Processamento</h2>
                <button onClick={handleExportLogs} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200">
                    <i className="fas fa-download mr-2"></i> Exportar Logs
                </button>
            </div>
            <div className="overflow-x-auto border rounded-lg">
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
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.dateTime}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 truncate max-w-xs">{log.file}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.action}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                           <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${ log.result === 'Sucesso' ? 'bg-green-100 text-green-800' :  log.result === 'Erro' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800' }`}>
                                {log.result}
                           </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.details}</td>
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
};

export default ExtrairPdfPage;
