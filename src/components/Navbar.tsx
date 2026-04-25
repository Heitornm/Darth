
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Scissors, Calendar, User, LayoutDashboard, LogOut, LogIn, ClipboardList, Settings } from 'lucide-react';
import { useUser, useAuth } from '@/firebase';
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
  const router = useRouter();

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/');
  };

  const isBarber = user?.email === BARBER_EMAIL;

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
          <div className="flex items-center gap-1 sm:gap-2 mr-2">
            {isBarber ? (
              <>
                <NavLink href="/barber/appointments" icon={<ClipboardList className="w-4 h-4" />} label="Agendamentos" />
                <NavLink href="/barber/dashboard" icon={<LayoutDashboard className="w-4 h-4" />} label="Meu Painel" />
              </>
            ) : (
              <>
                <NavLink href="/client/appointments" icon={<Calendar className="w-4 h-4" />} label="Agendar" />
                {user && <NavLink href="/client/my-appointments" icon={<ClipboardList className="w-4 h-4" />} label="Meus Agendamentos" />}
              </>
            )}
          </div>

          <div className="h-6 w-px bg-border mx-2"></div>

          {isUserLoading ? (
            <div className="w-10 h-10 rounded-full bg-muted animate-pulse"></div>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full border border-primary/20 bg-primary/5 p-0 focus-visible:ring-0">
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
                <DropdownMenuItem asChild className="cursor-pointer focus:bg-primary/10">
                  <Link href="/profile" className="flex items-center w-full">
                    <Settings className="w-4 h-4 mr-2 text-primary" />
                    Editar Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-500 cursor-pointer focus:bg-red-500/10">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair da Conta
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="gap-2 rounded-full px-6">
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
