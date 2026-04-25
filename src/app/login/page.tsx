
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Scissors, Mail, Lock, User as UserIcon, UserCircle, Briefcase, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'client' | 'barber'>('client');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Bem-vindo de volta!",
        description: "Acesso realizado com sucesso.",
      });
      router.push('/');
    } catch (error: any) {
      let message = "Ocorreu um erro ao tentar entrar.";
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        message = "E-mail ou senha incorretos. Verifique seus dados e tente novamente.";
      }
      
      toast({
        variant: "destructive",
        title: "Falha no Acesso",
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) return;
    
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      // Atualiza o perfil no Auth
      await updateProfile(newUser, { displayName: name });

      // Salva os dados no Firestore
      if (db) {
        await setDoc(doc(db, 'users', newUser.uid), {
          id: newUser.uid,
          name: name,
          email: email,
          role: role,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }

      toast({
        title: "Conta criada!",
        description: `Bem-vindo à DarthBarber, ${name}.`,
      });
      
      router.push('/');
    } catch (error: any) {
      let message = "Não foi possível criar sua conta agora.";
      if (error.code === 'auth/email-already-in-use') {
        message = "Este e-mail já está em uso por outra conta.";
      } else if (error.code === 'auth/weak-password') {
        message = "A senha é muito fraca. Tente uma senha com pelo menos 6 caracteres.";
      }

      toast({
        variant: "destructive",
        title: "Erro no Cadastro",
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
      
      <Card className="w-full max-w-md border-primary/20 bg-card/60 backdrop-blur-xl shadow-2xl relative z-10">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
            <Scissors className="text-primary-foreground w-8 h-8" />
          </div>
          <CardTitle className="text-3xl font-headline font-bold">DarthBarber</CardTitle>
          <CardDescription>O lado negro da força nunca esteve tão bem alinhado.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/50 p-1">
              <TabsTrigger value="login" className="text-xs font-bold uppercase tracking-wider">ENTRAR</TabsTrigger>
              <TabsTrigger value="signup" className="text-xs font-bold uppercase tracking-wider">CADASTRAR</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="seu@email.com"
                      className="pl-10 bg-background/50 border-primary/10 focus-visible:ring-primary" 
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
                      placeholder="••••••••"
                      className="pl-10 bg-background/50 border-primary/10 focus-visible:ring-primary" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required 
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full h-12 text-lg font-headline gap-2" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Acessar Agenda"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome Completo</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="signup-name" 
                      placeholder="Como quer ser chamado?"
                      className="pl-10 bg-background/50 border-primary/10" 
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
                      placeholder="seu@email.com"
                      className="pl-10 bg-background/50 border-primary/10" 
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
                      placeholder="Mínimo 6 caracteres"
                      className="pl-10 bg-background/50 border-primary/10" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <Label className="text-xs uppercase font-bold text-muted-foreground tracking-widest">Eu sou um...</Label>
                  <RadioGroup 
                    value={role} 
                    onValueChange={(v) => setRole(v as any)}
                    className="flex gap-4"
                  >
                    <div className="flex-1">
                      <Label
                        htmlFor="role-client"
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          role === 'client' ? 'border-primary bg-primary/10' : 'border-muted hover:border-muted-foreground/30'
                        }`}
                      >
                        <RadioGroupItem value="client" id="role-client" className="sr-only" />
                        <UserCircle className={`w-5 h-5 ${role === 'client' ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="font-bold text-sm">Cliente</span>
                      </Label>
                    </div>
                    <div className="flex-1">
                      <Label
                        htmlFor="role-barber"
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          role === 'barber' ? 'border-accent bg-accent/10' : 'border-muted hover:border-muted-foreground/30'
                        }`}
                      >
                        <RadioGroupItem value="barber" id="role-barber" className="sr-only" />
                        <Briefcase className={`w-5 h-5 ${role === 'barber' ? 'text-accent' : 'text-muted-foreground'}`} />
                        <span className="font-bold text-sm">Barbeiro</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Button type="submit" className="w-full h-12 text-lg font-headline mt-4 gap-2" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Criar Minha Conta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
