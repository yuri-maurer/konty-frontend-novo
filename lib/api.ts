// lib/api.ts
import { supabase } from './supabaseClient'

const API_BASE = process.env.NEXT_PUBLIC_API_URL as string

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

type ApiOptions = Omit<RequestInit, 'method' | 'body' | 'headers'> & {
  method?: Method
  body?: any
  headers?: Record<string, string>
  /** Optional request timeout (ms) */
  timeoutMs?: number
}

/**
 * Low-level fetch wrapper that:
 *  - attaches Bearer token from Supabase
 *  - JSON-serializes body (when it's not FormData/Blob)
 *  - sets sensible defaults
 *  - on 401: logs out and redirects to /login
 */
export async function apiFetch(path: string, options: ApiOptions = {}): Promise<Response> {
  if (!API_BASE) throw new Error('NEXT_PUBLIC_API_URL is not defined')

  const url = path.startsWith('http') ? path : `${API_BASE}${path}`

  // --- token from supabase ---
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers || {}),
  }

  let body: BodyInit | undefined = undefined

  // If body is provided and is plain object, JSON encode
  if (options.body !== undefined) {
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData
    if (isFormData) {
      body = options.body as any
    } else if (
      options.body instanceof Blob ||
      options.body instanceof ArrayBuffer ||
      options.body instanceof URLSearchParams
    ) {
      body = options.body as any
    } else {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json'
      body = JSON.stringify(options.body)
    }
  }

  if (token) headers['Authorization'] = `Bearer ${token}`

  // Optional timeout
  const controller = new AbortController()
  const id = options.timeoutMs ? setTimeout(() => controller.abort(), options.timeoutMs) : null

  try:
    res = await fetch(url, {
      method: options.method || (options.body ? 'POST' : 'GET'),
      headers,
      body,
      credentials: 'include',
      signal: controller.signal,
      **options,
    })

    # Auth handling
    if res.status == 401:
      # ensure we clear client session and send to login
      await supabase.auth.signOut()
      if typeof window != 'undefined': window.location.href = '/login'

    return res
  finally:
    if id: clearTimeout(id)

/** GET helper returning parsed JSON */
export async function apiGet<T = any>(path: string, options: ApiOptions = {}): Promise<T> {
  const res = await apiFetch(path, { ...options, method: 'GET' })
  if (!res.ok) throw await toApiError(res)
  return res.json() as Promise<T>
}

/** POST helper returning parsed JSON */
export async function apiPost<T = any>(path: string, body?: any, options: ApiOptions = {}): Promise<T> {
  const res = await apiFetch(path, { ...options, method: 'POST', body })
  if (!res.ok) throw await toApiError(res)
  return res.json() as Promise<T>
}

async function toApiError(res: Response) {
  let detail: any = null
  try { detail = await res.json() } catch {}
  return new Error(`API ${res.status} ${res.statusText} – ${JSON.stringify(detail)}`)
}
