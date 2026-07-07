"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Scissors, Mail, Lock, User as UserIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

// Ícone simples do Google em SVG para o botão
function GoogleIcon() {
  return (
    <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
      <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 137.8 248 137.8 248 137.8c-70.6 0-128 57.4-128 128s57.4 128 128 128c70.6 0 128-57.4 128-128 0-8.2-.7-16.3-2-24H248v-85.3h235.7c2.3 12.7 4.3 25.6 4.3 41.5z"></path>
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !auth) return;
    
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Bem-vindo de volta!", description: "Acesso realizado com sucesso." });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Falha no Acesso",
        description: "E-mail ou senha incorretos.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name || !auth) return;
    
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      await updateProfile(newUser, { displayName: name });

      if (db) {
        const userData = {
          id: newUser.uid,
          name: name,
          email: email,
          role: 'client',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        setDoc(doc(db, 'users', newUser.uid), userData)
          .catch(async (_err) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: `users/${newUser.uid}`,
              operation: 'create',
              requestResourceData: userData,
            }));
          });
      }

      toast({ title: "Conta criada!", description: `Bem-vindo, ${name}.` });
      router.push('/');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro no Cadastro",
        description: error.message || "Não foi possível criar sua conta.",
      });
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth || !db) return;

    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;

      const userDocRef = doc(db, 'users', googleUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        const userData = {
          id: googleUser.uid,
          name: googleUser.displayName || 'Cliente Google',
          email: googleUser.email || '',
          role: 'client',
          avatarUrl: googleUser.photoURL || null,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        await setDoc(userDocRef, userData);
        toast({ title: "Conta criada!", description: `Bem-vindo, ${userData.name}.` });
      } else {
        toast({ title: "Bem-vindo de volta!", description: "Acesso realizado com a conta Google." });
      }

      router.push('/');
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Erro com o Google",
        description: error.message || "Não foi possível acessar com o Google.",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md border-primary/20 bg-card/60 backdrop-blur-xl shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
            <Scissors className="text-primary-foreground w-8 h-8" />
          </div>
          <CardTitle className="text-3xl font-headline font-bold text-primary">DarthBarber</CardTitle>
          <CardDescription>Crie sua conta ou acesse para fazer seu agendamento.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/50 p-1">
              <TabsTrigger value="login">ENTRAR</TabsTrigger>
              <TabsTrigger value="signup">CADASTRAR</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="email" 
                      type="email" 
                      autoComplete="email" 
                      placeholder="seu@email.com" 
                      className="pl-10" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="password" 
                      type="password" 
                      autoComplete="current-password" 
                      placeholder="••••••••" 
                      className="pl-10" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required 
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full h-12 text-lg font-headline" disabled={isLoading || isGoogleLoading}>
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Acessar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome Completo</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="signup-name" 
                      autoComplete="name" 
                      placeholder="Seu nome" 
                      className="pl-10" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="signup-email" 
                      type="email" 
                      autoComplete="email" 
                      placeholder="seu@email.com" 
                      className="pl-10" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="signup-password" 
                      type="password" 
                      autoComplete="new-password" 
                      placeholder="Mínimo 6 caracteres" 
                      className="pl-10" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 text-lg font-headline mt-6" disabled={isLoading || isGoogleLoading}>
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Cadastrar"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Ou continue com</span>
            </div>
          </div>

          <Button 
            type="button" 
            variant="outline" 
            className="w-full h-12 text-base font-medium border-primary/20 hover:bg-muted"
            onClick={handleGoogleLogin}
            disabled={isLoading || isGoogleLoading}
          >
            {isGoogleLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Conectando...
              </span>
            ) : (
              <>
                <GoogleIcon />
                Entrar com o Google
              </>
            )}
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}