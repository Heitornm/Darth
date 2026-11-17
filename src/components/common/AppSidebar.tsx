'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { IconType } from 'react-icons';
import {
  FiScissors as Scissors,
  FiCalendar as Calendar,
  FiUser as User,
  FiStar as Sparkles,
  FiTrendingUp as TrendingUp,
  FiLogOut as LogOut,
  FiUsers as Users,
  FiUserCheck as UserCheck,
  FiGrid as Grid,
} from 'react-icons/fi';
import { useUser, useAuth } from '@/firebase';
import { useIsMobile } from '@/hooks/use-mobile';
import { NotificationMenu } from '@/components/common/NotificationMenu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MenuItem {
  title: string;
  shortTitle: string; // rótulo curto para a barra inferior (celular)
  url: string;
  icon: IconType;
}

// Itens de Menu para o Barbeiro
const BARBER_ITEMS: MenuItem[] = [
  { title: 'Painel', shortTitle: 'Painel', url: '/barber/dashboard', icon: TrendingUp },
  { title: 'Solicitações', shortTitle: 'Agenda', url: '/barber/appointments', icon: Calendar },
];

// Itens de Menu para o Cliente
const CLIENT_ITEMS: MenuItem[] = [
  { title: 'Início', shortTitle: 'Início', url: '/client', icon: Grid },
  { title: 'Novo Agendamento', shortTitle: 'Agendar', url: '/client/appointments/new', icon: Calendar },
  { title: 'Minhas Reservas', shortTitle: 'Reservas', url: '/client/appointments', icon: Users },
  { title: 'Serviços', shortTitle: 'Serviços', url: '/services', icon: Sparkles },
];

interface UserMenuProps {
  displayName: string;
  email: string;
  avatarUrl?: string;
  variant: 'sidebar' | 'bottom';
  expanded?: boolean;
  onProfile: () => void;
  onLogout: () => void;
}

/** Menu do usuário (perfil / sair), usado na sidebar e na barra inferior. */
function UserMenu({
  displayName,
  email,
  avatarUrl,
  variant,
  expanded = false,
  onProfile,
  onLogout,
}: UserMenuProps) {
  const avatarSize = variant === 'bottom' ? 'h-6 w-6' : 'h-9 w-9';
  const avatar = (
    <div
      className={`${avatarSize} rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0 overflow-hidden`}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <UserCheck className="w-4 h-4 text-primary" />
      )}
    </div>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === 'sidebar' ? (
          <button className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-accent text-left transition-all outline-none cursor-pointer">
            {avatar}
            <div
              className={`overflow-hidden transition-all duration-300 ${
                expanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'
              }`}
            >
              <p className="text-sm font-semibold leading-tight truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{email}</p>
            </div>
          </button>
        ) : (
          <button
            className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-muted-foreground outline-none"
            aria-label="Perfil"
          >
            {avatar}
            <span>Perfil</span>
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={variant === 'sidebar' ? 'right' : 'top'}
        align="end"
        className="w-56 mb-2 bg-card border-border"
      >
        <div className="p-2">
          <p className="text-sm font-bold truncate">{displayName}</p>
          <p className="text-xs text-muted-foreground truncate">{email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onProfile} className="cursor-pointer">
          <User className="w-4 h-4 mr-2" /> Editar Perfil
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onLogout}
          className="text-red-500 cursor-pointer focus:bg-red-500/10 focus:text-red-500"
        >
          <LogOut className="w-4 h-4 mr-2" /> Sair da Conta
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Navegação principal.
 * - Desktop/tablet: barra lateral que expande no hover (overlay, sem empurrar o conteúdo).
 * - Celular (< 768px): barra de navegação inferior (hover não existe no toque).
 * O papel (barbeiro/cliente) vem do contexto: useUser().isBarber.
 */
export function AppSidebar() {
  const { user, userProfile, isLoading, isBarber } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();

  const [isMounted, setIsMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Garante que o componente só renderize dinamicamente no cliente (evitando divergências de SSR)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Função para efetuar logout com segurança
  const handleLogout = async () => {
    if (!auth) return;
    try {
      await auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  if (!isMounted) return null;

  const isLoggedIn = !isLoading && !!user;
  const menuItems = isBarber ? BARBER_ITEMS : CLIENT_ITEMS;
  const displayName: string = user?.displayName || userProfile?.name || 'Usuário';
  const email: string = user?.email || '';
  const avatarUrl: string | undefined = userProfile?.avatarUrl || undefined;

  // ======================= CELULAR: BARRA INFERIOR =======================
  if (isMobile) {
    return (
      <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-border/50 bg-card/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-stretch h-16">
          {isLoggedIn ? (
            <>
              {menuItems.map((item) => {
                const isActive = pathname === item.url;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.url}
                    href={item.url}
                    className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.shortTitle}</span>
                  </Link>
                );
              })}
              <div className="flex flex-1 flex-col items-center justify-center">
                <NotificationMenu />
              </div>
              <UserMenu
                variant="bottom"
                displayName={displayName}
                email={email}
                avatarUrl={avatarUrl}
                onProfile={() => router.push('/profile')}
                onLogout={handleLogout}
              />
            </>
          ) : (
            <Link
              href="/login"
              className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-muted-foreground"
            >
              <User className="w-5 h-5 text-primary" />
              <span>Entrar</span>
            </Link>
          )}
        </div>
      </nav>
    );
  }

  // ======================= DESKTOP: SIDEBAR COM HOVER =======================
  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed left-0 top-0 h-dvh border-r border-border/50 bg-card/95 backdrop-blur-md z-50 flex flex-col justify-between transition-all duration-300 ease-in-out select-none shadow-2xl ${
        isHovered ? 'w-64' : 'w-16'
      }`}
    >
      {/* PARTE SUPERIOR: LOGOTIPO E LINKS DE NAVEGAÇÃO */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* LOGOTIPO DA BARBEARIA */}
        <div className="p-3.5 flex items-center justify-start border-b border-border/30">
          <Link href="/" className="flex items-center gap-3 overflow-hidden">
            <div className="bg-primary p-2.5 rounded-xl shrink-0 shadow-sm flex items-center justify-center">
              <Scissors className="w-5 h-5 text-primary-foreground" />
            </div>
            <span
              className={`font-headline font-bold text-lg tracking-tight whitespace-nowrap transition-all duration-300 ${
                isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'
              }`}
            >
              Darth<span className="text-primary">Barber</span>
            </span>
          </Link>
        </div>

        {/* LISTA DE OPÇÕES DO MENU */}
        <nav className="p-2 space-y-1 mt-2 flex-1 overflow-y-auto">
          {isLoggedIn ? (
            menuItems.map((item) => {
              const isActive = pathname === item.url;
              const Icon = item.icon;

              return (
                <Link
                  key={item.url}
                  href={item.url}
                  className={`
                    flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer
                    ${
                      isActive
                        ? 'bg-primary/15 text-primary font-bold shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }
                  `}
                  title={!isHovered ? item.title : undefined}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-primary' : ''}`} />
                  <span
                    className={`whitespace-nowrap transition-all duration-300 ${
                      isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'
                    }`}
                  >
                    {item.title}
                  </span>
                </Link>
              );
            })
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200"
              title={!isHovered ? 'Entrar' : undefined}
            >
              <User className="w-5 h-5 text-primary shrink-0" />
              <span
                className={`whitespace-nowrap transition-all duration-300 ${
                  isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'
                }`}
              >
                Entrar na Conta
              </span>
            </Link>
          )}
        </nav>
      </div>

      {/* RODAPÉ DA SIDEBAR: NOTIFICAÇÕES E OPÇÕES DO USUÁRIO */}
      <div className="p-2 border-t border-border/30 space-y-2">
        {isLoggedIn && (
          <div className="flex flex-col gap-2">
            {/* Menu de Notificações em Tempo Real (também dispara os avisos de novas notificações) */}
            <div className="flex items-center justify-center h-10 w-full rounded-xl hover:bg-accent/50 transition-colors">
              <NotificationMenu />
            </div>

            {/* Perfil e Menu Dropdown de Opções */}
            <UserMenu
              variant="sidebar"
              expanded={isHovered}
              displayName={displayName}
              email={email}
              avatarUrl={avatarUrl}
              onProfile={() => router.push('/profile')}
              onLogout={handleLogout}
            />
          </div>
        )}
      </div>
    </aside>
  );
}