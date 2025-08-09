// lib/api.ts
import { supabase } from './supabaseClient'

const API_BASE = process.env.NEXT_PUBLIC_API_URL as string

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type ApiOptions = Omit<RequestInit, 'method' | 'body' | 'headers'> & {
  method?: Method
  body?: any
  headers?: Record<string, string>
  /** Optional request timeout (ms) */
  timeoutMs?: number
}

/**
 * Fetch wrapper que:
 *  - anexa Bearer token do Supabase
 *  - serializa body para JSON quando aplicável
 *  - trata 401 (logout + redirect /login)
 */
export async function apiFetch(path: string, options: ApiOptions = {}): Promise<Response> {
  if (!API_BASE) throw new Error('NEXT_PUBLIC_API_URL is not defined')

  const url = path.startsWith('http') ? path : `${API_BASE}${path}`

  // Token atual
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token ?? null

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers ?? {}),
  }

  let body: BodyInit | undefined

  if (options.body !== undefined) {
    const b: any = options.body
    const isFormData = typeof FormData !== 'undefined' && b instanceof FormData
    if (isFormData) {
      body = b
    } else if (b instanceof Blob || b instanceof ArrayBuffer || b instanceof URLSearchParams) {
      body = b as any
    } else {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json'
      body = JSON.stringify(b)
    }
  }

  if (token) headers['Authorization'] = `Bearer ${token}`

  // Timeout opcional
  const controller = new AbortController()
  const timeoutId = options.timeoutMs ? setTimeout(() => controller.abort(), options.timeoutMs) : undefined

  try {
    const res = await fetch(url, {
      method: options.method ?? (options.body ? 'POST' : 'GET'),
      headers,
      body,
      credentials: 'include',
      signal: controller.signal,
      ...options,
    })

    if (res.status === 401) {
      await supabase.auth.signOut()
      if (typeof window !== 'undefined') window.location.href = '/login'
    }

    return res
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

export async function apiGet<T = any>(path: string, options: ApiOptions = {}): Promise<T> {
  const res = await apiFetch(path, { ...options, method: 'GET' })
  if (!res.ok) throw await toApiError(res)
  return res.json() as Promise<T>
}

export async function apiPost<T = any>(path: string, body?: any, options: ApiOptions = {}): Promise<T> {
  const res = await apiFetch(path, { ...options, method: 'POST', body })
  if (!res.ok) throw await toApiError(res)
  return res.json() as Promise<T>
}

async function toApiError(res: Response) {
  let detail: any = null
  try { detail = await res.json() } catch {}
  return new Error(`API ${res.status} ${res.statusText} – ${detail ? JSON.stringify(detail) : ''}`)
}
