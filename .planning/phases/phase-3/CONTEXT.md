# Phase 3 Context: UX & Onboarding (Cold Boot Sequence)

## Overview
A Fase 3 foca na primeira impressão visceral do RonnyZim OS. Em vez de um onboarding tradicional, utilizaremos uma sequência de "Cold Boot" (inicialização fria) que simula o carregamento dos sistemas místico-tecnológicos, culminando na LockScreen.

## Socratic Answers (Approved Guidelines)
- **Visual**: Fundo escuro, logs monoespaçados (verde/cyan), glitches e efeito CRT (Framer Motion).
- **Narrativa**: RonnyZim (Oráculo) narra via typewriter (2-3 linhas de texto tático).
- **Interação**: Bypass imediato via [SPACE] ou [ESC]. Texto pulsante "[ PRESS SPACE TO BYPASS ]" no rodapé.
- **Persistência**: O boot deve ocorrer apenas uma vez por sessão (sessionStorage).

## Technical Requirements (FR-5)
- **Task A**: `BootSequence.tsx` (Framer Motion, CSS CRT Mask).
- **Task B**: Lógica de `isBootComplete` com suporte a teclado.
- **Task C**: Transição fluida de opacidade para a `LockScreen`.

## Effort & Constraints
- **Effort**: High (Orquestração de frames e eventos de teclado).
- **Dogma**: No-Scroll (O boot deve ocupar 100vh fixo).
