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
 * Layout Raiz da Aplicação.
 * Envolve todo o sistema com o Provedor do Firebase, Provedor da Sidebar e inclui a navegação lateral.
 * A área principal (main) possui uma margem esquerda reservada (ml-16) correspondente à largura da sidebar recolhida.
 * Isso garante que o conteúdo principal nunca seja sobreposto ou empurrado quando a sidebar estiver em estado de repouso,
 * expandindo no formato overlay (sobreposição) apenas durante a interação de hover.
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
              {/* Navegação Lateral Retrátil em Tempo Real */}
              <AppSidebar />

              {/* Conteúdo Principal com margem reservada de 64px (ml-16) para a Sidebar recolhida */}
              <main className="flex-1 min-w-0 ml-16 overflow-x-hidden p-4 md:p-8">
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