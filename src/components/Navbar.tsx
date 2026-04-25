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

const BARBER_EMAIL = "darthbarber@darth.com.br";
const MASTER_BARBER_ID = 'eUCAkXknM1N0mcC04hCIfF3HcMk1';

export function Navbar() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (user && db && isMounted) {
      getDoc(doc(db, 'users', user.uid)).then(d => {
        if (d.exists()) setUserRole(d.data().role);
      });
    } else if (!user) {
      setUserRole(null);
    }
  }, [user, db, isMounted]);

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/');
  };

  const isBarber = userRole === 'barber' || user?.email === BARBER_EMAIL || user?.uid === MASTER_BARBER_ID;

  return (
    <nav className="border-b bg-card/60 backdrop-blur-xl sticky top-0 z-50 h-16">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-primary p-2 rounded-xl group-hover:rotate-12 transition-transform duration-300">
            <Scissors className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-headline font-bold text-xl tracking-tighter text-foreground hidden sm:block">DarthBarber</span>
        </Link>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1 sm:gap-2">
            <NavLink href="/services" icon={<Sparkles className="w-4 h-4" />} label="Serviços" />
            {isMounted && !isUserLoading && user && (
              <>
                {isBarber ? (
                  <>
                    <NavLink href="/barber/appointments" icon={<ClipboardList className="w-4 h-4" />} label="Agenda" />
                    <NavLink href="/barber/dashboard" icon={<LayoutDashboard className="w-4 h-4" />} label="Painel" />
                  </>
                ) : (
                  <>
                    <NavLink href="/client/appointments" icon={<Calendar className="w-4 h-4" />} label="Agendar" />
                    <NavLink href="/client/my-appointments" icon={<ClipboardList className="w-4 h-4" />} label="Minhas Reservas" />
                  </>
                )}
              </>
            )}
          </div>

          <div className="flex items-center min-w-[40px] justify-end">
            {!isMounted || isUserLoading ? (
              <div className="w-10 h-10 rounded-full bg-muted/20 animate-pulse border border-primary/10"></div>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full border border-primary/20 bg-primary/5 p-0 focus-visible:ring-0">
                    <User className="w-5 h-5 text-primary" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-2">
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-bold leading-none">{user.displayName || "Usuário"}</p>
                    <p className="text-xs leading-none text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/profile" className="flex items-center w-full">
                      <Settings className="w-4 h-4 mr-2" />
                      Editar Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-500 cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair da Conta
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild size="sm" className="rounded-full px-4 sm:px-6 bg-primary hover:bg-primary/90">
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

function NavLink({ href, icon, label }: { href: string, icon: any, label: string }) {
  return (
    <Button variant="ghost" asChild className="text-sm font-medium hover:text-primary transition-all gap-2 h-9 rounded-xl px-2 sm:px-3">
      <Link href={href}>
        {icon}
        <span className="hidden lg:inline">{label}</span>
      </Link>
    </Button>
  );
}
