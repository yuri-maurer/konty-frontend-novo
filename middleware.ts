// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';

  // Se acessar sem www.konty.com.br, redireciona preservando caminho e query
  if (host === 'konty.com.br') {
    const url = request.nextUrl.clone();
    url.host = 'www.konty.com.br';
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/:path*', // Aplica em todas as rotas
};
