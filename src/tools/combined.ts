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
