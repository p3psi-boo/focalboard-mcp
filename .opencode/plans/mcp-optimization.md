# Focalboard MCP Server Optimization Plan

## Overview

基于 `refs/mattermost-plugin-boards` 的接口定义，重构 MCP 服务器，按业务划分模块。

## Target Architecture

```
src/
├── index.ts              # MCP 服务器入口
├── client/
│   └── focalboard.ts     # HTTP 客户端
├── types/
│   ├── index.ts          # 类型导出
│   ├── board.ts          # Board 相关类型
│   ├── block.ts          # Block 相关类型
│   └── common.ts         # 通用类型
└── tools/
    ├── index.ts          # 工具注册
    ├── boards.ts         # Board 工具 (6)
    ├── blocks.ts         # Block 工具 (4)
    └── combined.ts       # Combined 工具 (2)
```

## Core Tools (12)

### Board Tools (6)
| Tool | Method | Endpoint | Description |
|------|--------|----------|-------------|
| `create_board` | POST | `/api/v2/boards` | 创建看板 |
| `get_board` | GET | `/api/v2/boards/{id}` | 获取看板详情 |
| `update_board` | PATCH | `/api/v2/boards/{id}` | 更新看板 |
| `delete_board` | DELETE | `/api/v2/boards/{id}` | 删除看板 |
| `list_boards` | GET | `/api/v2/teams/{teamId}/boards` | 列出团队看板 |
| `search_boards` | GET | `/api/v2/teams/{teamId}/boards/search?q=` | 搜索看板 |

### Block Tools (4)
| Tool | Method | Endpoint | Description |
|------|--------|----------|-------------|
| `create_blocks` | POST | `/api/v2/boards/{id}/blocks` | 批量创建块 |
| `get_blocks` | GET | `/api/v2/boards/{id}/blocks` | 获取块列表 |
| `update_block` | PATCH | `/api/v2/boards/{id}/blocks/{blockId}` | 更新块 |
| `delete_block` | DELETE | `/api/v2/boards/{id}/blocks/{blockId}` | 删除块 |

### Combined Tools (2)
| Tool | Method | Endpoint | Description |
|------|--------|----------|-------------|
| `insert_boards_and_blocks` | POST | `/api/v2/boards-and-blocks` | 原子创建 |
| `patch_boards_and_blocks` | PATCH | `/api/v2/boards-and-blocks` | 原子更新 |

---

## Implementation Details

### 1. Types - `src/types/common.ts`

```typescript
import { z } from "zod";

export const PropertyOptionSchema = z.object({
  id: z.string(),
  value: z.string(),
  color: z.string().optional(),
});

export const PropertyTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["text", "number", "select", "multiSelect", "date", "person", "checkbox", "url", "email", "phone", "createdTime", "createdBy", "updatedTime", "updatedBy"]),
  options: z.array(PropertyOptionSchema).optional(),
});

export const ErrorResponseSchema = z.object({
  error: z.string(),
  errorCode: z.number().optional(),
});

export interface FocalboardConfig {
  baseUrl: string;
  token: string;
}

export type PropertyOption = z.infer<typeof PropertyOptionSchema>;
export type PropertyTemplate = z.infer<typeof PropertyTemplateSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
```

### 2. Types - `src/types/board.ts`

```typescript
import { z } from "zod";
import { PropertyTemplateSchema } from "./common";

export const BoardSchema = z.object({
  id: z.string(),
  teamId: z.string(),
  channelId: z.string().optional(),
  createdBy: z.string().optional(),
  modifiedBy: z.string().optional(),
  type: z.enum(["O", "P"]), // Open or Private
  minimumRole: z.enum(["admin", "editor", "commenter", "viewer"]).optional(),
  title: z.string(),
  description: z.string().optional(),
  icon: z.string().optional(),
  showDescription: z.boolean().optional(),
  isTemplate: z.boolean().optional(),
  templateVersion: z.number().optional(),
  properties: z.record(z.any()).optional(),
  cardProperties: z.array(PropertyTemplateSchema).optional(),
  createAt: z.number().optional(),
  updateAt: z.number().optional(),
  deleteAt: z.number().optional(),
});

export const BoardPatchSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  showDescription: z.boolean().optional(),
  type: z.enum(["O", "P"]).optional(),
  minimumRole: z.enum(["admin", "editor", "commenter", "viewer"]).optional(),
  channelId: z.string().optional(),
  cardProperties: z.array(PropertyTemplateSchema).optional(),
  updatedProperties: z.record(z.any()).optional(),
  deletedProperties: z.array(z.string()).optional(),
  updatedCardProperties: z.array(PropertyTemplateSchema).optional(),
  deletedCardProperties: z.array(z.string()).optional(),
});

export const CreateBoardSchema = z.object({
  teamId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  icon: z.string().optional(),
  type: z.enum(["O", "P"]).default("P"),
  cardProperties: z.array(PropertyTemplateSchema).optional(),
});

export type Board = z.infer<typeof BoardSchema>;
export type BoardPatch = z.infer<typeof BoardPatchSchema>;
export type CreateBoard = z.infer<typeof CreateBoardSchema>;
```

### 3. Types - `src/types/block.ts`

```typescript
import { z } from "zod";

export const BlockTypeSchema = z.enum([
  "text", "image", "divider", "checkbox", "h1", "h2", "h3",
  "list-item", "attachment", "quote", "video", "card", "view", "comment"
]);

export const BlockSchema = z.object({
  id: z.string(),
  boardId: z.string(),
  parentId: z.string().optional(),
  createdBy: z.string().optional(),
  modifiedBy: z.string().optional(),
  schema: z.number().optional(),
  type: BlockTypeSchema,
  title: z.string().optional(),
  fields: z.record(z.any()).optional(),
  createAt: z.number().optional(),
  updateAt: z.number().optional(),
  deleteAt: z.number().optional(),
});

export const BlockPatchSchema = z.object({
  title: z.string().optional(),
  parentId: z.string().optional(),
  schema: z.number().optional(),
  type: BlockTypeSchema.optional(),
  updatedFields: z.record(z.any()).optional(),
  deletedFields: z.array(z.string()).optional(),
});

export const CreateBlockSchema = z.object({
  boardId: z.string(),
  parentId: z.string().optional(),
  type: BlockTypeSchema,
  title: z.string().optional(),
  fields: z.record(z.any()).optional(),
});

export type BlockType = z.infer<typeof BlockTypeSchema>;
export type Block = z.infer<typeof BlockSchema>;
export type BlockPatch = z.infer<typeof BlockPatchSchema>;
export type CreateBlock = z.infer<typeof CreateBlockSchema>;
```

### 4. HTTP Client - `src/client/focalboard.ts`

```typescript
import type { FocalboardConfig } from "../types/common";
import type { Board, BoardPatch, CreateBoard } from "../types/board";
import type { Block, BlockPatch, CreateBlock } from "../types/block";

export class FocalboardClient {
  constructor(private config: FocalboardConfig) {}

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.config.baseUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  }

  // Board operations
  createBoard = (data: CreateBoard) => this.request<Board>("POST", "/api/v2/boards", data);
  getBoard = (id: string) => this.request<Board>("GET", `/api/v2/boards/${id}`);
  updateBoard = (id: string, patch: BoardPatch) => this.request<Board>("PATCH", `/api/v2/boards/${id}`, patch);
  deleteBoard = (id: string) => this.request<void>("DELETE", `/api/v2/boards/${id}`);
  listBoards = (teamId: string) => this.request<Board[]>("GET", `/api/v2/teams/${teamId}/boards`);
  searchBoards = (teamId: string, q: string) => this.request<Board[]>("GET", `/api/v2/teams/${teamId}/boards/search?q=${encodeURIComponent(q)}`);

  // Block operations
  createBlocks = (boardId: string, blocks: CreateBlock[], disableNotify = false) =>
    this.request<Block[]>("POST", `/api/v2/boards/${boardId}/blocks?disable_notify=${disableNotify}`, blocks);
  getBlocks = (boardId: string, parentId?: string, type?: string) => {
    const params = new URLSearchParams();
    if (parentId) params.set("parent_id", parentId);
    if (type) params.set("type", type);
    return this.request<Block[]>("GET", `/api/v2/boards/${boardId}/blocks?${params}`);
  };
  updateBlock = (boardId: string, blockId: string, patch: BlockPatch, disableNotify = false) =>
    this.request<Block>("PATCH", `/api/v2/boards/${boardId}/blocks/${blockId}?disable_notify=${disableNotify}`, patch);
  deleteBlock = (boardId: string, blockId: string, disableNotify = false) =>
    this.request<void>("DELETE", `/api/v2/boards/${boardId}/blocks/${blockId}?disable_notify=${disableNotify}`);

  // Combined operations
  insertBoardsAndBlocks = (boards: CreateBoard[], blocks: CreateBlock[]) =>
    this.request<{ boards: Board[]; blocks: Block[] }>("POST", "/api/v2/boards-and-blocks", { boards, blocks });
  patchBoardsAndBlocks = (boardIDs: string[], boardPatches: BoardPatch[], blockIDs: string[], blockPatches: BlockPatch[]) =>
    this.request<{ boards: Board[]; blocks: Block[] }>("PATCH", "/api/v2/boards-and-blocks", { boardIDs, boardPatches, blockIDs, blockPatches });
}
```

### 5. Board Tools - `src/tools/boards.ts`

```typescript
import { z } from "zod";
import type { FocalboardClient } from "../client/focalboard";
import { CreateBoardSchema, BoardPatchSchema } from "../types/board";

export const boardTools = [
  {
    name: "create_board",
    description: "Create a new board in a team",
    inputSchema: { type: "object", properties: {
      teamId: { type: "string", description: "Team ID" },
      title: { type: "string", description: "Board title" },
      description: { type: "string", description: "Board description" },
      icon: { type: "string", description: "Board icon emoji" },
      type: { type: "string", enum: ["O", "P"], default: "P", description: "O=Open, P=Private" },
    }, required: ["teamId", "title"] },
  },
  {
    name: "get_board",
    description: "Get board details by ID",
    inputSchema: { type: "object", properties: { boardId: { type: "string" } }, required: ["boardId"] },
  },
  {
    name: "update_board",
    description: "Update board properties",
    inputSchema: { type: "object", properties: {
      boardId: { type: "string" },
      title: { type: "string" },
      description: { type: "string" },
      icon: { type: "string" },
      type: { type: "string", enum: ["O", "P"] },
    }, required: ["boardId"] },
  },
  {
    name: "delete_board",
    description: "Delete a board",
    inputSchema: { type: "object", properties: { boardId: { type: "string" } }, required: ["boardId"] },
  },
  {
    name: "list_boards",
    description: "List all boards in a team",
    inputSchema: { type: "object", properties: { teamId: { type: "string" } }, required: ["teamId"] },
  },
  {
    name: "search_boards",
    description: "Search boards by title",
    inputSchema: { type: "object", properties: {
      teamId: { type: "string" },
      query: { type: "string", description: "Search query" },
    }, required: ["teamId", "query"] },
  },
];

export async function handleBoardTool(client: FocalboardClient, name: string, args: Record<string, unknown>) {
  switch (name) {
    case "create_board": return client.createBoard(CreateBoardSchema.parse(args));
    case "get_board": return client.getBoard(args.boardId as string);
    case "update_board": return client.updateBoard(args.boardId as string, BoardPatchSchema.parse(args));
    case "delete_board": return client.deleteBoard(args.boardId as string);
    case "list_boards": return client.listBoards(args.teamId as string);
    case "search_boards": return client.searchBoards(args.teamId as string, args.query as string);
    default: throw new Error(`Unknown board tool: ${name}`);
  }
}
```

### 6. Block Tools - `src/tools/blocks.ts`

```typescript
import type { FocalboardClient } from "../client/focalboard";
import { CreateBlockSchema, BlockPatchSchema } from "../types/block";

export const blockTools = [
  {
    name: "create_blocks",
    description: "Create blocks in a board",
    inputSchema: { type: "object", properties: {
      boardId: { type: "string" },
      blocks: { type: "array", items: { type: "object" }, description: "Array of blocks to create" },
      disableNotify: { type: "boolean", default: false },
    }, required: ["boardId", "blocks"] },
  },
  {
    name: "get_blocks",
    description: "Get blocks from a board",
    inputSchema: { type: "object", properties: {
      boardId: { type: "string" },
      parentId: { type: "string", description: "Filter by parent block ID" },
      type: { type: "string", description: "Filter by block type" },
    }, required: ["boardId"] },
  },
  {
    name: "update_block",
    description: "Update a block",
    inputSchema: { type: "object", properties: {
      boardId: { type: "string" },
      blockId: { type: "string" },
      title: { type: "string" },
      updatedFields: { type: "object" },
      deletedFields: { type: "array", items: { type: "string" } },
      disableNotify: { type: "boolean", default: false },
    }, required: ["boardId", "blockId"] },
  },
  {
    name: "delete_block",
    description: "Delete a block",
    inputSchema: { type: "object", properties: {
      boardId: { type: "string" },
      blockId: { type: "string" },
      disableNotify: { type: "boolean", default: false },
    }, required: ["boardId", "blockId"] },
  },
];

export async function handleBlockTool(client: FocalboardClient, name: string, args: Record<string, unknown>) {
  const disableNotify = (args.disableNotify as boolean) ?? false;
  switch (name) {
    case "create_blocks":
      return client.createBlocks(args.boardId as string, (args.blocks as any[]).map(b => CreateBlockSchema.parse(b)), disableNotify);
    case "get_blocks":
      return client.getBlocks(args.boardId as string, args.parentId as string | undefined, args.type as string | undefined);
    case "update_block":
      return client.updateBlock(args.boardId as string, args.blockId as string, BlockPatchSchema.parse(args), disableNotify);
    case "delete_block":
      return client.deleteBlock(args.boardId as string, args.blockId as string, disableNotify);
    default: throw new Error(`Unknown block tool: ${name}`);
  }
}
```

### 7. Combined Tools - `src/tools/combined.ts`

```typescript
import type { FocalboardClient } from "../client/focalboard";
import { CreateBoardSchema, BoardPatchSchema } from "../types/board";
import { CreateBlockSchema, BlockPatchSchema } from "../types/block";

export const combinedTools = [
  {
    name: "insert_boards_and_blocks",
    description: "Atomically create boards and blocks together",
    inputSchema: { type: "object", properties: {
      boards: { type: "array", items: { type: "object" } },
      blocks: { type: "array", items: { type: "object" } },
    }, required: ["boards", "blocks"] },
  },
  {
    name: "patch_boards_and_blocks",
    description: "Atomically update boards and blocks together",
    inputSchema: { type: "object", properties: {
      boardIDs: { type: "array", items: { type: "string" } },
      boardPatches: { type: "array", items: { type: "object" } },
      blockIDs: { type: "array", items: { type: "string" } },
      blockPatches: { type: "array", items: { type: "object" } },
    }, required: ["boardIDs", "boardPatches", "blockIDs", "blockPatches"] },
  },
];

export async function handleCombinedTool(client: FocalboardClient, name: string, args: Record<string, unknown>) {
  switch (name) {
    case "insert_boards_and_blocks":
      return client.insertBoardsAndBlocks(
        (args.boards as any[]).map(b => CreateBoardSchema.parse(b)),
        (args.blocks as any[]).map(b => CreateBlockSchema.parse(b))
      );
    case "patch_boards_and_blocks":
      return client.patchBoardsAndBlocks(
        args.boardIDs as string[],
        (args.boardPatches as any[]).map(p => BoardPatchSchema.parse(p)),
        args.blockIDs as string[],
        (args.blockPatches as any[]).map(p => BlockPatchSchema.parse(p))
      );
    default: throw new Error(`Unknown combined tool: ${name}`);
  }
}
```

### 8. MCP Server Entry - `src/index.ts`

```typescript
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
```

---

## Execution Steps

1. **创建目录**: `mkdir -p src/{client,types,tools}`
2. **创建类型文件**: 
   - `src/types/common.ts`
   - `src/types/board.ts`
   - `src/types/block.ts`
   - `src/types/index.ts` (re-export all)
3. **创建客户端**: `src/client/focalboard.ts`
4. **创建工具文件**:
   - `src/tools/boards.ts`
   - `src/tools/blocks.ts`
   - `src/tools/combined.ts`
   - `src/tools/index.ts` (re-export all)
5. **创建入口**: `src/index.ts`
6. **更新根目录**: `index.ts` 导出 `src/index.ts`

## Environment Variables

```bash
FOCALBOARD_URL=http://localhost:8000
FOCALBOARD_TOKEN=your-api-token
```

## Summary

| Module | Files | Tools |
|--------|-------|-------|
| types | 4 | - |
| client | 1 | - |
| tools/boards | 1 | 6 |
| tools/blocks | 1 | 4 |
| tools/combined | 1 | 2 |
| entry | 1 | - |
| **Total** | **9** | **12** |
