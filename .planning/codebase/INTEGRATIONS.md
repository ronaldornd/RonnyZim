# Integrations: RonnyZim OS

Mapeamento das conexões externas e serviços de backend.

## 1. Supabase (Core BaaS)
O projeto utiliza o Supabase como espinha dorsal de infraestrutura.
- **Autenticação**: Centralizada em `components/auth/LockScreen.tsx`. Utiliza o `browserClient` para persistência de sessão.
    - *Fluxo*: LockScreen -> Supabase Auth -> Redirect para Dashboard.
- **Database (PostgreSQL)**: Tabelas principais:
    - `profiles`: Dados do IdentityMatrix e Natal Chart.
    - `user_facts`: Memória de longo prazo para o Oráculo.
    - `jobs/targets`: Armazenamento de registros do HunterBoard.
- **Storage**: Buckets para documentos de candidatos (PDF/Docx) com políticas de RLS ativas.

## 2. Oracle Intelligence (Gemini AI)
A inteligência do sistema é provida pelo Google Gemini.
- **Endpoints**: `/api/chat`, `/api/analyze`, `/api/astro`.
- **SDK**: `@google/genai`.
- **Modelos**: Preferência por `gemini-1.5-pro` para análises profundas e `gemini-1.5-flash` para interações rápidas no HunterZim.
- **Contexto**: Integração nativa com `user_facts` para personalização mystic-tech.

## 3. Neural Bridge (Futuro MCP)
Preparação estrutural para o Model Context Protocol.
- **Objetivo**: Permitir que a IA interaja com ferramentas locais (scripts, sistema de arquivos) de forma padronizada.
- **Status**: Em fase de design arquitetural em `INTEGRATIONS.md`.

## 4. Webhooks & Sync
- **n8n**: (Legado/Em desuso para IA) Anteriormente usado para análise multimodal. Atualmente, a análise é feita via Gemini SDK no backend do Next.js.
- **LinkedIn API**: (Planejado) Para o recurso "Radar de Networking".
