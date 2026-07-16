import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Função auxiliar segura para decodificar Base64 no Edge Runtime
function safeDecodeJWT(token: string) {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    // Adiciona padding se necessário para evitar erros no atob nativo
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    const jsonPayload = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('__session')?.value;
  const { pathname } = request.nextUrl;

  const isBarberRoute = pathname.startsWith('/barber');
  const isClientRoute = pathname.startsWith('/client');
  const isProfileRoute = pathname.startsWith('/profile');

  // Sem sessão e tentando acessar rota privada -> Login
  if (!session && (isBarberRoute || isClientRoute || isProfileRoute)) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (session) {
    const payload = safeDecodeJWT(session);

    // Se o token estiver corrompido ou inválido
    if (!payload) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('__session');
      return response;
    }

    const userRole = payload.role || 'client';

    // Proteção Baseada em Função (RBAC)
    if (isBarberRoute && userRole !== 'barber' && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/client/appointments', request.url));
    }

    if (isClientRoute && userRole === 'barber') {
      return NextResponse.redirect(new URL('/barber/dashboard', request.url));
    }

    // Evita loop e redireciona se já estiver logado
    if (pathname === '/login') {
      return NextResponse.redirect(
        userRole === 'barber' || userRole === 'admin'
          ? new URL('/barber/dashboard', request.url)
          : new URL('/client/appointments', request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/barber/:path*',
    '/client/:path*',
    '/profile/:path*',
    '/login',
  ],
};