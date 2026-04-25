'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export type WithId<T> = T & { id: string };

export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

export interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    }
  }
}

/**
 * Hook para assinar uma coleção ou query do Firestore em tempo real.
 * IMPORTANTE: O parâmetro 'target' DEVE ser memoizado para evitar loops infinitos.
 */
export function useCollection<T = any>(
  target: ((CollectionReference<DocumentData> | Query<DocumentData>) & { __memo?: boolean }) | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;

  const [data, setData] = useState<ResultItemType[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!target); // Inicia true se houver um target
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    // Se não houver target, reseta o estado e retorna
    if (!target) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      target,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results = snapshot.docs.map((doc) => ({
          ...(doc.data() as T),
          id: doc.id,
        }));
        
        setData(results);
        setIsLoading(false);
        setError(null);
      },
      (err: FirestoreError) => {
        console.error("Firestore Hook Error:", err);

        // Extração segura do path para o erro contextual
        const path: string =
          target.type === 'collection'
            ? (target as CollectionReference).path
            : (target as unknown as InternalQuery)._query.path.canonicalString();

        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path,
        });

        setError(contextualError);
        setData(null);
        setIsLoading(false);

        // Emite o erro para o sistema global de notificações
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();
  }, [target]);

  // Validação de segurança para garantir o uso de useMemo
  if (target && !target.__memo) {
    throw new Error(
      'O parâmetro de useCollection não foi memoizado corretamente. Utilize useMemo ou um hook de memoização do Firebase.'
    );
  }

  return { data, isLoading, error };
}