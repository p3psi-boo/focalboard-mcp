import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

interface HttpTransportConfig {
  port: number;
  path: string;
}

export async function startHttpTransport(createServer: () => Server, config: HttpTransportConfig) {
  const { WebStandardStreamableHTTPServerTransport } = await import(
    "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"
  );

  const sessions = new Map<string, { server: Server; transport: InstanceType<typeof WebStandardStreamableHTTPServerTransport> }>();

  Bun.serve({
    port: config.port,
    routes: {
      [config.path]: {
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

  console.log(`MCP HTTP Streamable server listening on http://localhost:${config.port}${config.path}`);
}
