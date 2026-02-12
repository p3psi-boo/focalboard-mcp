import type { FocalboardClient } from "../client/focalboard";
import { CreateBlockSchema, BlockPatchSchema } from "../types/block";
import { formatBlock } from "./format";

export const blockTools = [
  {
    name: "create_block",
    description: "Create a block (card, view, text, image, etc.) in a board",
    inputSchema: { type: "object", properties: {
      board: { type: "string", description: "Board name or ID" },
      type: { type: "string", description: "Block type: card, view, text, image, divider, checkbox, h1, h2, h3, list-item, attachment, quote, video, comment" },
      title: { type: "string", description: "Block title" },
      parent: { type: "string", description: "Parent block title or ID" },
      fields: { type: "object", description: "Block-specific fields (properties, contentOrder, etc.)" },
    }, required: ["board", "type"] },
  },
  {
    name: "get_blocks",
    description: "Get blocks from a board, optionally filtered by type and/or parent",
    inputSchema: { type: "object", properties: {
      board: { type: "string", description: "Board name or ID" },
      type: { type: "string", description: "Filter by block type (card, view, text, etc.)" },
      parent: { type: "string", description: "Parent block ID to filter by" },
    }, required: ["board"] },
  },
  {
    name: "update_block",
    description: "Update a block in a board",
    inputSchema: { type: "object", properties: {
      board: { type: "string", description: "Board name or ID" },
      block: { type: "string", description: "Block title or ID" },
      patch: { type: "object", description: "Fields to update: title, updatedFields, deletedFields, etc." },
    }, required: ["board", "block", "patch"] },
  },
  {
    name: "delete_block",
    description: "Delete a block from a board",
    inputSchema: { type: "object", properties: {
      board: { type: "string", description: "Board name or ID" },
      block: { type: "string", description: "Block title or ID" },
    }, required: ["board", "block"] },
  },
];

export async function handleBlockTool(client: FocalboardClient, name: string, args: Record<string, unknown>) {
  switch (name) {
    case "create_block": {
      const board = await client.resolveBoard(args.board as string);
      let parentId: string | undefined;
      if (args.parent) {
        const parent = await client.resolveBlock(board.id, args.parent as string);
        parentId = parent.id;
      }
      const block = CreateBlockSchema.parse({
        type: args.type,
        title: args.title,
        parentId,
        fields: args.fields,
      });
      const result = await client.createBlocks(board.id, [block]);
      return formatBlock(result[0]);
    }
    case "get_blocks": {
      const board = await client.resolveBoard(args.board as string);
      const blocks = await client.getBlocks(board.id, args.parent as string | undefined, args.type as string | undefined);
      return blocks.map(formatBlock);
    }
    case "update_block": {
      const board = await client.resolveBoard(args.board as string);
      const blk = await client.resolveBlock(board.id, args.block as string);
      const result = await client.updateBlock(board.id, blk.id, BlockPatchSchema.parse(args.patch));
      return formatBlock(result);
    }
    case "delete_block": {
      const board = await client.resolveBoard(args.board as string);
      const blk = await client.resolveBlock(board.id, args.block as string);
      await client.deleteBlock(board.id, blk.id);
      return { deleted: blk.title || blk.id };
    }
    default: throw new Error(`Unknown block tool: ${name}`);
  }
}
