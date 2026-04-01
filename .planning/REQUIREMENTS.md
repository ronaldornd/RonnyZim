# Requirements: RonnyZim OS - Backend Architecture (MVP)

Especificações de requisitos para a fundação inteligente do sistema.

## 1. Requisitos Funcionais (FR)

### FR-1: Gestão de Identidade (Auth SSR)
- **FR-1.1**: Autenticação via `supabase-js` em Next.js 16 (App Router).
- **FR-1.2**: Persistência de sessão via Middleware para SSR (cookies seguros).
- **FR-1.3**: Proteção de rotas (Guardas) no servidor para impedir acesso anônimo sem JWT válido.

### FR-2: Persistência de Dados (Supabase PostgreSQL)
- **FR-2.1**: Esquema relacional com UUID v4 para PKs.
- **FR-2.2**: Políticas RLS estritas: `auth.uid() = profile_id` ou equivalente.
- **FR-2.3**: Suporte a Dados de Biorritmo e Astro (Natal Chart).
- **FR-2.4**: Repositório central de Hunter Alvos e Dossier Insights.

### FR-3: Market Intelligence (MCP Tracker)
- **FR-3.1**: Integração com **Tavily API** para busca otimizada de vagas.
- **FR-3.2**: Extração de dados limpos (JSON estruturado) para consumo da IA.
- **FR-3.3**: Execução local via transporte de Stdio.

### FR-4: Memory Guardian (MCP Supabase)
- **FR-4.1**: Conector inteligente para ler/escrever `user_facts` no Supabase.
- **FR-4.2**: Abstração de ferramentas de IA para o Oráculo (Ex: `get_user_profile`, `save_hunter_insight`).

## 2. Requisitos Não-Funcionais (NFR)

### NFR-1: Performance (No-Scroll Optimization)
- **NFR-1.1**: O backend deve retornar dados paginados (Cursor-based) para evitar envios massivos.
- **NFR-1.2**: Latência total de rede + query deve ser inferior a 300ms.

### NFR-2: Segurança & Privacidade
- **NFR-2.1**: 100% de cobertura de RLS nas tabelas do MVP.
- **NFR-2.2**: Cifragem de campos sensíveis (se houver) e conformidade com LGPD/GDPR.

### NFR-3: Escalabilidade de IA
- **NFR-3.1**: Arquitetura MCP modular para permitir a adição de novos rastreadores sem alteração no Core.

---
*Last updated: 2026-03-30*
