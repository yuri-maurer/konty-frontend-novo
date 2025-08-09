// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { hostname, pathname, search } = request.nextUrl;

  // Ignorar assets e arquivos públicos comuns
  const ignore = [
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/_next/static',
    '/_next/image',
    '/assets',
    '/images',
    '/fonts',
  ];
  if (ignore.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Não forçar redirect em deploy previews ou domínios *.vercel.app
  if (hostname.endsWith('.vercel.app')) {
    return NextResponse.next();
  }

  // Forçar domínio canônico www.konty.com.br
  if (hostname === 'konty.com.br') {
    const url = request.nextUrl.clone();
    url.hostname = 'www.konty.com.br';
    url.search = search; // preserva querystring
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};
