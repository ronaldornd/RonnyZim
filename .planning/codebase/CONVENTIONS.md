# Conventions: RonnyZim OS

Diretrizes de estilo, código e visual.

## 1. Design System: Cyber-Mystic
O RonnyZim OS não é um "Dashboard Administrativo". Ele é um terminal de alto poder.
- **Paleta de Cores**: Tons de Verde Matrix, Esmeralda Neón, Preto Profundo (#020302) e Vidro (Glassmorphism).
- **Proibido (Purple Ban)**: Não utilize tons de roxo ou rosa, a menos que solicitado para uma aura específica de erro.
- **Tipagem Visual**: Fontes Mono (JetBrains Mono) para dados técnicos e Sans-Serif (Inter/Outfit) para interface de usuário.

## 2. Implementação No-Scroll
Todo componente de tela cheia deve obedecer:
- `h-screen`, `w-full`, `overflow-hidden`.
- Se o conteúdo exceder a tela, **não use scroll**. Use `Pagination`, `Tabs` ou `Framer Motion LayoutId` para trocar o contexto visual.
- Exemplo em `IdentityMatrix.tsx`: Divisão entre Abas de Maestria e Jornada em vez de uma página longa.

## 3. Padrões de Código (Clean Code)
- **Componentes Funcionais**: Sempre utilize `export default function` com Tipos de Props definidos.
- **Client Components**: Adicione `"use client";` apenas onde houver interatividade.
- **Naming**: Use PascalCase para componentes e camelCase para funções/variáveis.
- **Comentários**: Não comente o óbvio. Use comentários para explicar o "Porquê" de decisões arquiteturais complexas.

## 4. Animações Framer Motion
- Use `layoutId` para transições consistentes entre componentes que representam a mesma entidade.
- Sempre envolva transições de rotas ou estados principais com `AnimatePresence`.
- Duração padrão de animação: `0.3s` a `0.5s` com curvas `easeInOut` ou `spring`.
