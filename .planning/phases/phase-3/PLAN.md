# Plan: Phase 3 — UX_Enrichment (Holographic Onboarding v2.0)

### Purpose
Transformar o tutorial inicial em uma experiência de imersão holográfica tática, utilizando backgrounds de logs dinâmicos, ícones SVGs de múltiplas camadas e interações cyber-místicas com suporte a áudio.

### Performance & Safety
- **Anti-Scroll**: Manter 100vh absoluto via `overflow-hidden`.
- **Pre-Login Security**: Zero chamadas de rede durante o Onboarding (logs narrativos locais).
- **HMR Persistence**: Garantir que o cache do Turbopack não afete as animações complexas.

### Tasks

<task id="P3D" name="Holographic Icon System (SVG + Framer)" effort="High">
    - Desenvolver SVGs Inline customizados para os 5 cards.
    - Implementar animações de `pathLength` e `opacity` para efeito de "desenho técnico".
</task>

<task id="P3E" name="DataStream Background (Local Logs)" effort="Medium">
    - Criar componente `DataStreamBackground` com logs narrativos fixos em loop.
    - Garantir performance via `React.memo` e animações de opacidade sutil.
</task>

<task id="P3F" name="CyberSFX Hook Infrastructure" effort="Medium">
    - Desenvolver `hooks/useCyberSFX.ts` para gestão de áudio.
    - Vincular eventos de `hover` e `click` nos botões do tutorial.
</task>

<task id="P3G" name="Onboarding Tutorial v2.0 Refactor" effort="High">
    - Atualizar `OnboardingTutorial.tsx` com painéis holográficos transparentes.
    - Implementar botões táticos com coordenadas binárias dinâmicas em tempo real.
</task>

### Done
- Onboarding funcional v1.0 (Logs + Tutorial simples).
- UX_Enrichment Visual Concept aprovado.
