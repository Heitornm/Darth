import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'client' | 'barber' | 'admin';
  phone?: string;
  avatarUrl?: string;
}

export const userService = {
  /**
   * Obtém os dados de perfil de um usuário a partir do Firestore do cliente
   */
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { uid, ...docSnap.data() } as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar perfil de usuário:', error);
      throw error;
    }
  },

  /**
   * Atualiza dados cadastrais parciais do perfil do cliente/barbeiro
   */
  async updateProfile(uid: string, data: Partial<Omit<UserProfile, 'uid' | 'role'>>): Promise<void> {
    try {
      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, data);
    } catch (error) {
      console.error('Erro ao atualizar perfil do usuário:', error);
      throw error;
    }
  }
};