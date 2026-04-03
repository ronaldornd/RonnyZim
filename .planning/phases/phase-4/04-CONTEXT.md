# Phase 4: Otimização de Dados - Context

**Gathered**: 2026-04-03
**Status**: Ready for research & planning (Data Immersion focus)

<domain>
## Phase Boundary
Otimizar o consumo de dados do Supabase e MCP (Memory/Market) para o frontend do RonnyZim OS, garantindo imersão total e latência zero percibida no painel principal (No-Scroll).

O foco inicial é a **Matriz de Identidade (Profile/XP)**.

</domain>

<decisions>
## Implementation Decisions

### Next.js 16.1 Stability
- **D-4.1**: Utilizar o Next.js 16.1+ com App Router e Server Actions totalmente estáveis para todas as mutações e streaming.
- **D-4.2**: Proibido o uso de padrões experimentais depreciados ou qualquer "downgrade" de versão nas sugestões.

### UX Imersiva (Roadmap de Otimização)
- **D-4.3 (Suspense)**: Implementação de boundaries granulares. O `DesktopShell` deve renderizar instantaneamente.
- **D-4.4 (Fallbacks)**: Proibidos spinners genéricos. Fallbacks devem ser textuais holográficos (`[ DECRYPTING DATA... ]`) ou esqueletos holográficos que mimetizam a UI final.
- **D-4.5 (Optimistic UI)**: Utilizar `useOptimistic` do React 19 para atualizações em tempo real (0ms) em ações como completar Quests ou favoritar vagas.

### Estratégia de Fetching & Cache
- **D-4.6 (Pre-fetching)**: Cache preditivo e silencioso. Ao interagir com a Matriz de Identidade, os dados do Hunter Board devem ser cacheados em background.
- **D-4.7 (Streaming)**: Dados de alta densidade (XP e Vagas) devem ser entregues via streaming para evitar CLS e tempos de espera.

</decisions>

<canonical_refs>
## Canonical References
- `web/components/os/DesktopShell.tsx` — Layout principal a ser protegido.
- `web/app/api/` — Route Handlers para endpoints de streaming.
- `web/lib/supabase/` — Client/Server handlers para auth e queries.

</canonical_refs>

<specifics>
## Design Specifics
- **Decrypted Aesthetics**: O carregamento deve parecer parte do sistema ("decifrando dados").
- **Zero intrusive loaders**: O conteúdo deve "emergir" organicamente conforme o stream chega.
- **Background Sync**: Sincronização secundária com Supabase em background silencioso para dados não-críticos.

</specifics>

---
*Generated: 2026-04-03 after Milestone 3 Completion*
