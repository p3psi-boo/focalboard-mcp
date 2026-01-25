/**
 * MCP Tool Specifications - Combined Board & Block Operations
 * Based on Focalboard API swagger.yml
 */

import type { BoardsAndBlocks, PatchBoardsAndBlocks, DeleteBoardsAndBlocks } from "./types";

// ============================================================================
// COMBINED OPERATIONS (Atomic Transactions)
// ============================================================================

/**
 * Tool: insert_boards_and_blocks
 * POST /boards-and-blocks
 * Creates boards and blocks atomically
 */
export const insertBoardsAndBlocksTool = {
  name: "insert_boards_and_blocks",
  description: "Creates boards and blocks in a single atomic operation. Useful for creating complete board structures.",
  inputSchema: {
    type: "object",
    properties: {
      boards: {
        type: "array",
        description: "Array of boards to create",
        items: {
          type: "object",
          properties: {
            teamId: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            type: { type: "string" }
          },
          required: ["teamId", "title"]
        }
      },
      blocks: {
        type: "array",
        description: "Array of blocks to create",
        items: {
          type: "object",
          properties: {
            type: { type: "string" },
            title: { type: "string" },
            parentId: { type: "string" },
            fields: { type: "object" }
          },
          required: ["type"]
        }
      }
    }
  }
};

/**
 * Tool: patch_boards_and_blocks
 * PATCH /boards-and-blocks
 * Updates boards and blocks atomically
 */
export const patchBoardsAndBlocksTool = {
  name: "patch_boards_and_blocks",
  description: "Updates multiple boards and blocks in a single atomic operation.",
  inputSchema: {
    type: "object",
    properties: {
      boardIDs: {
        type: "array",
        items: { type: "string" },
        description: "Array of board IDs to update"
      },
      boardPatches: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" }
          }
        },
        description: "Array of board patches"
      },
      blockIDs: {
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
            fields: { type: "object" }
          }
        },
        description: "Array of block patches"
      }
    }
  }
};

/**
 * Tool: delete_boards_and_blocks
 * DELETE /boards-and-blocks
 * Deletes boards and blocks atomically
 */
export const deleteBoardsAndBlocksTool = {
  name: "delete_boards_and_blocks",
  description: "Deletes multiple boards and blocks in a single atomic operation.",
  inputSchema: {
    type: "object",
    properties: {
      boards: {
        type: "array",
        items: { type: "string" },
        description: "Array of board IDs to delete"
      },
      blocks: {
        type: "array",
        items: { type: "string" },
        description: "Array of block IDs to delete"
      }
    }
  }
};

// ============================================================================
// FUNCTION SIGNATURES
// ============================================================================

export interface CombinedToolFunctions {
  insertBoardsAndBlocks(params: BoardsAndBlocks): Promise<BoardsAndBlocks>;
  
  patchBoardsAndBlocks(params: PatchBoardsAndBlocks): Promise<BoardsAndBlocks>;
  
  deleteBoardsAndBlocks(params: DeleteBoardsAndBlocks): Promise<void>;
}
