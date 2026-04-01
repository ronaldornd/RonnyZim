# Structure: RonnyZim OS

Mapeamento do sistema de arquivos e organização de pastas.

## `/web` (Root do projeto frontend)
- **`app/`**: Rotas do Next.js (App Router).
    - `api/`: Endpoints server-side (Gemini, Supabase Proxy).
    - `auth/`: Páginas e callbacks de autenticação.
- **`components/`**: Peças modulares da UI.
    - `apps/`: Módulos de aplicação (`hunter`, `identity`, `aura`).
    - `auth/`: Login e proteção (ex: `LockScreen.tsx`).
    - `chat/`: Interface do Oráculo / HunterZim.
    - `os_layout/`: Componentes de sistema (Taskbar, Desktop, WindowManager).
    - `ui/`: Componentes base (Botões, Modais, Cards Cyber-Mystic).
- **`lib/`**: Utilitários e configurações de SDK.
    - `supabase/`: Configuração do cliente (browser/server).
    - `oracle/`: Helpers para o SDK do Gemini.
    - `utils/`: Funções auxiliares de CSS e formatação.
- **`supabase/`**: Definições de banco de dados e migrações locais.
- **`public/`**: Assets estáticos (Imagens, Fontes, SVGs).

## `/agent` (Agent Kit Interno)
Contém os cérebros e scripts de automação que operam no RonnyZim OS.
- **`agents/`**: Personas e regras para os agentes (ex: `hunter-agent.md`).
- **`skills/`**: Habilidades específicas para os agentes.
- **`scripts/`**: Utilitários de verificação (lint, security, performance).
- **`workflows/`**: Instruções estruturadas para tarefas complexas.
