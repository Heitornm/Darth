'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase'; // 👈 Usar useUser e useFirestore
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import Link from 'next/link';

const MASTER_BARBER_ID = 'eUCAkXknM1N0mcC04hCIfF3HcMk1';

interface Appointment {
  id: string;
  userId: string;
  serviceName: string;
  date: string;
  time: string;
  price: number;
  status: 'pendente' | 'confirmado' | 'solicitado_cancelamento' | 'concluido' | 'cancelado';
  createdAt?: Timestamp;
}

export default function MyAppointmentsPage() {
  const { user } = useUser();
  const db = useFirestore();
  
  const [activeAppointments, setActiveAppointments] = useState<Appointment[]>([]);
  const [historyAppointments, setHistoryAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    // Se ainda está carregando a sessão do usuário, aguarda
    if (user === undefined) return;
    
    if (!user || !db) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const appointmentsRef = collection(db, 'appointments');
    const q = query(appointmentsRef, where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const allList: Appointment[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Appointment[];

        allList.sort((a, b) => new Date(`${b.date}T${b.time || '00:00'}`).getTime() - new Date(`${a.date}T${a.time || '00:00'}`).getTime());

        const open = allList.filter(
          (app) => app.status === 'pendente' || app.status === 'confirmado' || app.status === 'solicitado_cancelamento'
        );

        const closed = allList.filter(
          (app) => app.status === 'concluido' || app.status === 'cancelado'
        );

        setActiveAppointments(open.slice(0, 3));
        const extraOpen = open.slice(3);
        setHistoryAppointments([...closed, ...extraOpen]);

        setLoading(false);
      },
      (error) => {
        console.error('[ERRO BUSCA AGENDAMENTOS]:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, db]);

  // Função para o cliente solicitar o cancelamento e notificar o barbeiro
  const handleRequestCancellation = async (app: Appointment) => {
    if (!db || !user) return;

    const confirmRequest = window.confirm('Deseja enviar uma solicitação de cancelamento para o barbeiro?');
    if (!confirmRequest) return;

    try {
      setCancellingId(app.id);

      // 1. Atualiza o status do agendamento
      const docRef = doc(db, 'appointments', app.id);
      await updateDoc(docRef, {
        status: 'solicitado_cancelamento',
        cancellationRequestedAt: serverTimestamp()
      });

      // 2. Cria o aviso na coleção de notificações para o barbeiro
      const formattedDate = app.date.split('-').reverse().join('/');
      await addDoc(collection(db, 'notifications'), {
        toId: MASTER_BARBER_ID,
        fromId: user.uid,
        title: '⚠️ Solicitação de Cancelamento',
        message: `${user.displayName || user.email || 'Um cliente'} solicitou o cancelamento de ${app.serviceName} (${formattedDate} às ${app.time}).`,
        type: 'cancellation_request',
        appointmentId: app.id,
        read: false,
        createdAt: serverTimestamp(),
      });

      alert('Solicitação de cancelamento enviada! Aguarde a confirmação do barbeiro.');
    } catch (error) {
      console.error('[ERRO SOLICITAR CANCELAMENTO]:', error);
      alert('Não foi possível enviar a solicitação de cancelamento.');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmado':
        return <span className="bg-green-500/10 text-green-500 border border-green-500/20 px-2.5 py-1 rounded-full text-xs font-semibold">Pago / Confirmado</span>;
      case 'pendente':
        return <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2.5 py-1 rounded-full text-xs font-semibold">Aguardando Pagamento</span>;
      case 'solicitado_cancelamento':
        return <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2.5 py-1 rounded-full text-xs font-semibold">Cancelamento Solicitado</span>;
      case 'concluido':
        return <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-full text-xs font-semibold">Concluído</span>;
      case 'cancelado':
        return <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-2.5 py-1 rounded-full text-xs font-semibold">Cancelado</span>;
      default:
        return <span className="bg-zinc-800 text-zinc-400 px-2.5 py-1 rounded-full text-xs">{status}</span>;
    }
  };

  if (user === undefined || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex justify-center items-center">
        <p className="text-zinc-400 animate-pulse">Carregando seus agendamentos...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-center items-center p-4">
        <p className="text-zinc-300 mb-4">Você precisa estar logado para ver seus agendamentos.</p>
        <Link href="/login" className="bg-amber-500 text-zinc-950 px-6 py-2.5 rounded-lg font-bold hover:bg-amber-400 transition">
          Fazer Login
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-amber-500">Meus Agendamentos</h1>
          <p className="text-sm text-zinc-400">Olá, {user.displayName || user.email}</p>
        </div>
        <Link href="/client/appointments/new" className="bg-amber-500 text-zinc-950 px-4 py-2 rounded-lg font-semibold hover:bg-amber-400 transition text-sm">
          + Novo Agendamento
        </Link>
      </div>

      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-zinc-200">Próximos Agendamentos (Em Aberto)</h2>
          <span className="text-xs text-zinc-500">{activeAppointments.length} de no máximo 3 visíveis</span>
        </div>

        {activeAppointments.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
            <p className="text-zinc-400 mb-4">Você não tem nenhum agendamento em aberto no momento.</p>
            <Link href="/client/appointments/new" className="text-amber-500 underline font-medium">
              Agendar um serviço agora
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {activeAppointments.map((app) => (
              <div key={app.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-lg text-white">{app.serviceName}</h3>
                    {getStatusBadge(app.status)}
                  </div>
                  <p className="text-sm text-zinc-400">
                    🗓️ <strong className="text-zinc-200">{app.date}</strong> às <strong className="text-zinc-200">{app.time}</strong>
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Valor: <span className="text-amber-500 font-semibold">R$ {Number(app.price).toFixed(2)}</span>
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  {app.status === 'pendente' && (
                    <Link
                      href={`/client/checkout?appointmentId=${app.id}`}
                      className="bg-amber-500 text-zinc-950 font-bold px-4 py-2 rounded-lg text-center hover:bg-amber-400 transition text-sm"
                    >
                      Pagar Agora
                    </Link>
                  )}

                  {(app.status === 'pendente' || app.status === 'confirmado') && (
                    <button
                      onClick={() => handleRequestCancellation(app)}
                      disabled={cancellingId === app.id}
                      className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 font-medium px-3 py-2 rounded-lg text-xs transition disabled:opacity-50"
                    >
                      {cancellingId === app.id ? 'Solicitando...' : 'Solicitar Cancelamento'}
                    </button>
                  )}

                  {app.status === 'solicitado_cancelamento' && (
                    <span className="text-xs text-amber-500/80 italic self-center">
                      Aguardando resposta da barbearia
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="border-t border-zinc-800 pt-6 flex justify-between items-center">
        <div>
          <h3 className="text-md font-semibold text-zinc-300">Histórico de Agendamentos</h3>
          <p className="text-xs text-zinc-500">Consulte serviços já finalizados ou cancelados.</p>
        </div>
        <button
          onClick={() => setShowHistoryModal(true)}
          className="bg-zinc-900 border border-zinc-700 hover:border-amber-500 text-zinc-300 px-4 py-2 rounded-lg text-sm transition"
        >
          Ver Histórico ({historyAppointments.length})
        </button>
      </div>

      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-zinc-800">
              <h3 className="text-xl font-bold text-amber-500">Histórico Completo</h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-zinc-400 hover:text-white text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 pr-2 flex-1">
              {historyAppointments.length === 0 ? (
                <p className="text-zinc-500 text-center py-8">Nenhum registro no histórico até o momento.</p>
              ) : (
                historyAppointments.map((app) => (
                  <div key={app.id} className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-zinc-200">{app.serviceName}</span>
                        {getStatusBadge(app.status)}
                      </div>
                      <p className="text-xs text-zinc-400">
                        {app.date} às {app.time} — R$ {Number(app.price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setShowHistoryModal(false)}
              className="mt-4 w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2 rounded-lg font-medium transition text-sm"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </main>
  );
}