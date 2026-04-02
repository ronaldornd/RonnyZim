# Roadmap: RonnyZim OS - Backend Architecture (MVP)

Plano de fases para a construção da infraestrutura inteligente.

## Fase 1: Fundação & Identidade (Milestone 1) — ✅ SHIPPED 2026-03-31
> **Objetivo**: Conexão segura e esquema base implementados.
- [x] **Configuração Supabase SSR**: Middleware e clientes server/browser integrados.
- [x] **Migração de Esquema Base**: Tabelas core com RLS configuradas.
- [x] **Integração LockScreen**: Vincular a UI de autenticação ao Supabase.

## Fase 2: Intelligence Bridge (Milestone 2) — ✅ SHIPPED 2026-04-01
> **Objetivo**: Servidores MCP operacionais (Memory & Market).
- [x] **MCP Memory Guardian**: Servidor MCP integrado ao `user_facts` do Supabase.
- [x] **MCP Market Intelligence**: Rastreamento real-time de vagas via Tavily.
- [x] **Comunicação Local (Stdio)**: Orquestração funcional via `npm run dev:mcp`.

## 🚧 Fase 3: UX & Onboarding (Milestone 3) — EM PROGRESSO
> **Objetivo**: Criar a primeira impressão imersiva e guia do usuário.
- [ ] **Interactive Pre-Login Tour**: Implementar o walkthrough visual antes do LockScreen.
- [ ] **Onboarding Gamificado**: Introduzir a mecânica de XP e progresso inicial.
- [ ] **Transição de Auth**: Sincronizar o fim do tour com o gatilho de login/registro.

## Fase 4: Otimização de Dados (Milestone 4)
> **Objetivo**: Performance extrema para UI de alta densidade (No-Scroll).
- [ ] **Endpoints de Streaming**: Configurar Route Handlers para fazer stream de análises do Gemini.
- [ ] **Paginação de Cursor**: Implementar a lógica de busca paginada para o HunterBoard e Dossiers.
- [ ] **Validação Final**: Auditoria de segurança (RLS) e performance (Lighthouse).

---
*Last updated: 2026-04-01 after Phase 3 Planning*
