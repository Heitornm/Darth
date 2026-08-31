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

// ✅ FUNÇÃO CHAVE: Converte Timestamp do Firestore de forma SEGURA
function safeConvertTimestamps<T>(obj: any): T {
  if (!obj || typeof obj !== 'object') return obj;

  const result: any = { ...obj };

  for (const key of Object.keys(result)) {
    const value = result[key];

    // 🔹 Se for Timestamp do Firestore → converte com VALIDAÇÃO
    if (value instanceof Timestamp) {
      try {
        const date = value.toDate();
        if (!isNaN(date.getTime())) {
          result[key] = date; // ✅ Válida → converte
        } else {
          console.warn(`⚠️ Timestamp inválido no campo "${key}":`, value);
          result[key] = null; // ❌ Inválida → define como null
        }
      } catch {
        console.warn(`⚠️ Falha ao converter campo "${key}":`, value);
        result[key] = null;
      }
    }
    // 🔹 Se vier como objeto { seconds, nanoseconds }
    else if (value && typeof value === 'object' && 'seconds' in value) {
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
    // 🔹 Se vier como string → valida
    else if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        result[key] = date;
      }
    }
  }

  return result as T;
}


/**
 * Hook para assinar uma coleção ou query do Firestore em tempo real.
 * ✅ Com conversão SEGURA de Timestamps — NUNCA mais quebra com Invalid Time Value
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
        // ✅ AQUI ESTÁ A CORREÇÃO: Converte TODOS os campos de forma segura
        const results = snapshot.docs.map((doc) => {
          const rawData = doc.data() as T;
          return {
            ...safeConvertTimestamps<T>(rawData), // 🔑 Validação AQUI
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