import { supabase } from './supabaseClient'; // Importa a instância do cliente Supabase

// Interface para a estrutura de dados da tabela 'permissoes'
// CORRIGIDO: A interface agora é exportada para ser usada em outros arquivos.
// CORRIGIDO: O nome da propriedade foi alterado de 'modulo' para 'modulo_nome' para corresponder ao Supabase.
export interface Permissao {
  id: number;
  user_id: string;
  modulo_nome: string; // Propriedade correta
  ativo: boolean;
  criado_em: string;
}

/**
 * Função assíncrona para buscar as permissões ativas do usuário logado.
 *
 * Devido à política de Row Level Security (RLS) habilitada no Supabase
 * com a condição `user_id = auth.uid()`, esta função automaticamente
 * retorna apenas os registros pertencentes ao usuário autenticado.
 *
 * @returns Uma Promise que resolve para um array de objetos `Permissao`
 * ou null em caso de erro.
 */
export const getPermissoes = async (): Promise<Permissao[] | null> => {
  try {
    const { data, error } = await supabase
      .from('permissoes')
      .select('*')
      .eq('ativo', true);

    if (error) {
      console.error('Erro ao buscar permissões:', error.message);
      return null;
    }

    return data as Permissao[];
  } catch (err) {
    console.error('Erro inesperado na função getPermissoes:', err);
    return null;
  }
};
