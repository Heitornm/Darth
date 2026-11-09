'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  FiScissors as Scissors, 
  FiCalendar as Calendar, 
  FiUser as User, 
  FiStar as Sparkles,
  FiTrendingUp as TrendingUp,
  FiLogOut as LogOut,
  FiUsers as Users,
  FiUserCheck as UserCheck,
  FiGrid as Grid
} from 'react-icons/fi';
import { useUser, useAuth, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupContent,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { NotificationMenu } from '@/components/common/NotificationMenu';
import { NotificationListener } from '@/components/common/NotificationListener';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const BARBER_EMAIL = "heitornmartins@gmail.com";
const MASTER_BARBER_ID = '2cAVs3U9ciV3NiqApJuOlYGEJS32';

/**
 * Componente da Barra Lateral (Sidebar) com comportamento de Expansão/Recolhimento no Hover.
 */
export function AppSidebar() {
  const { user, isLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const pathname = usePathname();

  const [isMounted, setIsMounted] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Determina se o usuário é barbeiro ou cliente
  useEffect(() => {
    let isSubscribed = true;
    async function fetchRole() {
      if (!user || !db || !isMounted) {
        if (isSubscribed) setUserRole(null);
        return;
      }
      if (user.email === BARBER_EMAIL || user.uid === MASTER_BARBER_ID) {
        if (isSubscribed) setUserRole('barber');
        return;
      }
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (isSubscribed) {
          if (userDoc.exists()) {
            setUserRole(userDoc.data()?.role || 'client');
          } else {
            setUserRole('client');
          }
        }
      } catch (error) {
        console.warn("Não foi possível carregar o papel do usuário:", error);
        if (isSubscribed) setUserRole('client');
      }
    }
    fetchRole();
    return () => { isSubscribed = false; };
  }, [user, db, isMounted]);

  const handleLogout = async () => {
    if (!auth) return; 
    try {
      await auth.signOut();
      setUserRole(null);
      router.push('/login');
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const isBarber = userRole === 'barber' || user?.email === BARBER_EMAIL || user?.uid === MASTER_BARBER_ID;

  // Itens de Menu para o Barbeiro
  const barberItems = [
    { title: 'Painel', url: '/barber/dashboard', icon: TrendingUp },
    { title: 'Solicitações', url: '/barber/appointments', icon: Calendar },
  ];

  // Itens de Menu para o Cliente
  const clientItems = [
    { title: 'Início', url: '/client', icon: Grid },
    { title: 'Novo Agendamento', url: '/client/appointments/new', icon: Calendar },
    { title: 'Minhas Reservas', url: '/client/appointments', icon: Users },
    { title: 'Serviços', url: '/services', icon: Sparkles },
  ];

  const menuItems = isBarber ? barberItems : clientItems;

  return (
    <>
      <NotificationListener />
      <Sidebar
        collapsible="icon"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`transition-all duration-300 border-r border-border/50 bg-card/95 backdrop-blur-md z-40 ${
          isHovered ? 'w-64' : 'w-16'
        }`}
      >
        {/* CABEÇALHO DA SIDEBAR - LOGOTIPO */}
        <SidebarHeader className="p-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 overflow-hidden">
            <div className="bg-primary p-2.5 rounded-xl shrink-0 shadow-n8n-glow">
              <Scissors className="w-5 h-5 text-primary-foreground" />
            </div>
            <span
              className={`font-headline font-bold text-lg tracking-tight whitespace-nowrap transition-opacity duration-200 ${
                isHovered ? 'opacity-100' : 'opacity-0 hidden'
              }`}
            >
              Darth<span className="text-primary">Barber</span>
            </span>
          </Link>
        </SidebarHeader>

        <SidebarSeparator />

        {/* CORPO DA SIDEBAR - LINKS DE NAVEGAÇÃO */}
        <SidebarContent className="px-2 py-4">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {isMounted && !isLoading && user ? (
                  menuItems.map((item) => {
                    const isActive = pathname === item.url;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={!isHovered ? item.title : undefined}
                          className={`h-11 px-3 rounded-xl transition-colors ${
                            isActive 
                              ? 'bg-primary/15 text-primary font-bold' 
                              : 'hover:bg-accent hover:text-accent-foreground text-muted-foreground'
                          }`}
                        >
                          <Link href={item.url} className="flex items-center gap-3">
                            <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-primary' : ''}`} />
                            <span className={`whitespace-nowrap transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0 hidden'}`}>
                              {item.title}
                            </span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })
                ) : (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip={!isHovered ? "Entrar" : undefined} className="h-11 px-3 rounded-xl">
                      <Link href="/login" className="flex items-center gap-3">
                        <User className="w-5 h-5 text-primary shrink-0" />
                        <span className={`whitespace-nowrap transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0 hidden'}`}>
                          Entrar na Conta
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarSeparator />

        {/* RODAPÉ DA SIDEBAR - NOTIFICAÇÕES E PERFIL */}
        <SidebarFooter className="p-2 space-y-2">
          {isMounted && !isLoading && user && (
            <div className="flex flex-col gap-2">
              {/* Ícone de Notificações */}
              <div className="flex items-center justify-center h-10 w-full rounded-xl hover:bg-accent/50">
                <NotificationMenu />
              </div>

              {/* Menu Dropdown do Usuário */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-accent text-left transition-colors outline-none">
                    <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                      <UserCheck className="w-4 h-4 text-primary" />
                    </div>
                    <div className={`overflow-hidden transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0 hidden'}`}>
                      <p className="text-sm font-semibold leading-tight truncate">{user.displayName || "Usuário"}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="end" className="w-56 mb-2 bg-card border-border">
                  <div className="p-2">
                    <p className="text-sm font-bold truncate">{user.displayName || "Usuário"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/profile')} className="cursor-pointer">
                    <User className="w-4 h-4 mr-2" /> Editar Perfil
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-500 cursor-pointer focus:bg-red-500/10 focus:text-red-500">
                    <LogOut className="w-4 h-4 mr-2" /> Sair da Conta
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </SidebarFooter>
      </Sidebar>
    </>
  );
}