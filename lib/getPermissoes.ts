// lib/getPermissoes.ts
import { apiGet } from './api'

export async function getPermissoes() {
  try {
    // Chama a API unificada (já envia token e trata 401)
    const data = await apiGet('/painel')
    return data
  } catch (error) {
    console.error('Erro ao obter permissões:', error)
    throw error
  }
}
