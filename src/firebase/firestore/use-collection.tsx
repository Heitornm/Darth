
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
  _query?: {
    path: {
      canonicalString(): string;
      toString(): string;
    }
  };
  path?: string;
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
  const [isLoading, setIsLoading] = useState<boolean>(!!target);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
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
        // Extração segura do path para o erro contextual
        let path = 'unknown';
        if ('path' in target && typeof target.path === 'string') {
          path = target.path;
        } else {
          const internal = target as InternalQuery;
          if (internal._query?.path) {
            path = internal._query.path.canonicalString();
          }
        }

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

  if (target && !target.__memo) {
    throw new Error(
      'O parâmetro de useCollection não foi memoizado corretamente. Utilize useMemoFirebase.'
    );
  }

  return { data, isLoading, error };
}
