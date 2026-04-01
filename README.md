# 🌌 RonnyZim OS — The Intelligence Interface

> "A maioria dos sistemas operacionais serve para rodar software. O RonnyZim OS serve para rodar a sua carreira. Menos scroll, mais inteligência. Se você não entendeu, o Oráculo explica." — **RonnyZim (Tech Lead)**

---

## 👁️ O Que é Isso?

RonnyZim OS é uma interface generativa de alta densidade projetada para o "Caçador Moderno" (Hunters). Construído sobre o dogma **Global No-Scroll**, ele elimina a distração de feeds infinitos em favor de uma viewport fixa (100vh), mística e ultra-funcional.

Este não é um dashboard. É um **Cérebro Digital** que utiliza o **Model Context Protocol (MCP)** para conectar seus dados privados (Memória) com o pulso do mercado em tempo real.

---

## 🛠️ Arquitetura (The Stack)

- **Frontend**: [Next.js 16 (App Router)](https://nextjs.org/) — Performance SSR e Streaming de UI.
- **Styling**: Vanilla CSS + [Framer Motion](https://www.framer.com/motion/) — Animações fluidas e estados de "Aura Técnica".
- **Backend/BaaS**: [Supabase](https://supabase.com/) — Auth SSR, RLS (Row Level Security) e Postgres em tempo real.
- **Brain (MCP Bridge)**: [Model Context Protocol SDK](https://modelcontextprotocol.io/) — Servidores modulares para contexto de IA.

---

## 🧠 Intelligence Bridge (MCP)

Nossa ponte de inteligência desacopla a IA da infraestrutura, permitindo que o Oráculo (IA) acesse ferramentas específicas:

### 🛡️ Memory Guardian
O guardião da sua identidade técnica.
- **Função**: Upsert e consulta de `user_facts` (XP, Skills, Biorritmo).
- **Segurança**: Gatekeeper estrito que impede a IA de alterar dados sensíveis de autenticação.

### 📈 Market Intelligence
O rastreador de oportunidades.
- **Ferramentas**: `search_jobs` e `extract_content`.
- **Engine**: Alimentado via [Tavily API](https://tavily.com/) para buscas profundas e estruturadas por vagas de engenharia.

---

## 🚀 Quick Start

### 1. Requisitos
- Node.js 20+
- Supabase Project
- API Keys: Gemini, Tavily.

### 2. Configuração de Variáveis
Renomeie `web/.env.example` para `web/.env.local` e preencha:
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
TAVILY_API_KEY=...
GEMINI_API_KEY=...
```

### 3. Orquestração (One-Command)
Para rodar o Frontend e os Servidores MCP simultaneamente:
```bash
npm run dev:mcp
```

*Nota: Se você rodar apenas `npm run dev`, os servidores MCP não serão instanciados via Stdio.*

---

## 🎯 Próximos Passos (Roadmap)

- [x] **Fase 1: Fundação** — Auth SSR e Identity Matrix.
- [x] **Fase 2: Intelligence Bridge** — Servidores MCP operacionais.
- [ ] **Fase 3: UX & Onboarding** — Tour interativo e LockScreen imersiva.
- [ ] **Fase 4: Tactical Core** — Hunter Board e Target Dossiers dinâmicos.

---

## 📜 Manifesto

No RonnyZim OS, acreditamos que a densidade visual é uma virtude. Cada pixel deve carregar contexto. A interface deve reagir ao seu biorritmo. O código deve ser invisível até que você precise dele.

**Built by RonnyZim OS. Managed by GSD Protocols.**
