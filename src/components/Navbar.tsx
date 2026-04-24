
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Scissors, Calendar, User, LayoutDashboard, LogOut, LogIn } from 'lucide-react';
import { useUser, useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

export function Navbar() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/');
  };

  const isBarber = user?.email === "darthbarber@darth.com.br";

  return (
    <nav className="border-b bg-card/50 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-lg">
            <Scissors className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-headline font-bold text-xl tracking-tight">DarthBarber</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <Link href="/client/appointments" className="text-sm font-medium hover:text-accent transition-colors flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Agendar</span>
          </Link>

          {isBarber && (
            <Link href="/barber/dashboard" className="text-sm font-medium hover:text-accent transition-colors flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Painel Barbeiro</span>
            </Link>
          )}

          <div className="h-8 w-px bg-border mx-2 hidden sm:block"></div>

          {isUserLoading ? (
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse"></div>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center cursor-pointer border border-primary/30">
                  <User className="w-4 h-4 text-primary" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  {user.email}
                </div>
                <DropdownMenuItem onClick={handleLogout} className="text-red-500 cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" variant="outline" className="gap-2">
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
