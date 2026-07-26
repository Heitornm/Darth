"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "/client/appointments/new";
    } catch (error: any) {
      if (error.code === "auth/invalid-credential" || error.code === "auth/user-not-found") {
        setErrorMessage("E-mail ou senha incorretos. Verifique suas credenciais.");
      } else {
        setErrorMessage("Ocorreu um erro ao realizar o login. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-6 border rounded-lg shadow-sm">
      <h2 className="text-xl font-bold mb-4">Entrar na Conta</h2>
      
      {errorMessage && (
        <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">E-mail</label>
          <Input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            required 
            autoComplete="username"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Senha</label>
          <Input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            required 
            autoComplete="current-password"
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </div>
  );
}