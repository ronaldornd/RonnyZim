# Auditoria de SEO & Core Web Vitals: RonnyZim OS

## 🎯 Objetivo
Analisar a arquitetura atual do **RonnyZim OS** (Next.js 16 App Router) para garantir que a interface "No-Scroll" seja amigável aos motores de busca e acessível, sem comprometer o dogma visual de imersão total.

---

## 🔍 Análise da Arquitetura Atual

### 1. Indexação do "No-Scroll" Shell
- **Status Atual:** O sistema utiliza um `DesktopShell` fixo com `overflow-hidden` no `body`. A navegação entre apps (HunterBoard, AstroDash, etc.) é feita via estado React (`activeApp`), o que significa que o Google vê apenas uma URL (`/`).
- **Ponto Cego:** Crawlers podem ignorar conteúdo "escondido" ou falhar em entender a hierarquia das ferramentas se não houver mudanças de rota reais ou metadados de suporte.
- **Risco:** Baixa densidade de palavras-chave contextuais para ferramentas específicas.

### 2. Metadados Dinâmicos (SSR)
- **Status Atual:** `layout.tsx` possui metadados estáticos globais.
- **Ponto Cego:** Views profundas como o "Dossiê do Alvo" ou "Mural do Caçador" não alteram o título da página ou a descrição nas redes sociais (OpenGraph).

### 3. Semântica HTML5
- **Status Atual:** Predominância de `<div>`.
- **Ponto Cego:** Falta de marcos semânticos (`<main>`, `<nav>`, `<section>`, `<article>`). Isso prejudica tanto o SEO quanto o Screen Reading (Acessibilidade).

---

## 🚀 Plano de Implementação Tática

### Fase A: Estruturação Semântica (Acessibilidade + SEO)
- [ ] **Refatorar DesktopShell:** Substituir `div` externo por `<main id="os-root">`.
- [ ] **Abas Dinâmicas:** Usar `<nav>` para a barra de tarefas e `<article>` para cada janela de aplicativo.
- [ ] **Hierarquia de Títulos:** Garantir um único `<h1>` por contexto (mesmo que oculto visualmente para manter o design).

### Fase B: Metadados Dinâmicos (Next.js Native)
- [ ] **Implementar `generateMetadata`:** Criar lógica para injetar metadados baseados no estado atual do OS (ex: "RonnyZim OS | Hunter Board").
- [ ] **OpenGraph/Twitter Cards:** Configurar imagens dinâmicas para compartilhamento de conquistas e XP.

### Fase C: Semântica Estruturada (JSON-LD)
- [ ] **Schema `SoftwareApplication`:** Identificar o OS como uma aplicação web inteligência.
- [ ] **Schema `Person` / `ProfilePage`:** Para a "Matrix de Identidade", vinculando a Aura Técnica à entidade do usuário.
- [ ] **Custom Schemas:** Traduzir "XP" e "Quests" em `Achievement` ou `CreativeWork`.

---

## 📈 Core Web Vitals (Performance)
- **LCP (Largest Contentful Paint):** Atualmente otimizado pelo Next.js Image e fontes locais.
- **CLS (Cumulative Layout Shift):** O uso de `layoutId` do Framer Motion mitigou shifts, mas as animações de entrada das janelas precisam ser auditadas para não disparar re-layouts pesados.

---

## 🛠️ Próximos Passos
1. Criar o arquivo de plano de implementação `SEO_IMPLEMENTATION.md`.
2. Ajustar `layout.tsx` para exportar metadados dinâmicos.
3. Injetar scripts de JSON-LD no root layout.
