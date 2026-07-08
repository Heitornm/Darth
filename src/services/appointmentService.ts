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
  clientEmail?: string | null;
  barberId: string;
  serviceId: string;
  serviceName?: string;
  durationMinutes?: number;
  price: number;
  dataHora: Timestamp | Date;
  status: 'pendente' | 'confirmado' | 'cancelado';
  createdAt?: Timestamp; // Guardará o momento exato da intenção de compra
}

export const appointmentService = {
  async createAppointment(appointment: Omit<Appointment, 'id' | 'status' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, "appointments"), {
      ...appointment,
      status: 'pendente',
      createdAt: Timestamp.now(), // Marca o início dos 10 minutos regulamentares
    });
    return docRef.id;
  },

  // Escuta os agendamentos do cliente (Usado no Painel do Cliente)
  subscribeToClientAppointments(clientId: string, callback: (appointments: Appointment[]) => void) {
    // IMPORTANTE: Se o console disparar erro de índice, clique no link gerado no terminal para criá-lo
    const q = query(
      collection(db, "appointments"),
      where("clientId", "==", clientId),
      orderBy("dataHora", "desc")
    );

    return onSnapshot(q, (snapshot) => {
      const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
      
      const appointments = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data
        } as Appointment;
      }).filter(apt => {
        // Regra do Filtro: Se estiver pendente e passou de 10 minutos, considera expirado/invisível
        if (apt.status === 'pendente' && apt.createdAt) {
          const creationTime = (apt.createdAt as Timestamp).toDate().getTime();
          if (creationTime < tenMinutesAgo) return false; 
        }
        return true;
      });

      callback(appointments);
    });
  }
};