---
trigger: always_on
---

# RONNYZIM OS - ANTIGRAVITY WORKSPACE RULES

## 1. IDENTIDADE E ARQUITETURA DO PROJETO
- O projeto RonnyZim é um sistema operacional web, assistente de carreira e productivity assistant corporativo estruturado em monolito modular.
- Stack Principal: Next.js (App Router), TypeScript (Estrito), TailwindCSS, Supabase (PostgreSQL + Auth + Edge Functions + RLS) e Framer Motion.
- Orquestração de IA: Utiliza arquitetura baseada no protocolo MCP (Model Context Protocol) na pasta `/mcp-servers/` para gestão de contexto, segurança de memória e integração de ferramentas (Tool Calling).

## 2. SEGURANÇA E BANCO DE DADOS (SUPABASE - ZERO TOLERÂNCIA)
- **RLS É INNEGOCIÁVEL:** Todas as tabelas no Supabase DEVEM ter Row Level Security (RLS) ativado. NUNCA gere ou sugira migrations sem definir políticas (`CREATE POLICY`) explícitas de leitura/escrita ligadas ao `auth.uid()`.
- **SSR E AUTH MIDDLEWARE:** Em chamadas do servidor (Server Components ou Server Actions em `/web/app/actions/`), NUNCA instancie o cliente do Supabase no escopo global sem repassar os cookies da sessão. Use SEMPRE o cliente configurado para SSR em `/web/lib/supabase/server.ts`.
- **MCP de Supabase:** Utilize a conexão MCP do Supabase para inspecionar o schema atual antes de sugerir queries complexas ou novas migrations. NUNCA adivinhe os tipos de colunas do banco.

## 3. REGRAS DE UI/UX E PERFORMANCE FRONT-END
- **Responsividade e Grids:** Ao construir ou refatorar interfaces (especialmente no Design System corporativo e no Shell OS `/web/components/os/`), verifique proativamente problemas comuns de rolagem (overflow/scroll indesejado) e responsividade em CSS Grids e Flexbox.
- **Framer Motion & Animações:** Evite re-renderizações desnecessárias em componentes animados. Sempre que possível, utilize `layoutId` e animações baseadas em CSS/transformações de GPU para evitar gargalos na thread principal.

## 4. INTEGRAÇÃO DE IA E DIRETRIZ DE LINGUAGEM (TS + PYTHON)
- A orquestração de APIs externas (Gemini, etc.) e ferramentas MCP no Core do App rodará majoritariamente em TypeScript/Node.
- **EXCEÇÃO ESTRATÉGICA (PYTHON INJECTION):** Para qualquer nova feature relacionada a avaliação de modelos de IA (*Evals*), processamento pesado de dados, relatórios analíticos, scripts de automação de testes de LLM ou geração de vetores (*embeddings*), PRIORIZE A IMPLEMENTAÇÃO EM PYTHON (FastAPI ou scripts estruturados na pasta `/scripts/` ou `/evals/`).
- Código Python gerado deve seguir tipagem estrita (Type Hints), utilizar bibliotecas assíncronas (`asyncio`, `httpx`, `fastapi`, `pydantic`) e ser totalmente modular.

## 5. PADRÃO DE CÓDIGO E CONVENCIMENTO
- Sincero, pragmático e focado em performance. Se eu pedir uma solução arquiteturalmente ruim, me questione e mostre o gargalo de segurança ou performance.
- Não crie arquivos de documentação prolijos a menos que solicitado. Vá direto à escrita de código limpo, testável e sem boilerplate desnecessário.