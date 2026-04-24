import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  Timestamp, 
  orderBy 
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Appointment {
  id?: string;
  clientId: string;
  clientName: string;
  barberId: string;
  dataHora: Timestamp | Date;
  status: 'pendente' | 'confirmado' | 'cancelado';
}

export const appointmentService = {
  async saveAppointment(appointment: Omit<Appointment, 'id'>) {
    try {
      const docRef = await addDoc(collection(db, "appointments"), {
        ...appointment,
        dataHora: appointment.dataHora instanceof Date ? Timestamp.fromDate(appointment.dataHora) : appointment.dataHora,
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error saving appointment:", error);
      throw error;
    }
  },

  subscribeToBarberAppointments(barberId: string, date: Date, callback: (appointments: Appointment[]) => void) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const q = query(
      collection(db, "appointments"),
      where("barberId", "==", barberId),
      where("dataHora", ">=", Timestamp.fromDate(startOfDay)),
      where("dataHora", "<=", Timestamp.fromDate(endOfDay)),
      orderBy("dataHora", "asc")
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
