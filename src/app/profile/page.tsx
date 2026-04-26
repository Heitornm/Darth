
"use client";

import { useState, useEffect } from 'react';
import { useUser, useAuth, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { updateProfile, updateEmail, updatePassword } from 'firebase/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Phone, Lock, Save, Loader2, UserCircle } from 'lucide-react';
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
            const userData = userDoc.data();
            setPhone(userData.phone || '');
            // Se o nome no Firestore for diferente do Auth, podemos optar por um ou outro. 
            // Aqui garantimos que o Firestore reflita o que o usuário quer.
            if (userData.name && !user.displayName) setName(userData.name);
          }
        } catch (e) {
          console.error("Erro ao buscar dados do perfil:", e);
        } finally {
          setFetching(false);
        }
      }
    }
    fetchUserProfile();
  }, [user, db]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;

    setLoading(true);
    try {
      // 1. Atualiza Perfil de Autenticação (Nome)
      if (name !== user.displayName) {
        await updateProfile(user, { displayName: name });
      }

      // 2. Atualiza Email (se alterado)
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

      // 3. Atualiza Senha (se preenchida)
      if (password) {
        await updatePassword(user, password);
        setPassword('');
      }

      // 4. Atualiza Firestore (Nome, Email, Telefone)
      // Usamos setDocumentNonBlocking com merge: true para garantir que o doc exista
      setDocumentNonBlocking(
        doc(db, 'users', user.uid), 
        {
          name,
          email,
          phone,
          updatedAt: Timestamp.now()
        }, 
        { merge: true }
      );

      toast({
        title: "Sucesso!",
        description: "Perfil atualizado com sucesso.",
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

  if (isUserLoading || fetching) return <div className="p-20 text-center animate-pulse text-primary font-headline">Carregando dados...</div>;

  if (!user) return <div className="p-20 text-center">Faça login para editar seu perfil.</div>;

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <Card className="border-primary/20 bg-card/40 backdrop-blur-md">
        <CardHeader className="text-center pb-8 border-b border-border/50">
          <div className="mx-auto bg-primary/20 w-20 h-20 rounded-full flex items-center justify-center mb-4 border border-primary/20">
            <UserCircle className="text-primary w-12 h-12" />
          </div>
          <CardTitle className="text-3xl font-headline font-bold text-primary">Editar Perfil</CardTitle>
          <CardDescription>Gerencie suas informações pessoais e de acesso.</CardDescription>
        </CardHeader>
        <form onSubmit={handleUpdateProfile}>
          <CardContent className="space-y-6 pt-8">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Nome Completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input id="profile-name" className="pl-10" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profile-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input id="profile-email" type="email" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-phone">Telefone / WhatsApp</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input id="profile-phone" className="pl-10" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-border/50">
              <Label htmlFor="profile-password">Nova Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input id="profile-password" type="password" className="pl-10" placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <p className="text-[10px] text-muted-foreground italic">Deixe em branco para manter a senha atual.</p>
            </div>
          </CardContent>
          <CardFooter className="pt-6">
            <Button type="submit" className="w-full gap-2 h-12 text-lg font-headline" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Salvar Alterações
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
