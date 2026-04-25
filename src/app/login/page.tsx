
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, useFirestore, initiateEmailSignIn, initiateEmailSignUp, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Scissors, Mail, Lock, User as UserIcon, UserCircle, Briefcase } from 'lucide-react';
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
  const [isSigningUp, setIsSigningUp] = useState(false);

  // Monitora o estado de autenticação para completar o cadastro no Firestore
  useEffect(() => {
    if (user && isSigningUp && db) {
      setDocumentNonBlocking(doc(db, 'users', user.uid), {
        id: user.uid,
        name: name,
        email: user.email,
        role: role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      
      toast({
        title: "Conta criada!",
        description: `Bem-vindo à DarthBarber, ${name}.`,
      });
      
      setIsSigningUp(false);
      router.push('/');
    }
  }, [user, isSigningUp, db, name, role, router, toast]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    initiateEmailSignIn(auth, email, password);
    // O redirecionamento acontece via Navbar/Layout quando o estado muda
    setTimeout(() => router.push('/'), 1000);
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setIsSigningUp(true);
    initiateEmailSignUp(auth, email, password);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md border-primary/20 bg-card/50 backdrop-blur-sm shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
            <Scissors className="text-primary-foreground w-8 h-8" />
          </div>
          <CardTitle className="text-3xl font-headline font-bold">DarthBarber</CardTitle>
          <CardDescription>Acesse sua conta ou junte-se ao lado negro da força (com estilo).</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login" className="text-sm font-bold">ENTRAR</TabsTrigger>
              <TabsTrigger value="signup" className="text-sm font-bold">CADASTRAR</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="email" 
                      type="email" 
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
                      placeholder="••••••••"
                      className="pl-10" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required 
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full h-12 text-lg font-headline" disabled={isLoading}>
                  {isLoading ? "Acessando..." : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome Completo</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="signup-name" 
                      placeholder="Como quer ser chamado?"
                      className="pl-10" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="signup-email" 
                      type="email" 
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
                      placeholder="Mínimo 6 caracteres"
                      className="pl-10" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <Label>Eu sou um...</Label>
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

                <Button type="submit" className="w-full h-12 text-lg font-headline mt-4" disabled={isLoading}>
                  {isLoading ? "Criando Conta..." : "Criar Conta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
