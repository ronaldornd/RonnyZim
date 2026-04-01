# Architecture: RonnyZim OS

Visão geral da estrutura, fluxo e padrões de design.

## 1. Diretriz: Global No-Scroll (Imperativa)
O RonnyZim OS não utiliza barras de rolagem convencionais (`overflow-y-auto`).
- **Problema**: Interfaces "caixas de texto" e listas infinitas quebram a estética Mystic-Cyber.
- **Solução**: Alta densidade de informação gerida por:
    - **Paginação**: Listas curtas com troca de página instantânea.
    - **Abas e Modais**: Separação contextual de dados (IdentityMatrix).
    - **Framer Motion LayoutId**: Transições fluidas que "reposicionam" elementos em vez de rolar a página.
- **Contêineres**: `h-screen`, `w-full`, `overflow-hidden`.

## 2. Component Hierarchy (Next.js App Router)
As vistas são organizadas por responsabilidade funcional.
- **`Layout`**: Controla o estado global (Oráculo, Conexão Supabase, Background Mystic).
- **`Dashboard`**: Hub principal que alterna entre Apps.
- **`Core Apps`**:
    - `HunterBoard`: Mural de alvos e currículos.
    - `IdentityMatrix`: Perfil, maestria e Biorritmo.
    - `TargetDossier`: Detalhes profundos de um alvo.
    - `AuraDashboard`: Visualização de dados astrológicos/técnicos.

## 3. State Management
- **React Hooks (Client-side)**: Estados locais para UI (modais, abas).
- **Supabase Realtime**: Sincronização de dados entre múltiplos terminais.
- **URL Query Params**: Utilizado para persistência de estado de navegação (ex: `?app=hunter&targetId=123`).

## 4. Animation Engine (Framer Motion)
O movimento não é apenas decorativo, ele é **funcional**.
- **`layoutId`**: Usado para "teleportar" elementos entre estados visualmente.
- **`AnimatePresence`**: Gerencia a saída de componentes da DOM de forma suave, essencial para o No-Scroll.
- **Performance**: Evitar `layout` em propriedades pesadas; preferir `opacity` e `transform`.
