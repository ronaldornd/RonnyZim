# Testing & Quality: RonnyZim OS

Estratégias de validação e garantia de excelência.

## 1. Pirâmide de Testes (Visão 2026)
Embora as dependências de teste não estejam todas no `package.json` raiz, a estratégia é delegada ao **Antigravity Agent Kit**.
- **Unit Testing**: Focado em lógica de negócios (lib/utils) e validação de schemas (Zod).
- **Integration Testing**: Focado na conexão com o Supabase e Mock de APIs do Gemini.
- **E2E (Playwright)**: Essencial para validar fluxos de navegação No-Scroll e transições Framer Motion complexas.

## 2. Verificação de UI (Guidelines)
O projeto utiliza scripts Python especializados em `.agent/scripts/`:
- **`ux_audit.py`**: Automatiza a checagem de contraste, espaçamento e consistência Mystic-Cyber.
- **`accessibility_checker.py`**: Garante que os componentes sejam navegáveis via teclado, mesmo em layouts de alta densidade.
- **`performance_profiling.py`**: Mede a fluidez das animações Framer Motion, garantindo que não caiam abaixo de 60 FPS.

## 3. Workflow de Validação de Código
Antes de cada merge ou grande mudança:
1. `npm run lint`: Verificações estáticas básicas.
2. `python .agent/scripts/checklist.py .`: Verificação holística baseada no contexto do código.
3. Testes manuais do "Oráculo" para garantir que a personalidade do Agente não divergiu do esperado.

## 4. Testes de No-Scroll (Especializado)
- O Playwright deve verificar explicitamente se `scrollbar` não aparece em contêineres principais.
- Verificação de que o `layoutId` não gerou duplicatas de elementos visualmente (hydration bugs).
