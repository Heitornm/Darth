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
import { FirestorePermissionError, isPermissionDenied } from '@/firebase/errors';

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
    };
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

/** Descobre o caminho da coleção/query para mensagens de erro. */
function resolveTargetPath(target: unknown): string {
  try {
    const t = target as InternalQuery;
    let path = 'collection';
    if (typeof t.path === 'string') {
      path = t.path;
    } else if (t._query?.path) {
      path =
        typeof t._query.path.canonicalString === 'function'
          ? t._query.path.canonicalString()
          : t._query.path.toString();
    }
    return path.replace(/^\/databases\/\(default\)\/documents\//, '');
  } catch {
    return 'firestore-collection';
  }
}

/**
 * Hook customizado para assinar uma coleção ou query do Firestore em tempo real.
 * IMPORTANTE: a query recebida precisa estar memoizada (useMemoFirebase).
 * Só erros "permission-denied" viram evento global; os demais ficam em `error`.
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
      return undefined;
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
      (err: FirestoreError) => {
        setData(null);
        setIsLoading(false);

        if (isPermissionDenied(err)) {
          const contextualError = new FirestorePermissionError({
            operation: 'list',
            path: resolveTargetPath(target),
          });
          setError(contextualError);
          errorEmitter.emit('permission-error', contextualError);
          return;
        }

        console.error('[useCollection] erro ao ler a coleção:', err);
        setError(err);
      }
    );

    return () => unsubscribe();
  }, [target]);

  return { data, isLoading, error };
}