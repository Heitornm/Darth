import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(_request: NextRequest) {
  // A validação de sessão é gerenciada no client-side com Firebase Auth SDK.
  // Deixamos o fluxo passar livremente no servidor para evitar bloqueio e prefetches incorretos.
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