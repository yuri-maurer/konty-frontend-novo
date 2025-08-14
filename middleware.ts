// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(req: NextRequest) {
  // Cria cliente atrelado ao request/response para ler sessão via cookies
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const url = req.nextUrl
  const pathname = url.pathname

  // 1) Redireciona usuário logado para /dashboard quando vier em /login
  if (pathname === '/login' && session) {
    const to = url.clone()
    to.pathname = '/dashboard'
    return NextResponse.redirect(to)
  }

  // 2) Protege rotas privadas (adicione o que fizer sentido)
  const protectedPrefixes = ['/dashboard', '/administracao', '/modulos']
  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p))
  if (isProtected && !session) {
    const to = url.clone()
    to.pathname = '/login'
    return NextResponse.redirect(to)
  }

  // 3) Permite seguir normalmente
  return res
}

// Aplica o middleware em todas as rotas, exceto assets estáticos
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)).*)'],
}
