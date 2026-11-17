import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppSidebar } from '@/components/common/AppSidebar';
import { FirebaseClientProvider } from '@/firebase';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider } from '@/components/ui/sidebar';

export const metadata: Metadata = {
  title: 'DarthBarber | Agendamento Online',
  description: 'Sistema de Agendamento e Pagamento Online para Barbearias',
};

// viewport-fit=cover é necessário para a barra inferior respeitar a área segura do celular.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0a0a0c',
};

/**
 * Layout Raiz da Aplicação.
 * Envolve todo o sistema com o Provedor do Firebase, Provedor da Sidebar e inclui a navegação.
 * - Desktop (md+): sidebar lateral recolhida de 64px (md:ml-16), que expande em overlay no hover.
 * - Celular: barra de navegação inferior (fixa); o conteúdo ganha pb-24 para não ficar por baixo dela.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground min-h-screen flex" suppressHydrationWarning>
        <FirebaseClientProvider>
          <SidebarProvider defaultOpen={false}>
            <div className="flex min-h-screen w-full relative">
              {/* Navegação: sidebar (desktop) ou barra inferior (celular) */}
              <AppSidebar />

              {/* Conteúdo Principal */}
              <main className="flex-1 min-w-0 md:ml-16 overflow-x-hidden p-4 pb-24 md:p-8">
                {children}
              </main>
            </div>
            <Toaster />
          </SidebarProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
