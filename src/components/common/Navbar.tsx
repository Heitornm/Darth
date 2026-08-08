"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Scissors, Calendar, User, LayoutDashboard, LogOut, LogIn, ClipboardList, Settings, Sparkles } from 'lucide-react';
import { useUser, useAuth, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { NotificationMenu } from '@/components/common/NotificationMenu';
import { NotificationListener } from '@/components/common/NotificationListener';

const BARBER_EMAIL = "darthbarber@darth.com.br";
const MASTER_BARBER_ID = 'eUCAkXknM1N0mcC04hCIfF3HcMk1';

export function Navbar() {
  const { user, isLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
        console.warn("Não foi possível carregar o 'role' do usuário. Assumindo cliente:", error);
        if (isSubscribed) setUserRole('client');
      }
    }

    fetchRole();

    return () => {
      isSubscribed = false;
    };
  }, [user, db, isMounted]);

  const handleLogout = async () => {
    if (!auth) return; 
    
    try {
      await auth.signOut();
      setUserRole(null);
      router.push('/login');
    } catch (error) {
      console.error("Erro ao realizar logout:", error);
    }
  };

  const isBarber = userRole === 'barber' || user?.email === BARBER_EMAIL || user?.uid === MASTER_BARBER_ID;

  return (
    <nav className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50 h-16">
      <NotificationListener />

      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="bg-primary p-2 rounded-xl group-hover:rotate-12 transition-all shadow-n8n-glow">
            <Scissors className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-headline font-bold text-xl tracking-tight text-foreground hidden sm:block">
            Darth<span className="text-primary">Barber</span>
          </span>
        </Link>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1 sm:gap-2">
            <NavLink href="/services" icon={<Sparkles className="w-4 h-4 text-primary" />} label="Serviços" />
            
            {isMounted && !isLoading && user && (
              <>
                {isBarber ? (
                  <>
                    <NavLink href="/barber/appointments" icon={<ClipboardList className="w-4 h-4" />} label="Agenda" />
                    <NavLink href="/barber/dashboard" icon={<LayoutDashboard className="w-4 h-4" />} label="Painel" />
                  </>
                ) : (
                  <>
                    <NavLink href="/client/appointments/new" icon={<Calendar className="w-4 h-4" />} label="Agendar" />
                    <NavLink href="/client/appointments" icon={<ClipboardList className="w-4 h-4" />} label="Minhas Reservas" />
                  </>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-2 min-w-[40px] justify-end">
            {!isMounted || isLoading ? (
              <div className="w-9 h-9 rounded-full bg-muted/30 animate-pulse border border-border" />
            ) : user ? (
              <>
                <NotificationMenu />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full border border-border bg-card p-0 hover:border-primary/50 focus-visible:ring-1 focus-visible:ring-primary">
                      <User className="w-4 h-4 text-primary" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 mt-2 bg-card border-border">
                    <div className="flex flex-col space-y-1 p-2">
                      <p className="text-sm font-bold leading-none">{user.displayName || "Usuário"}</p>
                      <p className="text-xs leading-none text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    <DropdownMenuSeparator className="bg-border" />
                    
                    {!isBarber && (
                      <DropdownMenuItem onClick={() => router.push('/client/appointments')} className="cursor-pointer">
                        <ClipboardList className="w-4 h-4 mr-2" />
                        Minhas Reservas
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuItem onClick={() => router.push('/profile')} className="cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" />
                      Editar Perfil
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-400 cursor-pointer focus:text-red-400 focus:bg-red-500/10">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair da Conta
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button asChild size="sm" className="rounded-xl px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-n8n-glow">
                <Link href="/login" className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  <span className="hidden xs:inline">Entrar</span>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, icon, label }: { href: string; icon: any; label: string }) {
  return (
    <Button variant="ghost" asChild className="text-sm font-medium hover:text-primary hover:bg-secondary/50 transition-all gap-2 h-9 rounded-xl px-3">
      <Link href={href}>
        {icon}
        <span className="hidden md:inline">{label}</span>
      </Link>
    </Button>
  );
}