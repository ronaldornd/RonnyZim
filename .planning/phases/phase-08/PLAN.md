# Plano: UI Polishing & Neural Enforcements (Fase 08)

Plano para a implementação de enforcements de sistema e polimento da interface do workspace.

## Objetivos
1. Implementar o `NeuralLinkWizard` como barreira de entrada global.
2. Refatorar os aplicativos de Identity e Settings para suportar o novo fluxo.
3. Adicionar o `AgentCarousel` dinâmico no Workspace.

## Ondas de Execução

### Wave 1: Core OS & Identity
- [x] Criar `NeuralLinkWizard.tsx` (Componente global)
- [x] Modificar `DesktopShell.tsx` para injetar o bloqueio de sistema
- [x] Limpar `IdentityMatrix.tsx` removendo modais duplicados

### Wave 2: Agent Workspace & UX
- [x] Criar `AgentCarousel.tsx` (Engine de animação de agentes)
- [x] Integrar carrossel no `AgentWorkspace.tsx` com dados enriquecidos
- [x] Adicionar pause-on-hover e controles manuais no carrossel

### Wave 3: Settings & Types
- [x] Refatorar `SettingsApp.tsx` para layout em abas e agrupamento de modelos
- [x] Tipagem estrita de agentes no sistema
- [x] Atualização de documentação GSD
