import Link from 'next/link';
import { Scissors, Calendar, Clock, ShieldCheck, ChevronRight, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="flex flex-col gap-20 pb-20">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent z-10" />
          <img 
            src="https://picsum.photos/seed/barber-hero/1200/800" 
            alt="Barbershop" 
            className="w-full h-full object-cover grayscale opacity-40"
            data-ai-hint="barbershop interior"
          />
        </div>
        
        <div className="container mx-auto px-4 relative z-20 space-y-6 max-w-2xl ml-auto md:ml-10">
          <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide border border-primary/30">
            <Scissors className="w-4 h-4" />
            <span>EXCLUSIVIDADE & ESTILO</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-headline font-bold leading-tight tracking-tight">
            Domine seu <span className="text-primary italic">Estilo</span> com Precisão
          </h1>
          <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
            Agendamento inteligente e os melhores profissionais em um só lugar para garantir o seu melhor visual.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button asChild size="lg" className="h-14 px-8 text-lg font-headline bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/20">
              <Link href="/client/appointments" className="flex items-center gap-2">
                Agende seu Corte
                <ChevronRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-14 px-8 text-lg font-headline border-border/50 hover:bg-accent hover:text-accent-foreground">
              <Link href="/barber/dashboard">Área do Barbeiro</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-headline font-bold">Por que o DarthBarber?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Tecnologia e tradição unidas para oferecer a melhor experiência de barbearia.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <Calendar className="w-8 h-8 text-primary" />,
              title: "Agendamento Online",
              desc: "Escolha seu barbeiro e horário favorito em segundos, sem complicações."
            },
            {
              icon: <UserCheck className="w-8 h-8 text-accent" />,
              title: "Profissionais de Elite",
              desc: "Nossa equipe conta com os melhores especialistas em cortes clássicos e modernos."
            },
            {
              icon: <Clock className="w-8 h-8 text-primary" />,
              title: "Tempo Real",
              desc: "Confirmação instantânea de agenda para você e para o profissional escolhido."
            }
          ].map((feature, i) => (
            <Card key={i} className="bg-card border-border/50 hover:border-primary/50 transition-all duration-300">
              <CardContent className="pt-8 text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-headline font-bold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Trust Section */}
      <section className="bg-primary/5 py-20 border-y border-primary/10">
        <div className="container mx-auto px-4 text-center space-y-8">
          <ShieldCheck className="w-16 h-16 text-primary mx-auto opacity-50" />
          <h2 className="text-3xl font-headline font-bold">Segurança e Compromisso</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Garantimos que cada agendamento seja respeitado, proporcionando uma experiência de alto nível 
            do início ao fim.
          </p>
          <div className="flex justify-center gap-12 text-sm font-bold tracking-widest text-primary uppercase">
            <span>+1000 Cortes</span>
            <span>Estilo Garantido</span>
            <span>Elite Team</span>
          </div>
        </div>
      </section>
    </div>
  );
}
