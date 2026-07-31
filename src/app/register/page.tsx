"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  updateProfile 
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/firebase/firebase";
import { useUser } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const router = useRouter();
  const { user, userProfile, isLoading } = useUser();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirecionamento automático caso o usuário já esteja logado
  useEffect(() => {
    if (isLoading) return;

    if (user) {
      const isMaster = user.email === "heitornmartins@gmail.com" || userProfile?.role === "barber";
      if (isMaster) {
        router.push("/barber/dashboard");
      } else {
        router.push("/client/appointments/new");
      }
    }
  }, [user, userProfile, isLoading, router]);

  // CADASTRO VIA E-MAIL E SENHA
  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      // 1. Cria a conta no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      // 2. Atualiza o nome no Auth profile
      await updateProfile(newUser, { displayName: name });

      // 3. Salva o documento no Firestore
      const isMaster = email === "heitornmartins@gmail.com";
      await setDoc(doc(db, "users", newUser.uid), {
        uid: newUser.uid,
        name: name,
        email: email,
        role: isMaster ? "barber" : "client",
        createdAt: serverTimestamp(),
      });

    } catch (error: any) {
      console.error("Erro no cadastro:", error);
      if (error.code === "auth/email-already-in-use") {
        setErrorMessage("Este e-mail já está em uso. Tente fazer login.");
      } else if (error.code === "auth/weak-password") {
        setErrorMessage("A senha deve ter pelo menos 6 caracteres.");
      } else {
        setErrorMessage("Erro ao criar conta. Tente novamente.");
      }
      setLoading(false);
    }
  };

  // CADASTRO / LOGIN VIA GOOGLE
  const handleGoogleRegister = async () => {
    setErrorMessage("");
    setLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;

      // Verifica se o usuário já possui cadastro
      const userRef = doc(db, "users", googleUser.uid);
      const userSnap = await getDoc(userRef);

      // Se não existir, registra no Firestore
      if (!userSnap.exists()) {
        const isMaster = googleUser.email === "heitornmartins@gmail.com";
        await setDoc(userRef, {
          uid: googleUser.uid,
          name: googleUser.displayName || "Cliente",
          email: googleUser.email,
          role: isMaster ? "barber" : "client",
          createdAt: serverTimestamp(),
          photoURL: googleUser.photoURL || null,
        });
      }
    } catch (error: any) {
      console.error("Erro no cadastro Google:", error);
      setErrorMessage("Falha ao registrar com o Google. Tente novamente.");
      setLoading(false);
    }
  };

  if (isLoading || (user && loading)) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <p className="text-sm text-muted-foreground animate-pulse">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto my-12 p-6 border rounded-lg shadow-sm space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-center">Criar uma Conta</h2>
        <p className="text-sm text-center text-muted-foreground mt-1">
          Cadastre-se para agendar seus horários na barbearia
        </p>
      </div>

      {errorMessage && (
        <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleEmailRegister} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nome Completo</label>
          <Input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            required 
            placeholder="Seu nome"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">E-mail</label>
          <Input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            required 
            autoComplete="username"
            placeholder="seu@email.com"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Senha</label>
          <Input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            required 
            autoComplete="new-password"
            placeholder="••••••••"
            disabled={loading}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Criando conta..." : "Criar Conta com E-mail"}
        </Button>
      </form>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Ou cadastre-se com</span>
        </div>
      </div>

      <Button 
        type="button" 
        variant="outline" 
        className="w-full flex items-center justify-center gap-2"
        onClick={handleGoogleRegister}
        disabled={loading}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        Cadastrar com Google
      </Button>

      <p className="text-center text-sm text-muted-foreground pt-2">
        Já tem uma conta?{" "}
        <Link href="/login" className="text-primary underline font-medium">
          Entrar aqui
        </Link>
      </p>
    </div>
  );
}