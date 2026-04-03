# Requirements: RonnyZim OS - Hunter Expansion & Simulator (Milestone 6)

Especificações para a ativação do Hunter Board, orquestração MCP e Simulador de Entrevistas.

## 1. Requisitos Funcionais (FR)

### FR-10: Integração MCP Market Intelligence
- [x] **FR-10.1**: Criar Server Actions para invocar o servidor MCP `market-intelligence`.
- [x] **FR-10.2**: Implementar função `search_jobs` disparada via UI (Input de Carreira).
- [x] **FR-10.3**: Persistir vagas encontradas no Supabase vinculadas ao `user_id`.

### FR-11: Cartões de Alvo (Holographic Cards v2.5)
- [x] **FR-11.1**: Desenvolver o componente `TargetCard` com estética de vidro e animação de "scanning".
- [x] **FR-11.2**: Aplicar `Suspense` granular para cada cartão individual.

### FR-12: Neural Match Score (Gemini)
- [x] **FR-12.1**: Criar endpoint/action que envia o Profile e o Job Description para o Gemini.
- [x] **FR-12.2**: Exibir o score (0-100%) com barra de progresso holográfica.

### FR-13: Simulador de Entrevistas (Listening Room)
- [x] **FR-13.1**: Implementar hook `useAudioRecorder` para captura de 180s (MediaRecorder).
- [x] **FR-13.2**: Criar `WaveVisualizer` holográfico de alta performance (60 FPS via Canvas).
- [x] **FR-13.3**: Desenvolver Server Action `analyzeInterviewAction` para análise de áudio multimodal.

## 2. Requisitos Não-Funcionais (NFR)

### NFR-6: Responsividade & Imersão
- [x] **NFR-6.1**: Utilizar o protocolo de `StreamingFallback` da Fase 4.
- [x] **NFR-6.2**: Feedback hático visual (glitch) em falhas de uplink ou timeouts.

---
*Last updated: 2026-04-03 after Milestone 6.0 Completion*
