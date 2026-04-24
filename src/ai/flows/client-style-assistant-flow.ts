'use server';
/**
 * @fileOverview An AI-powered conversational assistant that helps clients articulate their desired haircut or style preferences.
 * It generates a concise summary for the barber.
 *
 * - clientStyleAssistant - A function that processes the client's style description.
 * - ClientStyleAssistantInput - The input type for the clientStyleAssistant function.
 * - ClientStyleAssistantOutput - The return type for the clientStyleAssistant function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ClientStyleAssistantInputSchema = z.object({
  clientDescription: z
    .string()
    .describe("The client's natural language description of their desired haircut or style."),
});
export type ClientStyleAssistantInput = z.infer<typeof ClientStyleAssistantInputSchema>;

const ClientStyleAssistantOutputSchema = z.object({
  summaryForBarber: z
    .string()
    .describe("A concise, standardized summary of the client's desired style, optimized for a barber's understanding."),
});
export type ClientStyleAssistantOutput = z.infer<typeof ClientStyleAssistantOutputSchema>;

export async function clientStyleAssistant(
  input: ClientStyleAssistantInput
): Promise<ClientStyleAssistantOutput> {
  return clientStyleAssistantFlow(input);
}

const clientStyleAssistantPrompt = ai.definePrompt({
  name: 'clientStyleAssistantPrompt',
  input: { schema: ClientStyleAssistantInputSchema },
  output: { schema: ClientStyleAssistantOutputSchema },
  prompt: `You are an AI-powered conversational style assistant for a barbershop. Your task is to take a client's natural language description of their desired haircut or style and convert it into a concise, standardized summary that a barber can easily understand and use.
Focus on key elements like length, cut type, styling preferences, and any specific details mentioned. Ensure the summary is actionable for a barber.

Client's Description: {{{clientDescription}}}`,
});

const clientStyleAssistantFlow = ai.defineFlow(
  {
    name: 'clientStyleAssistantFlow',
    inputSchema: ClientStyleAssistantInputSchema,
    outputSchema: ClientStyleAssistantOutputSchema,
  },
  async (input) => {
    const { output } = await clientStyleAssistantPrompt(input);
    if (!output) {
      throw new Error('Failed to generate style summary.');
    }
    return output;
  }
);
