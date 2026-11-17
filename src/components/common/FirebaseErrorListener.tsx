'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { toast } from '@/hooks/use-toast';

/**
 * Componente invisível que escuta erros globais de permissão do Firestore.
 * Antes ele lançava o erro e derrubava a tela inteira; agora registra no console
 * e mostra um aviso discreto, sem expor dados do usuário na interface.
 */
export function FirebaseErrorListener() {
  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // Sem usuário logado (ex.: durante o logout) não é um erro real de permissão.
      if (!error.request.auth) return;

      console.error(
        '[Firestore] permissão negada:',
        error.request.method,
        error.request.path
      );

      toast({
        variant: 'destructive',
        title: 'Acesso negado',
        description: 'Você não tem permissão para realizar esta ação.',
      });
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  return null;
}