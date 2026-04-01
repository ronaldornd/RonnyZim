# Tech Stack: RonnyZim OS

Estado tecnológico atual e diretrizes de dependências (Março 2026).

## Core Framework & Runtime
- **Next.js 16.1.6**: Framework principal (100% Intencional). Utiliza App Router para roteamento e Server Actions para lógica de backend.
- **React 19.2.4**: Biblioteca de UI, aproveitando as novas funcionalidades de renderização e hooks.
- **TypeScript 5.9.3**: Tipagem estritamente aplicada em todo o projeto.

## Styling & Design System
- **Tailwind CSS 4.2.1**: Framework de CSS utilitário para estilização rápida e consistente.
- **Vanilla CSS**: Utilizado para controles finos onde o Tailwind não cobre (ex: animações complexas de glassmorphism).
- **Framer Motion 12.34.3**: Motor principal de animações, essencial para as transições de `layoutId` e o sentimento "Cyber-Mystic".
- **Lucide React**: Biblioteca de ícones padrão.

## Data & Backend-as-a-Service (BaaS)
- **Supabase (v2.98.0)**:
    - **Auth**: Gerenciamento de identidade (LockScreen).
    - **PostgreSQL**: Banco de dados relacional.
    - **Storage**: buckets como `hunter_vault` para documentos.
    - **Edge Functions**: (Planejado/Em transição) Para lógica serverless.
- **Zod 4.3.6**: Validação de esquemas de dados em runtime.

## Inteligência Artificial (Oráculo)
- **Google GenAI (@google/genai 1.46.0)**: SDK nativo para integração com modelos Gemini (Pro/Flash).
- **MCP (Model Context Protocol)**: (Arquitetura Futura) Padronização de ferramentas e contextos para o motor de IA.

## Visualização & UI Especializada
- **@xyflow/react (12.10.1)**: Utilizado para o `NeuralGraph` e fluxos lógicos visuais.
- **Recharts 3.7.0**: Gráficos de Radar e Dashboard (Aura do Perfil).
