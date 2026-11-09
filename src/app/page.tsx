import Link from 'next/link';
import {
  FiScissors as Scissors,
  FiCalendar as Calendar,
  FiShield as ShieldCheck,
  FiClock as Clock,
  FiArrowRight as ArrowRight,
  FiCheckCircle as CheckCircle
} from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { ServiceCarousel } from '@/components/features/services/ServiceCarousel';
import { SERVICES } from '@/data/services';

/**
 * Landing Page Principal da Barbearia
 * Apresenta a marca, os serviços prestados e redireciona o cliente diretamente para o agendamento.
 */
export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background relative">
      {/* SEÇÃO HERO - Apresentação da Barbearia */}
      <section className="relative py-24 md:py-36 overflow-hidden bg-n8n-grid bg-n8n-glow border-b border-border/40">
        <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">

          {/* Badge Informativo */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-semibold uppercase tracking-wider mb-8 shadow-n8n-glow">
            <Scissors className="w-3.5 h-3.5" />
            Atendimento Exclusivo & Com Hora Marcada
          </div>

          {/* Título Principal */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 font-headline leading-tight">
            Seu estilo em dia com a <span className="bg-gradient-to-r from-primary via-orange-400 to-amber-300 bg-clip-text text-transparent">praticidade que você precisa</span>.
          </h1>

          {/* Subtítulo */}
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Agende seus cortes, barbas e tratamentos de forma simples e rápida com pagamento online facilitado.
          </p>

          {/* Botões de Ação Principal */}
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
                Ver Tabela de Serviços
              </Link>
            </Button>
          </div>

        </div>
      </section>

      {/* SEÇÃO DE SERVIÇOS EM DESTAQUE */}
      <section className="py-20 container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight font-headline">
              Nossos Serviços
            </h2>
            <p className="text-muted-foreground mt-2">
              Escolha o tratamento ideal para o seu visual e garanta o seu horário.
            </p>
          </div>
          <Button asChild variant="link" className="text-primary hover:text-primary/80 p-0 h-auto font-semibold mt-4 md:mt-0 gap-1">
            <Link href="/services">Ver tabela completa →</Link>
          </Button>
        </div>

        {/* Carrossel Exibindo os Serviços Principais */}
        <ServiceCarousel services={SERVICES} />
      </section>

      {/* SEÇÃO DE DIFERENCIAIS DA BARBEARIA */}
      <section className="py-10 border-t border-border/40 bg-card/20 bg-n8n-grid">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 justify-items-center">

            <div className="flex items-center gap-3 p-4 rounded-xl bg-card/80 border border-border/60 hover:border-primary/40 transition-all w-full justify-center">
              <div className="p-3 rounded-lg bg-primary/10 text-primary">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg font-headline">Sem Espera & Filas</h3>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-card/80 border border-border/60 hover:border-primary/40 transition-all w-full justify-center">
              <div className="p-3 rounded-lg bg-primary/10 text-primary">
                <CheckCircle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg font-headline">Pagamento Online</h3>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-card/80 border border-border/60 hover:border-primary/40 transition-all w-full justify-center">
              <div className="p-3 rounded-lg bg-primary/10 text-primary">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg font-headline">Atendimento Exclusivo</h3>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}