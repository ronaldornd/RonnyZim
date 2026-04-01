# Roadmap: RonnyZim OS - Backend Architecture (MVP)

Plano de fases para a construção da infraestrutura inteligente.

## Fase 1: Fundação & Identidade (Milestone 1)
> **Objetivo**: Estabelecer a conexão segura e o esquema base.
- [ ] **Configuração Supabase SSR**: Implementar o middleware e os clientes server/browser no Next.js 16.
- [ ] **Migração de Esquema Base**: Criar as tabelas `Users`, `Jobs`, `Dossiers` e `Quests` com RLS.
- [ ] **Integração LockScreen**: Vincular a UI de autenticação ao fluxo de sessão do Supabase.

## Fase 2: Intelligence Bridge (Milestone 2)
> **Objetivo**: Implementar os servidores MCP para expansão de capacidades.
- [ ] **MCP Memory Guardian**: Criar o servidor MCP que interage com o banco de dados do Supabase (`user_facts`).
- [ ] **MCP Market Intelligence**: Criar o rastreador utilizando a API da **Tavily** para busca de vagas.
- [ ] **Comunicação Local (Stdio)**: Validar a conexão dos servidores com o Oráculo (IA).

## Fase 3: Integração "No-Scroll" (Milestone 3)
> **Objetivo**: Otimizar o fluxo de dados para a UI de alta densidade.
- [ ] **Endpoints de Streaming**: Configurar Route Handlers para fazer stream de análises do Gemini.
- [ ] **Paginação de Cursor**: Implementar a lógica de busca paginada para o HunterBoard e Dossiers.
- [ ] **Validação Final**: Auditoria de segurança (RLS) e performance (Lighthouse).

---
*Last updated: 2026-03-30*
