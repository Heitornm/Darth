
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Scissors, Calendar, User, LayoutDashboard, LogOut, LogIn, ClipboardList, Settings } from 'lucide-react';
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

export function Navbar() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user && db && mounted) {
      getDoc(doc(db, 'users', user.uid)).then(d => {
        if (d.exists()) setUserRole(d.data().role);
      });
    } else if (!user) {
      setUserRole(null);
    }
  }, [user, db, mounted]);

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/');
  };

  const isBarber = userRole === 'barber' || user?.email === BARBER_EMAIL;

  if (!mounted) {
    return (
      <nav className="border-b bg-card/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 h-18 flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-xl">
              <Scissors className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-headline font-bold text-2xl tracking-tighter">DarthBarber</span>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="border-b bg-card/60 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-4 h-18 flex items-center justify-between py-3">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-primary p-2 rounded-xl group-hover:rotate-12 transition-transform duration-300">
            <Scissors className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-headline font-bold text-2xl tracking-tighter hidden sm:block">DarthBarber</span>
        </Link>
        
        <div className="flex items-center gap-1 sm:gap-4">
          {/* Apenas exibe navegação se o usuário estiver autenticado */}
          {!isUserLoading && user && (
            <div className="flex items-center gap-1 sm:gap-2 mr-2">
              {isBarber ? (
                <>
                  <NavLink href="/barber/appointments" icon={<ClipboardList className="w-4 h-4" />} label="Agendamentos" />
                  <NavLink href="/barber/dashboard" icon={<LayoutDashboard className="w-4 h-4" />} label="Painel" />
                </>
              ) : (
                <>
                  <NavLink href="/client/appointments" icon={<Calendar className="w-4 h-4" />} label="Agendar" />
                  <NavLink href="/client/my-appointments" icon={<ClipboardList className="w-4 h-4" />} label="Reservas" />
                </>
              )}
            </div>
          )}

          {user && !isUserLoading && <div className="h-6 w-px bg-border mx-2"></div>}

          {isUserLoading ? (
            <div className="w-10 h-10 rounded-full bg-muted animate-pulse"></div>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full border border-primary/20 bg-primary/5 p-0">
                  <User className="w-5 h-5 text-primary" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-bold leading-none">{user.displayName || "Usuário"}</p>
                    <p className="text-xs leading-none text-muted-foreground truncate max-w-[180px]">
                      {user.email}
                    </p>
                  </div>
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
            <Button asChild size="sm" className="gap-2 rounded-full px-6 bg-primary hover:bg-primary/90">
              <Link href="/login">
                <LogIn className="w-4 h-4" />
                Entrar
              </Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, icon, label }: { href: string, icon: any, label: string }) {
  return (
    <Button variant="ghost" asChild className="text-sm font-medium hover:text-primary hover:bg-primary/5 transition-all gap-2 h-10 rounded-xl px-3">
      <Link href={href}>
        {icon}
        <span className="hidden lg:inline">{label}</span>
      </Link>
    </Button>
  );
}
