import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { FocalboardClient } from "./client/focalboard";
import { boardTools, handleBoardTool } from "./tools/boards";
import { blockTools, handleBlockTool } from "./tools/blocks";
import { combinedTools, handleCombinedTool } from "./tools/combined";

const client = new FocalboardClient({
  baseUrl: process.env.FOCALBOARD_URL || "http://localhost:8000",
  apiPrefix: process.env.FOCALBOARD_API_PREFIX || "/api/v2",
  token: process.env.FOCALBOARD_TOKEN || "",
  csrfToken: process.env.FOCALBOARD_CSRF_TOKEN,
  requestedWith: process.env.FOCALBOARD_REQUESTED_WITH || "XMLHttpRequest",
});

const server = new Server({ name: "focalboard-mcp", version: "1.0.0" }, { capabilities: { tools: {} } });

const allTools = [...boardTools, ...blockTools, ...combinedTools];
const boardToolNames = new Set(boardTools.map(t => t.name));
const blockToolNames = new Set(blockTools.map(t => t.name));

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: allTools }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args = {} } = req.params;
  try {
    let result: unknown;
    if (boardToolNames.has(name)) result = await handleBoardTool(client, name, args);
    else if (blockToolNames.has(name)) result = await handleBlockTool(client, name, args);
    else result = await handleCombinedTool(client, name, args);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  } catch (e) {
    return { content: [{ type: "text", text: `Error: ${(e as Error).message}` }], isError: true };
  }
});

const authMode = (process.env.FOCALBOARD_AUTH_MODE as "auto" | "mattermost" | "focalboard" | undefined) || "auto";

async function startupAuth() {
  const password = process.env.FOCALBOARD_PASSWORD;
  const loginId = process.env.FOCALBOARD_LOGIN_ID;
  const username = process.env.FOCALBOARD_USERNAME;

  // Only auto-login when explicit credentials are provided.
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

  // Ensure we terminate on signals.
  if (reason === "SIGINT" || reason === "SIGTERM") {
    process.exit(0);
  }
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});
process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
process.on("beforeExit", () => {
  void shutdown("beforeExit");
});

await startupAuth();

const transport = new StdioServerTransport();
await server.connect(transport);
