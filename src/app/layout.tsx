import type { Metadata } from 'next';
import './globals.css';
import { AppSidebar } from '@/components/common/AppSidebar';
import { FirebaseClientProvider } from '@/firebase';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider } from '@/components/ui/sidebar';

export const metadata: Metadata = {
  title: 'DarthBarber | Agendamento Online',
  description: 'Sistema de Agendamento e Pagamento Online para Barbearias',
};

/**
 * Layout Raiz da Aplicação
 * Envolve todo o sistema com o Provedor do Firebase, o Provedor da Sidebar e inclui a navegação lateral.
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
            <div className="flex min-h-screen w-full">
              {/* Nova Navegação Lateral Retrátil */}
              <AppSidebar />

              {/* Área do Conteúdo Principal */}
              <main className="flex-1 overflow-x-hidden p-4 md:p-8">
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