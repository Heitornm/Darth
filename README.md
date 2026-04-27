# DarthBarber - Modern Grooming

Este é um sistema de agendamento premium para barbearias, desenvolvido com **Next.js 15**, **Firebase** e **Genkit AI**. O projeto oferece uma experiência completa tanto para clientes quanto para barbeiros, incluindo um assistente de estilo inteligente movido a IA.

## 🚀 Tecnologias Utilizadas

- **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS, ShadCN UI.
- **Backend:** Firebase (Firestore, Authentication).
- **IA:** Genkit + Google Gemini (Modelo Flash 2.5).
- **Estilização:** Lucide Icons, Space Grotesk (Font).

## 📅 Regras de Agendamento & Disponibilidade

O sistema possui uma lógica visual rigorosa para facilitar a reserva:
- **Expediente:** O horário de atendimento é das **08:00 às 21:00**, de segunda a sábado.
- **Calendário Inteligente:**
  - **Verde (Disponível):** Dias que ainda possuem slots de tempo livres dentro do expediente.
  - **Vermelho (Lotado):** Dias onde a soma da duração dos serviços agendados atingiu o limite de 780 minutos (expediente completo).
  - **Bloqueio:** Datas lotadas ou passadas ficam desabilitadas para clique, impedindo agendamentos impossíveis.

## 🤖 Assistente de Estilo AI

Na tela de agendamento, o cliente pode usar o **Darth Assistant**:
1. O cliente descreve o corte desejado em linguagem natural (ex: "Quero um fade baixo mas com franja longa").
2. A IA (Gemini) processa a descrição e gera um resumo técnico padronizado.
3. Esse resumo é enviado diretamente para a agenda do barbeiro, garantindo que a expectativa do cliente seja atendida com precisão.

## 🛠️ Configuração Local

### 1. Pré-requisitos
- Node.js 18+ instalado.
- Conta no [Google AI Studio](https://aistudio.google.com/app/apikey) para obter a `GEMINI_API_KEY`.

### 2. Instalação
```bash
npm install
```

### 3. Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz do projeto:
```env
GEMINI_API_KEY=sua_chave_aqui
```

### 4. Execução
```bash
# Rodar o app Next.js
npm run dev

# Rodar o ambiente de desenvolvimento Genkit (IA)
npm run genkit:dev
```

## 🔐 Segurança & Índices

- **Segurança:** As regras do Firestore estão configuradas para permitir que qualquer usuário autenticado consulte a disponibilidade global (necessário para as cores do calendário), enquanto as ações de editar/cancelar são restritas aos donos dos documentos.
- **Índices:** Ao realizar buscas complexas (como filtrar agendamentos por data e barbeiro), o Firebase pode solicitar um índice. Verifique o console do navegador e clique no link automático fornecido pelo Firebase para criá-lo instantaneamente.

---
*DarthBarber - Que a força do estilo esteja com você.*