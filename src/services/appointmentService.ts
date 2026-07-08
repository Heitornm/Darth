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
}

export const appointmentService = {
  async createAppointment(appointment: Omit<Appointment, 'id' | 'status'>): Promise<string> {
    const docRef = await addDoc(collection(db, "appointments"), {
      ...appointment,
      status: 'pendente',
    });
    return docRef.id;
  },

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