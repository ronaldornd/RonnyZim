# Phase 5 Context: Mastery Expansion - Hunter Board

Este documento define o contexto técnico para a ativação da inteligência de mercado no RonnyZim OS.

## 🎯 Objetivos Estratégicos
1. **Market Link**: Ativar a ponte entre a UI do Hunter Board e o servidor MCP `market-intelligence` (Tavily).
2. **Autonomous Search**: Permitir que o usuário dispare buscas de vagas por linguagem natural.
3. **Imersão Holográfica**: Aplicar os padrões de performance da Fase 4 (Streaming/Suspense) em uma lista de dados externa e volátil.
4. **Neural Fit**: Garantir que cada vaga encontrada passe por um escrutínio do Gemini antes de ser apresentada.

## 🛠️ Stack Técnica
- **Fetch**: Server Actions v16 para chamadas MCP.
- **Orchestration**: `market-intelligence` MCP Tool (`search_jobs`).
- **Intelligence**: Gemini 3.1 para `calculate_match_score`.
- **UI**: Framer Motion "Scanning" effects + Next.js Streaming.

## 💾 Persistência e Fluxo
1. **Trigger**: Usuário digita: "Procure vagas de Next.js sênior em SP".
2. **Action**: `searchJobsAction` invoca o MCP.
3. **Stream**: Vagas começam a aparecer na UI como esqueletos holográficos.
4. **Enrichment**: Para cada vaga no stream, um segundo processo (action) calcula o Match Score.
5. **Persistence**: Vagas com match > 70% são salvas automaticamente no `hunter_insights`.

## ⚠️ Riscos e Mitigações
- **Rate Limit Tavily**: Implementar queuing ou debouncing na UI.
- **Latência Gemini**: Utilizar `Streaming Server Components` para exibir os detalhes da vaga enquanto o score é processado.
- **UI Overflow**: Manter o dogma No-Scroll mesmo com 20+ resultados via paginação holográfica.

---
*Generated: 2026-04-03 para Operação Hunter*
