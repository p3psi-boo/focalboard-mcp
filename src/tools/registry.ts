import type { FocalboardClient } from "../client/focalboard";

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export type ToolHandler = (client: FocalboardClient, args: Record<string, unknown>) => Promise<unknown>;

const definitions = new Map<string, ToolDefinition>();
const handlers = new Map<string, ToolHandler>();

export function registerTool(definition: ToolDefinition, handler: ToolHandler) {
  definitions.set(definition.name, definition);
  handlers.set(definition.name, handler);
}

export function getAllToolDefinitions(): ToolDefinition[] {
  return [...definitions.values()];
}

export function getToolHandler(name: string): ToolHandler {
  const handler = handlers.get(name);
  if (!handler) throw new Error(`Unknown tool: ${name}`);
  return handler;
}
