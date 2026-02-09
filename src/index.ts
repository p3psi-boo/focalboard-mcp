import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { FocalboardClient } from "./client/focalboard";
import { boardTools, handleBoardTool } from "./tools/boards";
import { blockTools, handleBlockTool } from "./tools/blocks";

const client = new FocalboardClient({
  baseUrl: process.env.FOCALBOARD_URL || "http://localhost:8000",
  apiPrefix: process.env.FOCALBOARD_API_PREFIX || "/api/v2",
  token: process.env.FOCALBOARD_TOKEN || "",
  csrfToken: process.env.FOCALBOARD_CSRF_TOKEN,
  requestedWith: process.env.FOCALBOARD_REQUESTED_WITH || "XMLHttpRequest",
});

function createServer() {
  const server = new Server({ name: "focalboard-mcp", version: "1.0.0" }, { capabilities: { tools: {} } });

  const allTools = [...boardTools, ...blockTools];
  const boardToolNames = new Set(boardTools.map(t => t.name));

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: allTools }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args = {} } = req.params;
    try {
      const result = boardToolNames.has(name)
        ? await handleBoardTool(client, name, args)
        : await handleBlockTool(client, name, args);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (e) {
      return { content: [{ type: "text", text: `Error: ${(e as Error).message}` }], isError: true };
    }
  });

  return server;
}

const authMode = (process.env.FOCALBOARD_AUTH_MODE as "auto" | "mattermost" | "focalboard" | undefined) || "auto";

async function startupAuth() {
  const password = process.env.FOCALBOARD_PASSWORD;
  const loginId = process.env.FOCALBOARD_LOGIN_ID;
  const username = process.env.FOCALBOARD_USERNAME;

  if (!password) return;
  if (!loginId && !username) {
    throw new Error("FOCALBOARD_PASSWORD is set but neither FOCALBOARD_LOGIN_ID nor FOCALBOARD_USERNAME is set");
  }

  await client.login({
    mode: authMode,
    loginId: loginId || undefined,
    username: username || undefined,
    password,
  });
}

let shuttingDown = false;
async function shutdown(reason: string) {
  if (shuttingDown) return;
  shuttingDown = true;

  try {
    await client.logout(authMode);
  } catch {
    // Best-effort logout; don't block shutdown.
  }

  if (reason === "SIGINT" || reason === "SIGTERM") {
    process.exit(0);
  }
}

process.on("SIGINT", () => { void shutdown("SIGINT"); });
process.on("SIGTERM", () => { void shutdown("SIGTERM"); });
process.on("beforeExit", () => { void shutdown("beforeExit"); });

await startupAuth();

const transportMode = process.env.MCP_TRANSPORT || "stdio";

if (transportMode === "http") {
  const { WebStandardStreamableHTTPServerTransport } = await import(
    "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"
  );

  const port = parseInt(process.env.MCP_HTTP_PORT || "3000", 10);
  const path = process.env.MCP_HTTP_PATH || "/mcp";

  const sessions = new Map<string, { server: Server; transport: InstanceType<typeof WebStandardStreamableHTTPServerTransport> }>();

  Bun.serve({
    port,
    routes: {
      [path]: {
        GET: async (req: Request) => {
          const sessionId = req.headers.get("mcp-session-id");
          if (!sessionId || !sessions.has(sessionId)) {
            return new Response("Session not found", { status: 400 });
          }
          const session = sessions.get(sessionId)!;
          return session.transport.handleRequest(req);
        },
        POST: async (req: Request) => {
          const body = await req.json() as Record<string, unknown> | Record<string, unknown>[];
          const isInitialize = Array.isArray(body)
            ? body.some((m) => m.method === "initialize")
            : body.method === "initialize";

          if (isInitialize) {
            const transport = new WebStandardStreamableHTTPServerTransport({
              sessionIdGenerator: () => crypto.randomUUID(),
              onsessioninitialized: (sessionId: string) => {
                sessions.set(sessionId, { server, transport });
              },
            });

            transport.onclose = () => {
              if (transport.sessionId) {
                sessions.delete(transport.sessionId);
              }
            };

            const server = createServer();
            await server.connect(transport);

            return transport.handleRequest(req, { parsedBody: body });
          }

          const sessionId = req.headers.get("mcp-session-id");
          if (!sessionId || !sessions.has(sessionId)) {
            return new Response(
              JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message: "Session not found. Send an initialize request first." }, id: null }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }
          const session = sessions.get(sessionId)!;
          return session.transport.handleRequest(req, { parsedBody: body });
        },
        DELETE: async (req: Request) => {
          const sessionId = req.headers.get("mcp-session-id");
          if (!sessionId || !sessions.has(sessionId)) {
            return new Response("Session not found", { status: 404 });
          }
          const session = sessions.get(sessionId)!;
          const response = await session.transport.handleRequest(req);
          sessions.delete(sessionId);
          return response;
        },
      },
    },
    fetch(req) {
      return new Response("Not Found", { status: 404 });
    },
  });

  console.log(`MCP HTTP Streamable server listening on http://localhost:${port}${path}`);
} else {
  const { StdioServerTransport } = await import("@modelcontextprotocol/sdk/server/stdio.js");
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
