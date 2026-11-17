'use client';

import {
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  CollectionReference,
  DocumentReference,
  SetOptions,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import {
  FirestorePermissionError,
  isPermissionDenied,
  type SecurityRuleContext,
} from '@/firebase/errors';

/**
 * Só erros "permission-denied" viram evento global de permissão.
 * Qualquer outra falha (rede, validação, quota) é registrada no console.
 */
function reportWriteError(error: unknown, context: SecurityRuleContext): void {
  if (isPermissionDenied(error)) {
    errorEmitter.emit('permission-error', new FirestorePermissionError(context));
    return;
  }
  console.error(`[Firestore] falha em "${context.operation}" (${context.path}):`, error);
}

/**
 * Initiates a setDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function setDocumentNonBlocking(docRef: DocumentReference, data: any, options: SetOptions) {
  setDoc(docRef, data, options).catch((error) => {
    reportWriteError(error, {
      path: docRef.path,
      operation: 'write',
      requestResourceData: data,
    });
  });
  // Execution continues immediately
}

/**
 * Initiates an addDoc operation for a collection reference.
 * Does NOT await the write operation internally.
 * Returns the Promise for the new doc ref, but typically not awaited by caller.
 */
export function addDocumentNonBlocking(colRef: CollectionReference, data: any) {
  const promise = addDoc(colRef, data).catch((error) => {
    reportWriteError(error, {
      path: colRef.path,
      operation: 'create',
      requestResourceData: data,
    });
  });
  return promise;
}

/**
 * Initiates an updateDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function updateDocumentNonBlocking(docRef: DocumentReference, data: any) {
  updateDoc(docRef, data).catch((error) => {
    reportWriteError(error, {
      path: docRef.path,
      operation: 'update',
      requestResourceData: data,
    });
  });
}

/**
 * Initiates a deleteDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function deleteDocumentNonBlocking(docRef: DocumentReference) {
  deleteDoc(docRef).catch((error) => {
    reportWriteError(error, {
      path: docRef.path,
      operation: 'delete',
    });
  });
}