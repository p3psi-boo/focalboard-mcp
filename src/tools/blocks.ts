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
