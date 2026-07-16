import * as zod from 'zod';
// Importamos os definidores e o cliente AI do wrapper local já corrigido
import { defineTool, defineFlow, ai } from '../genkit';
import { appointmentService } from '@/services/appointmentService'; 

// ==========================================
// 1. CRIANDO A FERRAMENTA DE GRAVAÇÃO (TOOL)
// ==========================================
export const createAppointmentTool = defineTool({
    name: 'createAppointment',
    description: 'Cria um agendamento de barbearia no banco de dados quando o usuário confirma o desejo de agendar.',
    inputSchema: zod.object({
      clientId: zod.string().describe('O ID do cliente logado'),
      clientName: zod.string().describe('O nome do cliente logado'),
      serviceId: zod.string().describe('O ID do serviço escolhido'),
      barberId: zod.string().describe('O ID do barbeiro selecionado'),
      price: zod.number().describe('O preço do serviço selecionado'),
      date: zod.string().describe('Data do agendamento no formato ISO (YYYY-MM-DD)'),
      time: zod.string().describe('Horário do agendamento (HH:MM)'),
    }),
    outputSchema: zod.object({
      success: zod.boolean(),
      message: zod.string(),
    }),
  },
  async (input) => {
    try {
      // Converte as strings de data e hora geradas pela IA em um objeto Date
      const [year, month, day] = input.date.split('-').map(Number);
      const [hours, minutes] = input.time.split(':').map(Number);
      const scheduledDate = new Date(year, month - 1, day, hours, minutes);

      // Chamamos o método do seu Service mapeando os campos exatos da interface Appointment
      await appointmentService.createAppointment({
        clientId: input.clientId,
        clientName: input.clientName,
        barberId: input.barberId,
        serviceId: input.serviceId,
        price: input.price,
        dataHora: scheduledDate,
      });

      return { 
        success: true, 
        message: 'Agendamento gravado com sucesso no sistema!' 
      };
    } catch (error: any) {
      return { 
        success: false, 
        message: `Falha ao salvar agendamento: ${error.message}` 
      };
    }
  }
);

// ==========================================
// 2. DEFININDO O FLUXO (FLOW) COM GENKIT
// ==========================================
export const clientStyleAssistantFlow = defineFlow(
  {
    name: 'clientStyleAssistantFlow',
    inputSchema: zod.object({
      message: zod.string(),
      clientId: zod.string(),
      clientName: zod.string(),
      history: zod.array(zod.object({
        role: zod.enum(['user', 'model']),
        text: zod.string()
      })).optional()
    }),
    outputSchema: zod.string(),
  },
  async (input) => {
    const response = await ai.generate({
      prompt: `Você é o Darth, o assistente virtual inteligente da barbearia Darth Barber.
      Seu objetivo é ajudar os clientes a escolherem estilos de corte, barba e realizar agendamentos.
      Seja sempre amigável, estiloso e direto.
      
      Regras:
      1. Se o cliente quiser agendar, utilize a ferramenta "createAppointment". Você DEVE pedir e confirmar todos os parâmetros obrigatórios antes de chamar a ferramenta (serviço, barbeiro, data e hora).
      2. O ID do cliente atual é: "${input.clientId}" e o nome dele é "${input.clientName}". Use-os ao chamar a ferramenta.
      3. Se as informações não estiverem completas, pergunte de forma natural o que está faltando.
      
      Mensagem do usuário: "${input.message}"`,
      tools: [createAppointmentTool],
    });

    return response.text;
  }
);