import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../../web/.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const server = new Server(
  {
    name: "memory-guardian",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Schema para restrição de chaves no upsert
const ALLOWED_FACT_KEYS = ["xp_total", "biorhythm_data", "skills", "active_quests"];

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "read_user_facts",
        description: "Lê fatos e metadados de um usuário específico do RonnyZim OS.",
        inputSchema: {
          type: "object",
          properties: {
            userId: { type: "string", description: "UUID do usuário no Supabase" },
          },
          required: ["userId"],
        },
      },
      {
        name: "upsert_user_fact",
        description: "Atualiza ou insere um fato/metadado para o usuário. Restrito a chaves de sistema e progresso.",
        inputSchema: {
          type: "object",
          properties: {
            userId: { type: "string", description: "UUID do usuário" },
            key: { 
              type: "string", 
              description: "Chave do fato (ex: xp_total, skills, biorhythm_data)",
              enum: ALLOWED_FACT_KEYS
            },
            value: { type: "object", description: "Valor JSON do fato" },
          },
          required: ["userId", "key", "value"],
        },
      },
      {
        name: "list_dossiers",
        description: "Lista os dossiês de alvos (targets) pendentes ou ativos para o caçador.",
        inputSchema: {
          type: "object",
          properties: {
            userId: { type: "string", description: "UUID do usuário" },
          },
          required: ["userId"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "read_user_facts": {
        const { userId } = args as { userId: string };
        const { data, error } = await supabase
          .from("user_facts")
          .select("*")
          .eq("user_id", userId);

        if (error) throw error;
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }

      case "upsert_user_fact": {
        const { userId, key, value } = args as { userId: string; key: string; value: any };

        // Validação de Segurança (P0)
        if (!ALLOWED_FACT_KEYS.includes(key)) {
          return {
            content: [{ type: "text", text: `Error: Key '${key}' is forbidden. Access denied.` }],
            isError: true,
          };
        }

        // Transação lógica devido à falta de Unique constraint composto (user_id, property_key)
        const { data: existing, error: selectError } = await supabase
          .from("user_facts")
          .select("id")
          .eq("user_id", userId)
          .eq("property_key", key);

        if (selectError) throw selectError;

        const stringifiedValue = typeof value === "object" ? JSON.stringify(value) : String(value);

        let resultData, actionError;

        if (existing && existing.length > 0) {
          const { data, error } = await supabase
            .from("user_facts")
            .update({
              category: "system",
              value: stringifiedValue
            })
            .eq("id", existing[0].id)
            .select();
          resultData = data;
          actionError = error;
        } else {
          const { data, error } = await supabase
            .from("user_facts")
            .insert({
              user_id: userId,
              category: "system",
              property_key: key,
              value: stringifiedValue
            })
            .select();
          resultData = data;
          actionError = error;
        }

        if (actionError) throw actionError;
        return { content: [{ type: "text", text: `Fact '${key}' updated successfully for user ${userId}.` }] };
      }

      case "list_dossiers": {
        const { userId } = args as { userId: string };
        const { data, error } = await supabase
          .from("dossiers")
          .select("*, jobs!inner(user_id)")
          .eq("jobs.user_id", userId);

        if (error) throw error;
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }

      default:
        throw new Error(`Tool not found: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Memory Guardian MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
