/**
 * Implementation Examples - Board & Block Tools
 * Reference implementation patterns for MCP tool handlers
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { BoardSchema, BlockSchema } from "./types";

// ============================================================================
// HTTP CLIENT SETUP
// ============================================================================

interface FocalboardConfig {
  baseUrl: string;
  apiToken: string;
}

class FocalboardClient {
  constructor(private config: FocalboardConfig) {}

  async request<T>(method: string, path: string, body?: any): Promise<T> {
    const url = `${this.config.baseUrl}/api/v2${path}`;
    const response = await fetch(url, {
      method,
      headers: {
        "Authorization": `Bearer ${this.config.apiToken}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json() as { error?: string };
      throw new Error(`API Error: ${error.error || response.statusText}`);
    }

    return response.json() as Promise<T>;
  }
}

// ============================================================================
// EXAMPLE: CREATE BOARD TOOL HANDLER
// ============================================================================

async function handleCreateBoard(client: FocalboardClient, args: any) {
  // Validate input with Zod
  const input = z.object({
    teamId: z.string(),
    title: z.string(),
    description: z.string().optional(),
    icon: z.string().optional(),
    type: z.string().optional(),
  }).parse(args);

  // Make API request
  const board = await client.request("POST", "/boards", {
    teamId: input.teamId,
    title: input.title,
    description: input.description,
    icon: input.icon,
    type: input.type || "board",
  });

  // Validate response
  const validatedBoard = BoardSchema.parse(board);

  return {
    content: [
      {
        type: "text",
        text: `Board created successfully: ${validatedBoard.title} (ID: ${validatedBoard.id})`,
      },
    ],
  };
}

// ============================================================================
// EXAMPLE: GET BLOCKS TOOL HANDLER
// ============================================================================

async function handleGetBlocks(client: FocalboardClient, args: any) {
  const input = z.object({
    boardId: z.string(),
    parentId: z.string().optional(),
    type: z.string().optional(),
  }).parse(args);

  // Build query string
  const params = new URLSearchParams();
  if (input.parentId) params.set("parent_id", input.parentId);
  if (input.type) params.set("type", input.type);
  
  const query = params.toString() ? `?${params.toString()}` : "";
  const path = `/boards/${input.boardId}/blocks${query}`;

  // Make API request
  const blocks = await client.request<any[]>("GET", path);

  // Validate response
  const validatedBlocks = z.array(BlockSchema).parse(blocks);

  return {
    content: [
      {
        type: "text",
        text: `Found ${validatedBlocks.length} blocks`,
      },
      {
        type: "text",
        text: JSON.stringify(validatedBlocks, null, 2),
      },
    ],
  };
}

// ============================================================================
// EXAMPLE: BATCH OPERATIONS
// ============================================================================

async function handlePatchBlocksBatch(client: FocalboardClient, args: any) {
  const input = z.object({
    boardId: z.string(),
    blockIds: z.array(z.string()),
    blockPatches: z.array(z.object({
      title: z.string().optional(),
      fields: z.record(z.string(), z.any()).optional(),
    })),
    disableNotify: z.boolean().optional(),
  }).parse(args);

  // Validate arrays match
  if (input.blockIds.length !== input.blockPatches.length) {
    throw new Error("blockIds and blockPatches must have same length");
  }

  const query = input.disableNotify ? "?disable_notify=true" : "";
  const path = `/boards/${input.boardId}/blocks/${query}`;

  await client.request("PATCH", path, {
    blockIds: input.blockIds,
    blockPatches: input.blockPatches,
  });

  return {
    content: [
      {
        type: "text",
        text: `Successfully updated ${input.blockIds.length} blocks`,
      },
    ],
  };
}

// ============================================================================
// MCP SERVER REGISTRATION
// ============================================================================

export function registerBoardAndBlockTools(server: Server, client: FocalboardClient) {
  // Register tool list
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "create_board",
        description: "Creates a new board in Focalboard",
        inputSchema: {
          type: "object",
          properties: {
            teamId: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            icon: { type: "string" },
            type: { type: "string" },
          },
          required: ["teamId", "title"],
        },
      },
      {
        name: "get_blocks",
        description: "Retrieves blocks from a board",
        inputSchema: {
          type: "object",
          properties: {
            boardId: { type: "string" },
            parentId: { type: "string" },
            type: { type: "string" },
          },
          required: ["boardId"],
        },
      },
      // ... register all 21 tools
    ],
  }));

  // Register tool handlers
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case "create_board":
          return await handleCreateBoard(client, args);
        
        case "get_blocks":
          return await handleGetBlocks(client, args);
        
        case "patch_blocks_batch":
          return await handlePatchBlocksBatch(client, args);
        
        // ... handle all 21 tools
        
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  });
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/*
const server = new Server({
  name: "focalboard-mcp",
  version: "1.0.0",
}, {
  capabilities: {
    tools: {},
  },
});

const client = new FocalboardClient({
  baseUrl: "https://focalboard.example.com",
  apiToken: process.env.FOCALBOARD_TOKEN!,
});

registerBoardAndBlockTools(server, client);

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
*/
