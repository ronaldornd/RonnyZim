# Project: RonnyZim OS - Backend Architecture (MVP)

> **Missão**: Estabelecer uma fundação robusta, segura e orientada a inteligência para o RonnyZim OS, integrando BaaS de última geração com protocolos de contexto de IA modulares.

## Contexto do Backend
O backend do RonnyZim OS é projetado para ser "Invisible & Intelligent". Ele atua como o sistema nervoso central que alimenta o Oráculo (IA) com memórias persistentes e dados de mercado em tempo real.

## Core Values
- **Security First**: Todo dado é protegido por RLS (Row Level Security) e autenticação SSR.
- **Intelligence-Native**: A arquitetura é construída para servir modelos de linguagem via MCP (Model Context Protocol).
- **Global No-Scroll Compliance**: O backend deve fornecer dados de forma otimizada para interfaces de densidade fixa (paginação/streaming).
- **Zero Friction Auth**: Autenticação transparente e persistente usando Supabase SSR.
- **Data Immersion (v2.0)**: Streaming de dados via Server Actions estáveis e Suspense boundaries.

## High-Level Vision (MVP Phase 1)
1.  **Fundação de Dados**: Esquema relacional otimizado para Hunters e User Mastery.
2.  **Identidade**: LockScreen integrada e sessões persistentes em Next.js 16.
3.  **Intelligence Bridge**: Servidores MCP operando como guardiões de memória e rastreadores de mercado.
4.  **UX Imersiva**: Frontend de alta fidelidade com animações holográficas (v2.0).
5.  **Otimização Extrema**: Performance de carregamento com pre-fetching preditivo e streaming.

## Requisitos de Sucesso (KPIs)
- **Latência de Auth**: < 200ms para login/refresh (Target).
- **Integridade de Dados**: 100% de cobertura RLS para tabelas privadas.
- **Consistência de IA**: Feedback do Oráculo baseado em `user_facts` via MCP.
- **Tempo para Interatividade**: < 500ms para renderização do DesktopShell.

### Requisitos Validados ✅
- **FR-1**: Autenticação SSR via Supabase (Fase 1).
- **FR-2**: LockScreen integrada e sessões persistentes (Fase 1).
- **FR-3**: Intelligence Bridge (Market Intelligence) via Tavily (Fase 2).
- **FR-4**: Memory Guardian (Memory Management) via MCP (Fase 2).
- **FR-5**: Visual Holográfico v2.0 com SVGs inline e Framer Motion (Fase 3).
- **FR-6**: Onboarding imersivo com fluxo narrativo PT-BR (Fase 3).

### Requisitos Ativos 🚧
- **FR-7**: Streaming de Dados via Next.js 16 Server Actions (Fase 4).
- **FR-8**: Implementação de Suspense Boundaries holográficos (Fase 4).
- **FR-9**: Pre-fetching Preditivo (Fase 4).

---
*Last updated: 2026-04-03 after Milestone 3 Completion*
