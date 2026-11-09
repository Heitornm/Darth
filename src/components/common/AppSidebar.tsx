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
import { NotificationMenu } from '@/components/common/NotificationMenu';
import { NotificationListener } from '@/components/common/NotificationListener';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const BARBER_EMAIL = "heitormartins@gmail.com";
const MASTER_BARBER_ID = '2cAVs3U9ciV3NiqApJuOlYGEJS32';

/**
 * Componente da Barra Lateral (Sidebar) com expansão/recolhimento suave no Hover.
 * Utiliza o conceito de Overlay Flutuante (z-50) para cobrir a tela no hover
 * sem causar deslocamentos de layout ou empurrar o conteúdo principal.
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

  // Garante que o componente só renderize dinamicamente no cliente (evitando divergências de SSR)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Busca e determina o papel do usuário (Barbeiro ou Cliente) no Firestore
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

  // Função para efetuar logout com segurança
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
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed left-0 top-0 h-screen border-r border-border/50 bg-card/95 backdrop-blur-md z-50 flex flex-col justify-between transition-all duration-300 ease-in-out select-none shadow-2xl ${
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
            {isMounted && !isLoading && user ? (
              menuItems.map((item) => {
                const isActive = pathname === item.url;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.title}
                    href={item.url}
                    className={`
                      flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer
                      ${isActive
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
                title={!isHovered ? "Entrar" : undefined}
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

        {/* RODAPÉ DA SIDEBAR: MENU DE NOTIFICAÇÕES E OPÇÕES DO USUÁRIO */}
        <div className="p-2 border-t border-border/30 space-y-2">
          {isMounted && !isLoading && user && (
            <div className="flex flex-col gap-2">
              {/* Menu de Notificações em Tempo Real */}
              <div className="flex items-center justify-center h-10 w-full rounded-xl hover:bg-accent/50 transition-colors">
                <NotificationMenu />
              </div>

              {/* Perfil e Menu Dropdown de Opções */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-accent text-left transition-all outline-none cursor-pointer">
                    <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                      <UserCheck className="w-4 h-4 text-primary" />
                    </div>
                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'
                      }`}
                    >
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
        </div>
      </aside>
    </>
  );
}