import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('__session')?.value;
  const { pathname } = request.nextUrl;

  // Rotas protegidas por escopo
  const isBarberRoute = pathname.startsWith('/barber');
  const isClientRoute = pathname.startsWith('/client');
  const isProfileRoute = pathname.startsWith('/profile');

  // Se tentar acessar área restrita sem cookie de sessão, joga para o login
  if (!session && (isBarberRoute || isClientRoute || isProfileRoute)) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (session) {
    try {
      // Decodifica o payload do JWT do Firebase Session Cookie (sem verificar a assinatura, pois o Edge Middleware não roda ambiente Node completo)
      const base64Url = session.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      
      const userRole = payload.role || 'client'; // Custom claim definido no Firebase Auth

      // Proteção Baseada em Função (RBAC)
      if (isBarberRoute && userRole !== 'barber' && userRole !== 'admin') {
        return NextResponse.redirect(new URL('/client/appointments', request.url));
      }

      if (isClientRoute && userRole === 'barber') {
        return NextResponse.redirect(new URL('/barber/dashboard', request.url));
      }

      // Evita que usuário logado acesse a página de login novamente
      if (pathname === '/login') {
        return NextResponse.redirect(
          userRole === 'barber' || userRole === 'admin'
            ? new URL('/barber/dashboard', request.url)
            : new URL('/client/appointments', request.url)
        );
      }
    } catch (error) {
      // Se o token for corrompido, limpa e manda pro login
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('__session');
      return response;
    }
  }

  return NextResponse.next();
}

// Configuração de quais rotas o middleware vai interceptar
export const config = {
  matcher: [
    '/barber/:path*',
    '/client/:path*',
    '/profile/:path*',
    '/login',
  ],
};