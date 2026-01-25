/**
 * MCP Tool Specifications - Block Operations
 * Based on Focalboard API swagger.yml
 */

import { z } from "zod";
import type { Block, BlockPatch, BlockPatchBatch } from "./types";

// ============================================================================
// BLOCK CRUD OPERATIONS
// ============================================================================

/**
 * Tool: create_blocks
 * POST /boards/{boardID}/blocks
 * Insert blocks (IDs will be server-generated)
 */
export const createBlocksTool = {
  name: "create_blocks",
  description: "Creates one or more blocks in a board. Server generates IDs for linking.",
  inputSchema: {
    type: "object",
    properties: {
      boardId: {
        type: "string",
        description: "ID of the board"
      },
      blocks: {
        type: "array",
        description: "Array of blocks to create",
        items: {
          type: "object",
          properties: {
            type: { type: "string", description: "Block type (e.g., 'card', 'view', 'text', 'image')" },
            title: { type: "string", description: "Block title" },
            parentId: { type: "string", description: "Parent block ID" },
            fields: { type: "object", description: "Block-specific fields" }
          },
          required: ["type"]
        }
      },
      disableNotify: {
        type: "boolean",
        description: "Disable notifications for bulk operations"
      }
    },
    required: ["boardId", "blocks"]
  }
};

/**
 * Tool: get_blocks
 * GET /boards/{boardID}/blocks
 * Returns blocks with optional filtering
 */
export const getBlocksTool = {
  name: "get_blocks",
  description: "Retrieves blocks from a board with optional filtering by parent or type.",
  inputSchema: {
    type: "object",
    properties: {
      boardId: {
        type: "string",
        description: "ID of the board"
      },
      parentId: {
        type: "string",
        description: "Filter by parent block ID (omit for all blocks)"
      },
      type: {
        type: "string",
        description: "Filter by block type (omit for all types)"
      }
    },
    required: ["boardId"]
  }
};

/**
 * Tool: update_block
 * PATCH /boards/{boardID}/blocks/{blockID}
 * Partially updates a single block
 */
export const updateBlockTool = {
  name: "update_block",
  description: "Partially updates a block's properties. Only provided fields are updated.",
  inputSchema: {
    type: "object",
    properties: {
      boardId: {
        type: "string",
        description: "ID of the board"
      },
      blockId: {
        type: "string",
        description: "ID of the block to update"
      },
      title: {
        type: "string",
        description: "New title"
      },
      type: {
        type: "string",
        description: "New type"
      },
      fields: {
        type: "object",
        description: "Fields to update"
      },
      disableNotify: {
        type: "boolean",
        description: "Disable notifications"
      }
    },
    required: ["boardId", "blockId"]
  }
};

/**
 * Tool: delete_block
 * DELETE /boards/{boardID}/blocks/{blockID}
 * Deletes a block
 */
export const deleteBlockTool = {
  name: "delete_block",
  description: "Deletes a block from a board. Can be restored with undelete_block.",
  inputSchema: {
    type: "object",
    properties: {
      boardId: {
        type: "string",
        description: "ID of the board"
      },
      blockId: {
        type: "string",
        description: "ID of the block to delete"
      },
      disableNotify: {
        type: "boolean",
        description: "Disable notifications for bulk deletion"
      }
    },
    required: ["boardId", "blockId"]
  }
};
