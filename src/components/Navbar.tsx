import Link from 'next/link';
import { Scissors, Calendar, User, LayoutDashboard } from 'lucide-react';

export function Navbar() {
  return (
    <nav className="border-b bg-card/50 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-lg">
            <Scissors className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-headline font-bold text-xl tracking-tight">DarthBarber</span>
        </Link>
        
        <div className="flex items-center gap-6">
          <Link href="/client/appointments" className="text-sm font-medium hover:text-accent transition-colors flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Agendar</span>
          </Link>
          <Link href="/barber/dashboard" className="text-sm font-medium hover:text-accent transition-colors flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden sm:inline">Painel Barbeiro</span>
          </Link>
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center cursor-pointer border border-border">
            <User className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </div>
    </nav>
  );
}
