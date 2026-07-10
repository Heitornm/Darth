"use client";

import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle2, Star } from 'lucide-react';
import { SERVICES } from '@/data/services';
import { BookingButton } from '@/components/features/services/BookingButton';

export default function ServicesPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <header className="text-center mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
          <Star className="w-3 h-3 fill-primary" />
          Serviços Premium
        </div>
        <h1 className="text-5xl font-headline font-bold text-foreground tracking-tight">
          Nossas Especialidades
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
          Na DarthBarber, cada detalhe é pensado para elevar seu estilo ao nível mestre. 
          Escolha o serviço que mais combina com você.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {SERVICES.map((service) => (
          <Card key={service.id} className="group overflow-hidden border-primary/10 bg-card/50 hover:border-primary/40 transition-all duration-500 shadow-xl">
            <div className="grid sm:grid-cols-5 h-full">
              <div className="sm:col-span-2 relative h-64 sm:h-auto overflow-hidden">
                <Image 
                  src={service.image} 
                  alt={service.name}
                  width={600}
                  height={400}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  data-ai-hint={service.hint}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                <div className="absolute bottom-4 left-4">
                  <span className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                    R$ {service.price}
                  </span>
                </div>
              </div>
              
              <div className="sm:col-span-3 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-2xl font-headline font-bold group-hover:text-primary transition-colors">
                      {service.name}
                    </h3>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      <Clock className="w-3 h-3" />
                      {service.durationMinutes}m
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    {service.desc}
                  </p>
                  <ul className="space-y-2 mb-6">
                    {service.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs font-medium text-foreground/80">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 🛠️ Utilizando o componente centralizado */}
                <BookingButton serviceId={service.id} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <footer className="mt-20 p-8 rounded-3xl bg-primary/5 border border-primary/10 text-center">
        <h4 className="text-xl font-headline font-bold mb-2">Procurando algo exclusivo?</h4>
        <p className="text-muted-foreground mb-6">Fale com nossos mestres para um atendimento personalizado.</p>
        <Button variant="outline" className="rounded-full border-primary/20 hover:bg-primary/10 px-8">
          Fale Conosco no WhatsApp
        </Button>
      </footer>
    </div>
  );
}