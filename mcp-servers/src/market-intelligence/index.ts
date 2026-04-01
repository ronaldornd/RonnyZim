import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../../web/.env.local") });

// Tavily API configurations
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

const server = new Server(
  {
    name: "market-intelligence",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search_jobs",
        description: "Busca vagas de emprego e inteligência de mercado usando Tavily Search API.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Termo de busca (ex: Senior React Dev Brazil)" },
            days: { type: "number", description: "Filtrar por dias atrás (padrão 7)", default: 7 },
          },
          required: ["query"],
        },
      },
      {
        name: "extract_content",
        description: "Extrai o conteúdo principal (como JD e requisitos) de uma URL de vaga de emprego.",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string", description: "URL da vaga para extrair conteúdo" },
          },
          required: ["url"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!TAVILY_API_KEY) {
    return {
      content: [{ type: "text", text: "Error: TAVILY_API_KEY is not set in environment." }],
      isError: true,
    };
  }

  try {
    switch (name) {
      case "search_jobs": {
        const { query, days } = args as { query: string; days?: number };
        
        const response = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: TAVILY_API_KEY,
            query: `${query} jobs last ${days || 7} days`,
            search_depth: "advanced",
            include_answer: true,
            max_results: 5
          })
        });

        const data = await response.json();
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }

      case "extract_content": {
        const { url } = args as { url: string };
        
        const response = await fetch("https://api.tavily.com/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: TAVILY_API_KEY,
            urls: [url]
          })
        });

        const data = await response.json();
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }

      default:
        throw new Error(`Tool not found: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [{ type: "text", text: `Error connecting to Tavily: ${error.message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Market Intelligence MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
