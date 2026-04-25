# DarthBarber - Modern Grooming

Este é um sistema de agendamento para barbearias moderno, utilizando Next.js, Firebase e Genkit para assistente de estilo com IA.

## Como rodar localmente

### 1. Pré-requisitos
- Node.js 18 ou superior.
- Uma conta no Google Cloud/Firebase para serviços de backend.
- Uma chave de API do Google AI (Gemini) para as funcionalidades de IA.

### 2. Instalação
Clone o repositório e instale as dependências:
```bash
npm install
```

### 3. Configuração de Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz do projeto:
```env
GEMINI_API_KEY=sua_chave_aqui
```
*Nota: As configurações do Firebase já estão incluídas no arquivo `src/firebase/config.ts`.*

### 4. Executando o Projeto
Inicie o servidor de desenvolvimento do Next.js:
```bash
npm run dev
```
O projeto estará disponível em `http://localhost:9002` (ou na porta indicada no terminal).

### 5. Executando o Genkit (IA)
Para testar e depurar os fluxos de IA (como o Assistente de Estilo):
```bash
npm run genkit:dev
```
Acesse `http://localhost:4000` para ver a interface do Genkit.

## Estrutura do Projeto
- `src/app`: Páginas e rotas do Next.js.
- `src/ai`: Fluxos e configurações do Genkit.
- `src/firebase`: Configuração e hooks do Firebase.
- `src/components`: Componentes UI reutilizáveis (ShadCN).
