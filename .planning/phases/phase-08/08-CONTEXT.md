# 08-CONTEXT.md :: UI Polishing & Neural Enforcements

## 1. Escopo da Fase
Esta fase foca na consolidação da identidade visual e na obrigatoriedade do setup técnico (Neural Link) para garantir que o sistema não opere em estado não-inicializado.

- **Mandatory Onboarding**: Bloqueio global do OS até validação de API Key.
- **Agent Identity**: Transição do estado de chat estático para um carrossel informativo de sub-agentes.
- **Settings Optimization**: Refatoração da interface de configurações para melhor densidade e controle.

## 2. Decisões Técnicas
- **Global Lock**: Implementado no `DesktopShell.tsx` como nível mais alto de contenção.
- **Carousel Engine**: Componente desacoplado `AgentCarousel.tsx` para fácil reutilização e manutenção.
- **Grouped Selectors**: Agrupamento de modelos de IA por família (Gemini, OpenAI, etc.) para facilitar a seleção.

## 3. Estado
- Status: [ IMPLEMENTADO ]
- Aguardando: Commit Atômicos & Arquivamento.
