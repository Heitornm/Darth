
"use client";

import { useState, useEffect } from 'react';
import { useUser, useAuth, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { updateProfile, updateEmail, updatePassword } from 'firebase/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Phone, Lock, Save, Loader2, CheckCircle2 } from 'lucide-react';
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
          console.error("Error fetching extra profile data:", e);
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

      // 2. Update Auth Email (requires recent login)
      if (email !== user.email) {
        try {
          await updateEmail(user, email);
        } catch (e: any) {
          toast({
            variant: "destructive",
            title: "Erro ao alterar email",
            description: "Para alterar o email, você precisa ter feito login recentemente. Tente sair e entrar novamente."
          });
        }
      }

      // 3. Update Password (if filled)
      if (password) {
        try {
          await updatePassword(user, password);
          setPassword(''); // clear password field
        } catch (e: any) {
          toast({
            variant: "destructive",
            title: "Erro ao alterar senha",
            description: "A senha deve ter no mínimo 6 caracteres e você deve ter feito login recentemente."
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
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: error.message || "Ocorreu um problema ao salvar seu perfil."
      });
    } finally {
      setLoading(false);
    }
  };

  if (isUserLoading || fetching) return <div className="p-20 text-center animate-pulse">Carregando perfil...</div>;

  if (!user) return <div className="p-20 text-center">Faça login para ver esta página.</div>;

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/20 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <User className="text-primary w-8 h-8" />
          </div>
          <CardTitle className="text-3xl font-headline font-bold">Meu Perfil</CardTitle>
          <CardDescription>Mantenha seus dados atualizados para facilitar seus agendamentos.</CardDescription>
        </CardHeader>
        <form onSubmit={handleUpdateProfile}>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="profile-name" 
                    className="pl-10" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="profile-email" 
                    type="email" 
                    className="pl-10" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">Alteração de email pode exigir novo login por segurança.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-phone">Telefone / WhatsApp</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="profile-phone" 
                    placeholder="(00) 00000-0000"
                    className="pl-10" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                  />
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-border/50">
                <Label htmlFor="profile-password">Nova Senha (deixe em branco para não alterar)</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="profile-password" 
                    type="password" 
                    className="pl-10" 
                    placeholder="Mínimo 6 caracteres"
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full h-12 gap-2" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando alterações...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar Perfil
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
