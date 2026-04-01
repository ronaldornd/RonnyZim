# Project: RonnyZim OS - Backend Architecture (MVP)

> **Missão**: Estabelecer uma fundação robusta, segura e orientada a inteligência para o RonnyZim OS, integrando BaaS de última geração com protocolos de contexto de IA modulares.

## Contexto do Backend
O backend do RonnyZim OS é projetado para ser "Invisible & Intelligent". Ele atua como o sistema nervoso central que alimenta o Oráculo (IA) com memórias persistentes e dados de mercado em tempo real.

## Core Values
- **Security First**: Todo dado é protegido por RLS (Row Level Security) e autenticação SSR.
- **Intelligence-Native**: A arquitetura é construída para servir modelos de linguagem via MCP (Model Context Protocol).
- **Global No-Scroll Compliance**: O backend deve fornecer dados de forma otimizada para interfaces de densidade fixa (paginação/streaming).
- **Zero Friction Auth**: Autenticação transparente e persistente usando Supabase SSR.

## High-Level Vision (MVP Phase 1)
1.  **Fundação de Dados**: Esquema relacional otimizado para Hunters e User Mastery.
2.  **Identidade**: LockScreen integrada e sessões persistentes em Next.js 16.
3.  **Intelligence Bridge**: Servidores MCP operando como guardiões de memória e rastreadores de mercado.

## Requisitos de Sucesso (KPIs)
- **Latência de Auth**: < 200ms para login/refresh.
- **Integridade de Dados**: 100% de cobertura RLS para tabelas privadas.
- **Consistência de IA**: Feedback do Oráculo baseado em `user_facts` com zero alucinação sobre o perfil do usuário.

---
*Last updated: 2026-03-30 after Architecture Approval*
