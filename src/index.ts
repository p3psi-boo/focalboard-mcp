import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { FocalboardClient } from "./client/focalboard";
import { getAllToolDefinitions, getToolHandler } from "./tools";
import { config } from "./config";
import { startHttpTransport } from "./transport/http";
import { startStdioTransport } from "./transport/stdio";

const client = new FocalboardClient({
  baseUrl: config.focalboard.baseUrl,
  apiPrefix: config.focalboard.apiPrefix,
  token: config.focalboard.token,
  csrfToken: config.focalboard.csrfToken,
  requestedWith: config.focalboard.requestedWith,
});

function createServer() {
  const server = new Server({ name: "focalboard-mcp", version: "1.0.0" }, { capabilities: { tools: {} } });

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: getAllToolDefinitions() }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args = {} } = req.params;
    try {
      const handler = getToolHandler(name);
      const result = await handler(client, args);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (e) {
      return { content: [{ type: "text", text: `Error: ${(e as Error).message}` }], isError: true };
    }
  });

  return server;
}

async function startupAuth() {
  const { password, loginId, username, authMode } = config.focalboard;
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
    await client.logout(config.focalboard.authMode);
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

if (config.transport.mode === "http") {
  await startHttpTransport(createServer, { port: config.transport.httpPort, path: config.transport.httpPath });
} else {
  await startStdioTransport(createServer());
}
