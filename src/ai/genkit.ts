import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// 1. Inicializa o Genkit utilizando o plugin moderno do Gemini
export const ai = genkit({
  plugins: [
    googleAI({
      // O SDK busca automaticamente a variável de ambiente GEMINI_API_KEY
    }),
  ],
  model: 'gemini-1.5-flash', // Modelo rápido e excelente para lidar com ferramentas (Tools)
});

// 2. Exportamos as funções vinculadas à instância 'ai' de forma explícita.
// Isso resolve o erro de membros não exportados e mantém os tipos do TypeScript perfeitos!
export const defineFlow = ai.defineFlow.bind(ai);
export const defineTool = ai.defineTool.bind(ai);