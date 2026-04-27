
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
      async (err: FirestoreError) => {
        let path = 'collection';
        try {
          if ((target as any).path) {
            path = (target as any).path;
          } else if ((target as any)._query?.path) {
            const queryPath = (target as any)._query.path;
            path = typeof queryPath.canonicalString === 'function' 
              ? queryPath.canonicalString() 
              : queryPath.toString();
          }
        } catch (e) {
          path = 'appointments';
        }

        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path: path.replace(/^\/databases\/\(default\)\/documents\//, ''),
        });

        setError(contextualError);
        setData(null);
        setIsLoading(false);

        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();
  }, [target]);

  return { data, isLoading, error };
}
