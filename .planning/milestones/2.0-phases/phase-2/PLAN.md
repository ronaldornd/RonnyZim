# PLAN: Phase 2 - Intelligence Bridge (MCP)

Este plano detalha a implementação de dois servidores MCP (Model Context Protocol) locais para expandir as capacidades cognitivas do RonnyZim OS.

## 🎯 Objetivo
Estabelecer uma ponte de comunicação via `StdioServerTransport` que permita à IA gerenciar a memória do usuário (Supabase) e buscar inteligência de mercado em tempo real (Tavily).

---

<task name="Infraestrutura Base MCP" id="mcp_base">
    <action>
        1. Criar diretório raiz `/mcp-servers` para isolar os serviços Node.js.
        2. Inicializar um projeto TypeScript compartilhado (ou pacotes individuais) com as dependências:
           - `@modelcontextprotocol/sdk`
           - `zod`
           - `dotenv`
        3. Configurar `tsconfig.json` para saída ESM (necessário para o SDK MCP moderno).
        4. Configurar logs para serem direcionados estritamente para `stderr` conforme o protocolo Stdio.
    </action>
    <verify>
        - Verificação de compilação via `tsc`.
        - Existência do arquivo `package.json` com `@modelcontextprotocol/sdk` >= 1.0.0.
    </verify>
</task>

<task name="Memory Guardian (Supabase Tools)" id="mcp_memory">
    <action>
        1. Criar o servidor `memory-guardian` no transporte Stdio.
        2. Implementar ferramentas (Tools):
           - `read_user_facts`: Query na tabela `user_facts` filtrando por `user_id`.
           - `upsert_user_fact`: Permissão estrita para chaves: [`xp_total`, `biorhythm_data`, `skills`, `active_quests`]. 
             ⚠️ **Bloqueio Crítico**: Proibir qualquer alteração em `id`, `email`, ou dados de autenticação.
           - `list_dossiers`: Listar metadados da tabela `dossiers`.
        3. Integrar `@supabase/supabase-js`.
    </action>
    <verify>
        - Teste de conexão: `node dist/memory-guardian/index.js` deve inicializar e ouvir Stdio.
        - Verificação de erro ao tentar `upsert` em chaves proibidas (ex: `email`).
    </verify>
</task>

<task name="Market Intelligence (Tavily Tools)" id="mcp_market">
    <action>
        1. Criar o servidor `market-intelligence` no transporte Stdio.
        2. Implementar ferramentas (Tools):
           - `search_jobs`: Wrapper para a API da Tavily com foco em tech jobs.
           - `extract_content`: Converte URLs de vagas em Markdown limpo.
    </action>
    <verify>
        - Verificação da ferramenta `extract_content` retornando Markdown válido via `mcp-inspector`.
    </verify>
</task>

<task name="Orquestração & Lifecycle" id="mcp_orch">
    <action>
        1. Adicionar scripts no `package.json` raiz:
           - `mcp:build`: Compila todos os servidores.
           - `mcp:dev`: Inicia os servidores em modo desenvolvimento.
    </action>
    <verify>
        - `npm run mcp:build` finaliza sem erros de tipos ou dependências.
    </verify>
</task>

---

<done>
    ### Testes de Verificação de Conexão (UAT)
    1. **Handshake Protocol**: Executar o servidor e enviar um `initialize` request via JSON-RPC. Sucesso se retornar `capabilities`.
    2. **Security Gate Audit**: Tentar forçar um `upsert` no campo `email` e garantir que o servidor retorne um erro amigável "Forbidden Key".
    3. **Tool Discovery**: Chamar `listTools`. Sucesso se `read_user_facts` e `search_jobs` estiverem presentes.
</done>
