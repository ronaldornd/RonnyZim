# GitHub Secrets - Configuração para CI/CD

Este documento descreve todos os secrets e variáveis necessárias para executar os workflows de CI/CD do repositório.

## 🔐 Como adicionar Secrets no GitHub

1. Acesse o repositório no GitHub
2. Vá para **Settings** → **Secrets and variables** → **Actions**
3. Clique em **New repository secret**
4. Adicione cada secret com seu nome e valor correspondente

---

## 📋 Secrets Obrigatórios (para Web App)

### Supabase
- **`NEXT_PUBLIC_SUPABASE_URL`**
  - Valor: `https://seu-projeto.supabase.co`
  - Origem: Supabase Project Settings → URL

- **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**
  - Valor: Sua chave anônima do Supabase
  - Origem: Supabase Project Settings → API Keys → `anon` key

- **`SUPABASE_SERVICE_ROLE_KEY`**
  - Valor: Sua chave de service role do Supabase
  - Origem: Supabase Project Settings → API Keys → `service_role` key
  - ⚠️ **CUIDADO**: Esta é uma chave sensível, guarde com segurança!

### AI Models
- **`GEMINI_API_KEY`**
  - Valor: Sua chave de API do Google Gemini
  - Origem: [Google AI Studio](https://aistudio.google.com/apikey)

- **`OPENAI_API_KEY`**
  - Valor: Sua chave de API do OpenAI
  - Origem: [OpenAI Platform](https://platform.openai.com/api-keys)

- **`ANTHROPIC_API_KEY`**
  - Valor: Sua chave de API do Anthropic
  - Origem: [Anthropic Console](https://console.anthropic.com)

---

## 📊 Variáveis de Repositório (Opcionais)

Você também pode adicionar **variáveis** (valores não-secretos) em **Settings** → **Secrets and variables** → **Variables**:

- **`NEXT_PUBLIC_DEFAULT_MODEL`**
  - Valor padrão: `gemini-2.0-flash`
  - Descrição: Modelo de IA padrão para CI
  - Tipo: Variável (não é secret)

---

## ✅ Checklist de Configuração

- [ ] Adicionei `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Adicionei `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Adicionei `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Adicionei `GEMINI_API_KEY`
- [ ] Adicionei `OPENAI_API_KEY`
- [ ] Adicionei `ANTHROPIC_API_KEY`
- [ ] (Opcional) Adicionei `NEXT_PUBLIC_DEFAULT_MODEL` como variável

---

## 🚀 Workflows Disponíveis

### 1. **ci-web.yml** (Next.js App)
- **Acionado**: Push e Pull Request para `main` e `develop`
- **Passos**:
  - ✅ Checkout do código
  - ✅ Setup Node.js 20
  - ✅ npm ci (install limpo)
  - ✅ npm run lint (ESLint)
  - ✅ npm run build (Next.js build com secrets de env)

### 2. **ci-mcp.yml** (MCP Servers)
- **Acionado**: Push e Pull Request para `main` e `develop`
- **Passos**:
  - ✅ Checkout do código
  - ✅ Setup Node.js 20
  - ✅ npm ci (install limpo)
  - ✅ npm run build (TypeScript compilation)

### 3. **ci-extension.yml** (Chrome Extension - Validação)
- **Acionado**: Push e Pull Request para `main` e `develop`
- **Passos**:
  - ✅ Validação do `manifest.json`
  - ✅ Verificação de arquivos obrigatórios
  - ✅ Linter básico (opcional)

---

## 🔍 Verificar Status dos Workflows

Você pode acompanhar o status dos workflows em:
- **GitHub**: Actions → Selecione o workflow
- **Status**: Cada push/PR mostrará o status de build

---

## 🛠️ Troubleshooting

### Build falha com "env var not set"
- Verifique se o secret foi adicionado corretamente
- Use o botão "Test" na página de secrets para validar

### "npm ci" falha
- Certifique-se de ter `package-lock.json` no repositório
- Atualize-o localmente: `npm install`

### Lint passa localmente mas falha no CI
- Execute `npm run lint` localmente para replicar
- Alguns erros podem ser ignorados com `continue-on-error: true` no YAML

---

## 📝 Notas

- Os secrets **nunca aparecem** nos logs do GitHub Actions (são mascarados)
- Cada secret é específico do repositório e não é herdado de forks
- Se precisar rotacionar uma chave, atualize o secret e os workflows usarão automaticamente a nova versão

