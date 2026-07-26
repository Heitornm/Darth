import Link from 'next/link';
import { Scissors, Calendar, ShieldCheck, Sparkles, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ServiceCarousel } from '@/components/features/services/ServiceCarousel';
import { SERVICES } from '@/data/services';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden bg-gradient-to-b from-background via-background/80 to-card/50">
        <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Estilo & Tradição
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 font-headline">
            Sua experiência de barbearia num <span className="text-primary">novo nível</span>.
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Agende seus cortes, barbas e tratamentos com os melhores profissionais da região em poucos cliques.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="w-full sm:w-auto gap-2 text-base px-8 py-6 rounded-xl">
              <Link href="/client/appointments/new">
                <Calendar className="w-5 h-5" />
                Agendar Horário
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto gap-2 text-base px-8 py-6 rounded-xl">
              <Link href="/services">
                Ver Todos os Serviços
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Carrossel / Lista de Serviços Principais */}
      <section className="py-16 container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
              Nossos Serviços
            </h2>
            <p className="text-muted-foreground mt-1">
              Escolha o tratamento ideal para o seu visual.
            </p>
          </div>
          <Button asChild variant="link" className="text-primary p-0 h-auto font-semibold mt-4 md:mt-0">
            <Link href="/services">Ver tabela completa →</Link>
          </Button>
        </div>

        {/* Componente corrigido passando a prop 'services' */}
        <ServiceCarousel services={SERVICES} />
      </section>

      {/* Diferenciais */}
      <section className="py-16 bg-card/40 border-y">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start gap-4 p-6 rounded-2xl bg-card border">
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Sem Filas</h3>
                <p className="text-sm text-muted-foreground">
                  Agendamento online rápido e garantido no horário marcado.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 rounded-2xl bg-card border">
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <Scissors className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Profissionais Elite</h3>
                <p className="text-sm text-muted-foreground">
                  Especialistas nos cortes clássicos e tendências modernas.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 rounded-2xl bg-card border">
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Ambiente Premium</h3>
                <p className="text-sm text-muted-foreground">
                  Espaço confortável com atendimento de alto padrão.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}