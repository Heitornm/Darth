"use client";

import { useState } from 'react';
import { Sparkles, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { clientStyleAssistant } from '@/ai/flows/client-style-assistant-flow';

interface StyleAssistantProps {
  onSummaryGenerated: (summary: string) => void;
}

export function StyleAssistant({ onSummaryGenerated }: StyleAssistantProps) {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!description.trim()) return;
    setLoading(true);
    try {
      const result = await clientStyleAssistant({ clientDescription: description });
      setSummary(result.summaryForBarber);
      onSummaryGenerated(result.summaryForBarber);
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-accent/20 bg-accent/5 overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="font-headline flex items-center gap-2 text-accent">
          <Sparkles className="w-5 h-5" />
          Assistente de Estilo AI
        </CardTitle>
        <CardDescription>
          Descreva como você quer o seu corte e nossa IA traduzirá para o barbeiro.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {summary ? (
          <div className="p-4 rounded-lg bg-accent/10 border border-accent/20 flex gap-3 animate-in fade-in zoom-in-95">
            <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-accent/80">Resumo Gerado:</p>
              <p className="text-sm italic">"{summary}"</p>
              <Button 
                variant="link" 
                size="sm" 
                className="p-0 h-auto text-accent/70 hover:text-accent"
                onClick={() => setSummary(null)}
              >
                Refazer descrição
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Textarea 
              placeholder="Ex: Quero um degradê médio nas laterais, preservando o comprimento no topo para pentear para o lado..."
              className="bg-background border-accent/20 focus-visible:ring-accent min-h-[100px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Button 
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={handleGenerate}
              disabled={loading || !description.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analisando estilo...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Gerar Resumo para o Barbeiro
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
