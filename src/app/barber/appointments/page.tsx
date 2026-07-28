'use client';

import { useState, useEffect } from 'react';
import { db } from '@/firebase/config';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';

interface Appointment {
  id: string;
  userName?: string;
  userEmail?: string;
  serviceName: string;
  date: string;
  time: string;
  price: number;
  status: 'pendente' | 'confirmado' | 'solicitado_cancelamento' | 'concluido' | 'cancelado';
  previousStatus?: string;
}

export default function BarberAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const appointmentsRef = collection(db, 'appointments');

    const unsubscribe = onSnapshot(appointmentsRef, (snapshot) => {
      const list: Appointment[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Appointment[];

      // Ordena pelos mais recentes
      list.sort((a, b) => new Date(`${b.date}T${b.time || '00:00'}`).getTime() - new Date(`${a.date}T${a.time || '00:00'}`).getTime());
      setAppointments(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Barbeiro/Admin confirma o cancelamento definitivo
  const handleApproveCancellation = async (appointmentId: string) => {
    try {
      const docRef = doc(db, 'appointments', appointmentId);
      await updateDoc(docRef, {
        status: 'cancelado',
        cancelledBy: 'barber_admin',
        cancelledAt: new Date(),
      });
      alert('Cancelamento confirmado.');
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
      alert('Erro ao atualizar status.');
    }
  };

  // Barbeiro/Admin recusa a solicitação de cancelamento
  const handleRejectCancellation = async (appointmentId: string) => {
    try {
      const docRef = doc(db, 'appointments', appointmentId);
      // Retorna para o status de confirmado (ou pendente)
      await updateDoc(docRef, {
        status: 'confirmado',
      });
      alert('Solicitação de cancelamento recusada. Agendamento mantido.');
    } catch (error) {
      console.error('Erro ao recusar cancelamento:', error);
    }
  };

  if (loading) {
    return <p className="p-8 text-zinc-400">Carregando painel do barbeiro...</p>;
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-amber-500 mb-6">Painel do Barbeiro - Agendamentos</h1>

      <div className="space-y-4">
        {appointments.map((app) => (
          <div
            key={app.id}
            className={`p-5 rounded-xl border ${
              app.status === 'solicitado_cancelamento'
                ? 'bg-amber-950/20 border-amber-500/50'
                : 'bg-zinc-900 border-zinc-800'
            }`}
          >
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-lg">{app.serviceName}</h3>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300">
                    {app.status}
                  </span>
                </div>
                <p className="text-sm text-zinc-400 mt-1">
                  Cliente: <strong className="text-zinc-200">{app.userName || app.userEmail || 'Não informado'}</strong>
                </p>
                <p className="text-sm text-zinc-400">
                  Data: {app.date} às {app.time} — R$ {Number(app.price).toFixed(2)}
                </p>
              </div>

              {/* Ações exclusivas para solicitações de cancelamento */}
              {app.status === 'solicitado_cancelamento' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApproveCancellation(app.id)}
                    className="bg-red-600 hover:bg-red-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition"
                  >
                    Confirmar Cancelamento
                  </button>
                  <button
                    onClick={() => handleRejectCancellation(app.id)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold px-3 py-1.5 rounded-lg text-xs transition"
                  >
                    Manter Agendamento
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}