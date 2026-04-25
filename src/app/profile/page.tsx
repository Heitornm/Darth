"use client";

import { useState, useEffect } from 'react';
import { useUser, useAuth, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { updateProfile, updateEmail, updatePassword } from 'firebase/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Phone, Lock, Save, Loader2, UserCircle, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    async function fetchUserProfile() {
      if (user && db) {
        setName(user.displayName || '');
        setEmail(user.email || '');
        
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setPhone(userDoc.data().phone || '');
          }
        } catch (e) {
          console.error("Erro ao buscar dados adicionais:", e);
        } finally {
          setFetching(false);
        }
      }
    }
    fetchUserProfile();
  }, [user, db]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // 1. Update Auth Display Name
      if (name !== user.displayName) {
        await updateProfile(user, { displayName: name });
      }

      // 2. Update Auth Email
      if (email !== user.email) {
        try {
          await updateEmail(user, email);
        } catch (e: any) {
          toast({
            variant: "destructive",
            title: "Reautenticação Necessária",
            description: "Para alterar o email, saia e entre novamente na conta."
          });
        }
      }

      // 3. Update Password
      if (password) {
        if (password.length < 6) {
          throw new Error("A senha deve ter pelo menos 6 caracteres.");
        }
        try {
          await updatePassword(user, password);
          setPassword('');
        } catch (e: any) {
          toast({
            variant: "destructive",
            title: "Erro de Segurança",
            description: "A alteração de senha exige um login recente. Saia e entre novamente."
          });
        }
      }

      // 4. Update Firestore Profile
      updateDocumentNonBlocking(doc(db, 'users', user.uid), {
        name,
        email,
        phone,
        updatedAt: new Date().toISOString()
      });

      toast({
        title: "Perfil Atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao Atualizar",
        description: error.message || "Ocorreu um problema ao salvar seu perfil."
      });
    } finally {
      setLoading(false);
    }
  };

  if (isUserLoading || fetching) return <div className="p-20 text-center animate-pulse text-primary font-headline">Carregando seus dados...</div>;

  if (!user) return <div className="p-20 text-center">Acesso restrito. Faça login para editar seu perfil.</div>;

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <Card className="border-primary/20 bg-card/40 backdrop-blur-md shadow-2xl">
        <CardHeader className="text-center pb-8 border-b border-border/50">
          <div className="mx-auto bg-primary/20 w-20 h-20 rounded-2xl flex items-center justify-center mb-4 border border-primary/20">
            <UserCircle className="text-primary w-10 h-10" />
          </div>
          <CardTitle className="text-3xl font-headline font-bold text-primary">Editar Perfil</CardTitle>
          <CardDescription>Mantenha seus dados atualizados para uma melhor experiência.</CardDescription>
        </CardHeader>
        <form onSubmit={handleUpdateProfile}>
          <CardContent className="space-y-6 pt-8">
            <div className="grid gap-6">
              <div className="space-y-2">
                <Label htmlFor="profile-name" className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-primary/60" />
                  <Input 
                    id="profile-name" 
                    className="pl-10 bg-background/50" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="profile-email" className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Email de Acesso</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-primary/60" />
                    <Input 
                      id="profile-email" 
                      type="email" 
                      className="pl-10 bg-background/50" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-phone" className="text-xs uppercase font-bold tracking-widest text-muted-foreground">WhatsApp / Celular</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-primary/60" />
                    <Input 
                      id="profile-phone" 
                      placeholder="(00) 00000-0000"
                      className="pl-10 bg-background/50" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-border/50">
                <Label htmlFor="profile-password" className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Alterar Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-primary/60" />
                  <Input 
                    id="profile-password" 
                    type={showPassword ? "text" : "password"} 
                    className="pl-10 pr-10 bg-background/50" 
                    placeholder="Mínimo 6 caracteres"
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground italic">Deixe em branco se não desejar alterar sua senha atual.</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-6">
            <Button type="submit" className="w-full h-14 gap-2 text-lg font-headline rounded-xl" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}