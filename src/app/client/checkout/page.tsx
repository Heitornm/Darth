"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
    Scissors,
    Clock,
    CheckCircle2,
    ArrowLeft,
    CreditCard,
    AlertCircle,
    Sparkles
} from 'lucide-react';
import { SERVICES, ServiceItem } from '@/data/services';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

function CheckoutContent() {
    const searchParams = useSearchParams();
    const { user } = useUser();
    const db = useFirestore();

    const serviceId = searchParams.get('serviceId');
    const [service, setService] = useState<ServiceItem | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (serviceId) {
            const found = SERVICES.find((s) => s.id === serviceId);
            if (found) {
                setService(found);
            } else {
                setError("Serviço não encontrado.");
            }
        } else {
            setError("Nenhum serviço foi selecionado.");
        }
    }, [serviceId]);

    const handleConfirmBooking = async () => {
        if (!user || !service || !db) {
            setError("Sessão inválida ou usuário não autenticado.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // 1. Salva o agendamento no Firestore
            const appointmentRef = await addDoc(collection(db, "appointments"), {
                userId: user.uid,
                clientId: user.uid,
                clientName: user.displayName || "Cliente",
                clientEmail: user.email || "",
                serviceId: service.id,
                serviceName: service.name,
                price: service.price,
                status: "pending",
                createdAt: serverTimestamp(),
            });

            // 2. Chama a API de Checkout
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    appointmentId: appointmentRef.id,
                    serviceId: service.id,
                    serviceName: service.name,
                    price: service.price,
                    email: user.email || "cliente@darthbarber.com",
                    clientName: user.displayName || "Cliente",
                    userId: user.uid,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || "Erro ao processar o pagamento.");
            }

            // Captura o link de pagamento independente da chave usada no backend (InfinitePay, Mercado Pago, etc.)
            const checkoutUrl = data.url || data.init_point || data.checkoutUrl || data.paymentUrl;

            if (checkoutUrl) {
                // Redireciona para o gateway externo
                window.location.href = checkoutUrl;
            } else {
                // Se a API não devolveu uma URL, lança erro para informar na tela
                console.error("Payload retornado pela API sem URL de checkout:", data);
                throw new Error("Não foi possível gerar a página de pagamento no momento. Tente novamente.");
            }
        } catch (err: any) {
            console.error("Erro ao confirmar agendamento:", err);
            setError(err.message || "Falha ao processar o agendamento. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    if (error) {
        return (
            <div className="container mx-auto px-4 py-12 max-w-lg text-center">
                <Card className="border-destructive/20 bg-destructive/5">
                    <CardHeader>
                        <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-2">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <CardTitle className="text-xl">Ops! Algo deu errado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">{error}</p>
                    </CardContent>
                    <CardFooter className="justify-center">
                        <Button asChild variant="outline">
                            <Link href="/services">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Voltar para Serviços
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    if (!service) {
        return (
            <div className="container mx-auto px-4 py-12 max-w-lg text-center">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-muted rounded w-3/4 mx-auto" />
                    <div className="h-48 bg-muted rounded-2xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-xl">
            <div className="mb-6 flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild className="rounded-full">
                    <Link href="/services">
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Voltar
                    </Link>
                </Button>
            </div>

            <Card className="overflow-hidden border-primary/10 shadow-xl bg-card">
                <CardHeader className="border-b bg-muted/30 pb-6">
                    <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider mb-1">
                        <Sparkles className="w-4 h-4" />
                        Confirmação de Agendamento
                    </div>
                    <CardTitle className="text-2xl font-bold font-headline">
                        Resumo do Pedido
                    </CardTitle>
                </CardHeader>

                <CardContent className="pt-6 space-y-6">
                    {/* Card em destaque com a Imagem e Detalhes do Serviço */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl border bg-muted/20">
                        <div className="relative w-full sm:w-28 h-28 rounded-xl overflow-hidden bg-muted shrink-0 border">
                            <Image
                                src={service.image || "/images/placeholder-service.jpg"}
                                alt={service.name}
                                fill
                                className="object-cover"
                                sizes="(max-width: 640px) 100vw, 112px"
                            />
                        </div>

                        <div className="flex-1 w-full text-center sm:text-left space-y-1">
                            <h3 className="font-bold text-lg text-foreground">{service.name}</h3>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                                {service.description || "Serviço exclusivo DarthBarber com acabamento de alta precisão."}
                            </p>

                            <div className="flex items-center justify-center sm:justify-start gap-3 pt-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-primary" />
                                    <span>{service.duration || "30"} min</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Scissors className="w-3.5 h-3.5 text-primary" />
                                    <span>Profissional</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Detalhamento de Valores */}
                    <div className="space-y-3 pt-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Subtotal do Serviço</span>
                            <span className="font-medium">R$ {Number(service.price).toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Taxa de Reserva</span>
                            <span className="text-emerald-500 font-medium">Grátis</span>
                        </div>

                        <div className="border-t pt-3 flex justify-between items-center">
                            <span className="font-bold text-base">Total a pagar</span>
                            <span className="text-2xl font-bold text-primary font-headline">
                                R$ {Number(service.price).toFixed(2)}
                            </span>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="bg-muted/10 border-t p-6 flex flex-col gap-3">
                    <Button
                        onClick={handleConfirmBooking}
                        disabled={loading}
                        size="lg"
                        className="w-full gap-2 text-base rounded-xl font-bold"
                    >
                        {loading ? (
                            "Processando..."
                        ) : (
                            <>
                                <CreditCard className="w-5 h-5" />
                                Ir para o Pagamento
                            </>
                        )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Pagamento seguro e agendamento instantâneo
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="container mx-auto px-4 py-12 text-center text-muted-foreground">
                Carregando informações do pedido...
            </div>
        }>
            <CheckoutContent />
        </Suspense>
    );
}