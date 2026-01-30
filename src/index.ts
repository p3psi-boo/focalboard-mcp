import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { FocalboardClient } from "./client/focalboard";
import { boardTools, handleBoardTool } from "./tools/boards";
import { blockTools, handleBlockTool } from "./tools/blocks";
import { combinedTools, handleCombinedTool } from "./tools/combined";

const client = new FocalboardClient({
  baseUrl: process.env.FOCALBOARD_URL || "http://localhost:8000",
  token: process.env.FOCALBOARD_TOKEN || "",
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

const transport = new StdioServerTransport();
server.connect(transport);
