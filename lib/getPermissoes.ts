import { supabase } from './supabaseClient'; // Importa a instância do cliente Supabase

// Interface para a estrutura de dados da tabela 'permissoes'
interface Permissao {
  id: number;
  user_id: string;
  modulo: string;
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
