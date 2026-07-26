import { defineFlow } from "@genkit-ai/flow";
import { z } from "zod";

export const ClientStyleInputSchema = z.object({
  clientDescription: z.string(),
});

export const ClientStyleOutputSchema = z.object({
  summaryForBarber: z.string(),
});

export const clientStyleAssistantFlow = defineFlow(
  {
    name: "clientStyleAssistantFlow",
    inputSchema: ClientStyleInputSchema,
    outputSchema: ClientStyleOutputSchema,
  },
  async (input) => {
    // Processamento do resumo de estilo para o barbeiro
    const summary = `Cliente deseja: ${input.clientDescription}`;

    return {
      summaryForBarber: summary,
    };
  }
);