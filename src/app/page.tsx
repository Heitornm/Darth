import Link from 'next/link';
import { Scissors, Calendar, ShieldCheck, Sparkles, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ServiceCarousel } from '@/components/features/services/ServiceCarousel';
import { SERVICES } from '@/data/services';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background relative">
      {/* Hero Section estilo n8n */}
      <section className="relative py-24 md:py-36 overflow-hidden bg-n8n-grid bg-n8n-glow border-b border-border/40">
        <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-semibold uppercase tracking-wider mb-8 shadow-n8n-glow">
            <Sparkles className="w-3.5 h-3.5" />
            Estilo & Tradição High-Tech
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 font-headline leading-tight">
            Sua experiência de barbearia num <span className="bg-gradient-to-r from-primary via-orange-400 to-amber-300 bg-clip-text text-transparent">novo nível</span>.
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Agende seus cortes, barbas e tratamentos com os melhores profissionais em uma plataforma rápida, moderna e intuitiva.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="w-full sm:w-auto gap-2 text-base px-8 py-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-n8n-glow transition-all">
              <Link href="/client/appointments/new">
                <Calendar className="w-5 h-5" />
                Agendar Horário
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto gap-2 text-base px-8 py-6 rounded-xl border-border hover:bg-secondary/60 hover:border-primary/50 transition-all">
              <Link href="/services">
                Ver Todos os Serviços
              </Link>
            </Button>
          </div>

        </div>
      </section>

      {/* Carrossel de Serviços */}
      <section className="py-20 container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight font-headline">
              Nossos Serviços
            </h2>
            <p className="text-muted-foreground mt-2">
              Escolha o tratamento ideal para o seu visual com agendamento direto.
            </p>
          </div>
          <Button asChild variant="link" className="text-primary hover:text-primary/80 p-0 h-auto font-semibold mt-4 md:mt-0 gap-1">
            <Link href="/services">Ver tabela completa →</Link>
          </Button>
        </div>

        <ServiceCarousel services={SERVICES} />
      </section>

      {/* Cards de Diferenciais estilo n8n */}
      <section className="py-20 border-t border-border/40 bg-card/20 bg-n8n-grid">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="group p-8 rounded-2xl bg-card/80 border border-border/60 hover:border-primary/40 transition-all shadow-n8n-card backdrop-blur-sm">
              <div className="p-3.5 rounded-xl bg-primary/10 text-primary w-fit mb-5 group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl mb-2 font-headline">Sem Filas</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Agendamento online em tempo real. Escolha seu horário e seja atendido pontualmente.
              </p>
            </div>

            <div className="group p-8 rounded-2xl bg-card/80 border border-border/60 hover:border-primary/40 transition-all shadow-n8n-card backdrop-blur-sm">
              <div className="p-3.5 rounded-xl bg-primary/10 text-primary w-fit mb-5 group-hover:scale-110 transition-transform">
                <Scissors className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl mb-2 font-headline">Profissionais Elite</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Barbeiros especialistas master em visagismo, cortes clássicos e estilos modernos.
              </p>
            </div>

            <div className="group p-8 rounded-2xl bg-card/80 border border-border/60 hover:border-primary/40 transition-all shadow-n8n-card backdrop-blur-sm">
              <div className="p-3.5 rounded-xl bg-primary/10 text-primary w-fit mb-5 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl mb-2 font-headline">Ambiente Premium</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Espaço exclusivo equipado para garantir seu conforto e uma experiência completa.
              </p>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}