'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
  Timestamp,
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
 * Função de apoio para converter objetos Timestamp do Firestore em instâncias de Date nativas.
 * Mantém as strings (como "YYYY-MM-DD" e "HH:mm") intactas para preservação de formato nas telas.
 */
function safeConvertTimestamps<T>(obj: any): T {
  if (!obj || typeof obj !== 'object') return obj;

  const result: any = { ...obj };

  for (const key of Object.keys(result)) {
    const value = result[key];

    // 1. Se for uma instância oficial de Timestamp do Firestore
    if (value instanceof Timestamp) {
      try {
        const date = value.toDate();
        if (!isNaN(date.getTime())) {
          result[key] = date;
        } else {
          console.warn(`⚠️ Timestamp inválido no campo "${key}":`, value);
          result[key] = null;
        }
      } catch {
        console.warn(`⚠️ Falha ao converter campo "${key}":`, value);
        result[key] = null;
      }
    }
    // 2. Se for um objeto puro com a estrutura { seconds, nanoseconds }
    else if (value && typeof value === 'object' && 'seconds' in value && typeof value.seconds === 'number') {
      try {
        const date = new Date(value.seconds * 1000);
        if (!isNaN(date.getTime())) {
          result[key] = date;
        } else {
          console.warn(`⚠️ Data inválida no campo "${key}":`, value);
          result[key] = null;
        }
      } catch {
        result[key] = null;
      }
    }
    // Strings como "2026-11-09" permanecem como string para não quebrar a formatação da UI
  }

  return result as T;
}

/**
 * Hook customizado para assinar uma coleção ou query do Firestore em tempo real.
 * Inclui tratamento seguro de Timestamps e emissão de erros de permissão.
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
        // Converte os dados salvaguardando a estrutura original dos documentos
        const results = snapshot.docs.map((doc) => {
          const rawData = doc.data() as T;
          return {
            ...safeConvertTimestamps<T>(rawData),
            id: doc.id,
          };
        });

        setData(results);
        setIsLoading(false);
        setError(null);
      },
      async (_err: FirestoreError) => {
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
        } catch (_e) {
          path = 'firestore-collection';
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