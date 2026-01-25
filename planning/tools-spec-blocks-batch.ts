/**
 * MCP Tool Specifications - Block Batch & Special Operations
 * Based on Focalboard API swagger.yml
 */

import type { Block, BlockPatch, BlockPatchBatch } from "./types";

// ============================================================================
// BLOCK BATCH OPERATIONS
// ============================================================================

/**
 * Tool: patch_blocks_batch
 * PATCH /boards/{boardID}/blocks/
 * Partially updates multiple blocks at once
 */
export const patchBlocksBatchTool = {
  name: "patch_blocks_batch",
  description: "Updates multiple blocks in a single operation for efficiency.",
  inputSchema: {
    type: "object",
    properties: {
      boardId: {
        type: "string",
        description: "ID of the board"
      },
      blockIds: {
        type: "array",
        items: { type: "string" },
        description: "Array of block IDs to update"
      },
      blockPatches: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            type: { type: "string" },
            fields: { type: "object" }
          }
        },
        description: "Array of patches (must match blockIds length)"
      },
      disableNotify: {
        type: "boolean",
        description: "Disable notifications for bulk patching"
      }
    },
    required: ["boardId", "blockIds", "blockPatches"]
  }
};

// ============================================================================
// BLOCK SPECIAL OPERATIONS
// ============================================================================

/**
 * Tool: duplicate_block
 * POST /boards/{boardID}/blocks/{blockID}/duplicate
 * Creates a copy of a block
 */
export const duplicateBlockTool = {
  name: "duplicate_block",
  description: "Creates a duplicate of a block with a new ID.",
  inputSchema: {
    type: "object",
    properties: {
      boardId: {
        type: "string",
        description: "ID of the board"
      },
      blockId: {
        type: "string",
        description: "ID of the block to duplicate"
      }
    },
    required: ["boardId", "blockId"]
  }
};

/**
 * Tool: undelete_block
 * POST /boards/{boardID}/blocks/{blockID}/undelete
 * Restores a deleted block
 */
export const undeleteBlockTool = {
  name: "undelete_block",
  description: "Restores a previously deleted block.",
  inputSchema: {
    type: "object",
    properties: {
      boardId: {
        type: "string",
        description: "ID of the board"
      },
      blockId: {
        type: "string",
        description: "ID of the block to restore"
      }
    },
    required: ["boardId", "blockId"]
  }
};

// ============================================================================
// FUNCTION SIGNATURES
// ============================================================================

export interface BlockToolFunctions {
  createBlocks(params: {
    boardId: string;
    blocks: Array<{
      type: string;
      title?: string;
      parentId?: string;
      fields?: Record<string, any>;
    }>;
    disableNotify?: boolean;
  }): Promise<Block[]>;

  getBlocks(params: {
    boardId: string;
    parentId?: string;
    type?: string;
  }): Promise<Block[]>;

  updateBlock(params: {
    boardId: string;
    blockId: string;
    title?: string;
    type?: string;
    fields?: Record<string, any>;
    disableNotify?: boolean;
  }): Promise<void>;

  deleteBlock(params: {
    boardId: string;
    blockId: string;
    disableNotify?: boolean;
  }): Promise<void>;

  patchBlocksBatch(params: {
    boardId: string;
    blockIds: string[];
    blockPatches: BlockPatch[];
    disableNotify?: boolean;
  }): Promise<void>;

  duplicateBlock(params: {
    boardId: string;
    blockId: string;
  }): Promise<Block[]>;

  undeleteBlock(params: {
    boardId: string;
    blockId: string;
  }): Promise<BlockPatch>;
}
