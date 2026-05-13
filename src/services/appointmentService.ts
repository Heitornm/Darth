import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  Timestamp, 
  orderBy,
  addDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Appointment {
  id?: string;
  clientId: string;
  clientName: string;
  barberId: string;
  serviceName?: string; // Adicionado para bater com seu componente
  durationMinutes?: number; // Adicionado para bater com seu componente
  dataHora: Timestamp | Date;
  status: 'pendente' | 'confirmado' | 'cancelado';
}

export const appointmentService = {
  // ... outras funções (saveAppointment, etc)

  // Esta função garante que a query seja filtrada no servidor do Firebase
  subscribeToClientAppointments(clientId: string, callback: (appointments: Appointment[]) => void) {
    const q = query(
      collection(db, "appointments"),
      where("clientId", "==", clientId),
      orderBy("dataHora", "desc")
    );

    return onSnapshot(q, (snapshot) => {
      const appointments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Appointment[];
      callback(appointments);
    });
  }
};