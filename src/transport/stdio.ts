import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

export async function startStdioTransport(server: Server) {
  const { StdioServerTransport } = await import("@modelcontextprotocol/sdk/server/stdio.js");
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
