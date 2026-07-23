"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '@/firebase/config';
import { useUser } from '@/firebase'; // Traz o estado reativo de autenticação do seu app

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/client/appointments/new';

  const { user, isUserLoading } = useUser();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [error, setError] = useState('');

  // 🚀 1. REDIRECIONAMENTO AUTOMÁTICO
  // Sempre que o estado do usuário mudar para LOGADO, envia para a tela de destino imediatamente
  useEffect(() => {
    if (!isUserLoading && user) {
      router.replace(redirectTo);
    }
  }, [user, isUserLoading, router, redirectTo]);

  // 2. Login com E-mail e Senha
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingEmail(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // O useEffect acima cuidará de redirecionar assim que a sessão for sincronizada
    } catch (err: any) {
      console.error("Erro no login por e-mail:", err);
      setError('Credenciais inválidas. Verifique seu e-mail e senha.');
      setLoadingEmail(false);
    }
  };

  // 3. Login com Conta Google
  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    setError('');

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      const result = await signInWithPopup(auth, provider);

      if (result.user) {
        // Garantia adicional de navegação caso o useEffect demore
        router.replace(redirectTo);
      }
    } catch (err: any) {
      console.error("Erro no login Google:", err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Falha ao autenticar com o Google. Tente novamente.');
      }
      setLoadingGoogle(false);
    }
  };

  const isAnyLoading = loadingEmail || loadingGoogle || isUserLoading;

  // Se o usuário já estiver logado (ou checando sessão), exibe um estado visual de transição
  if (user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-muted-foreground text-sm font-medium">Sessão iniciada! Redirecionando para agendamento...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[75vh] px-4 py-8">
      <Card className="w-full max-w-md border-primary/20 bg-card/60 backdrop-blur-md shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-headline font-bold text-primary tracking-tight">
            DARTH BARBER
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            Acesse sua conta para agendar e gerenciar seus horários
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive text-center font-medium">
              {error}
            </div>
          )}

          {/* Botão Oficial do Google */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleLogin}
            disabled={isAnyLoading}
            className="w-full h-12 rounded-xl border-border/80 hover:bg-muted/50 font-medium text-foreground gap-3 transition-all"
          >
            {loadingGoogle ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Entrar com o Google
              </>
            )}
          </Button>

          {/* Divisor Visual */}
          <div className="relative flex items-center justify-center">
            <Separator className="w-full bg-border/60" />
            <span className="absolute bg-card px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              ou use seu e-mail
            </span>
          </div>

          {/* Formulário Tradicional */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-muted-foreground">E-mail</label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isAnyLoading}
                className="h-11 rounded-xl bg-background/50 border-border/80"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-muted-foreground">Senha</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isAnyLoading}
                className="h-11 rounded-xl bg-background/50 border-border/80"
              />
            </div>

            <Button
              type="submit"
              disabled={isAnyLoading}
              className="w-full h-11 rounded-xl font-headline font-bold text-base mt-2"
            >
              {loadingEmail ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Acessar Conta'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}