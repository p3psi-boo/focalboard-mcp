/**
 * Type Definitions for Focalboard MCP Server
 * Based on swagger.yml definitions
 */

import { z } from "zod";

// ============================================================================
// BOARD TYPES
// ============================================================================

/**
 * Board represents a collection of blocks with layout and metadata
 */
export const BoardSchema = z.object({
  id: z.string().optional(),
  teamId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  icon: z.string().optional(),
  showDescription: z.boolean().optional(),
  isTemplate: z.boolean().optional(),
  templateVersion: z.number().optional(),
  properties: z.record(z.string(), z.any()).optional(),
  cardProperties: z.array(z.any()).optional(),
  createAt: z.number().optional(),
  updateAt: z.number().optional(),
  deleteAt: z.number().optional(),
  createdBy: z.string().optional(),
  modifiedBy: z.string().optional(),
  type: z.string().optional(),
  minimumRole: z.string().optional(),
});

export type Board = z.infer<typeof BoardSchema>;

/**
 * BoardPatch for partial updates
 */
export const BoardPatchSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  showDescription: z.boolean().optional(),
  properties: z.record(z.string(), z.any()).optional(),
  cardProperties: z.array(z.any()).optional(),
  type: z.string().optional(),
  minimumRole: z.string().optional(),
});

export type BoardPatch = z.infer<typeof BoardPatchSchema>;

/**
 * BoardMember represents membership in a board
 */
export const BoardMemberSchema = z.object({
  boardId: z.string(),
  userId: z.string(),
  roles: z.string(),
  minimumRole: z.string().optional(),
  schemeAdmin: z.boolean().optional(),
  schemeEditor: z.boolean().optional(),
  schemeCommenter: z.boolean().optional(),
  schemeViewer: z.boolean().optional(),
});

export type BoardMember = z.infer<typeof BoardMemberSchema>;

/**
 * BoardMetadata contains metadata about a board
 */
export const BoardMetadataSchema = z.object({
  boardId: z.string(),
  descriptionLastUpdateAt: z.number().optional(),
  lastActivityAt: z.number().optional(),
  createdBy: z.string().optional(),
  modifiedBy: z.string().optional(),
});

export type BoardMetadata = z.infer<typeof BoardMetadataSchema>;

// ============================================================================
// BLOCK TYPES
// ============================================================================

/**
 * Block is the basic data unit in Focalboard
 */
export const BlockSchema = z.object({
  id: z.string().optional(),
  boardId: z.string().optional(),
  parentId: z.string().optional(),
  rootId: z.string().optional(),
  createdBy: z.string().optional(),
  modifiedBy: z.string().optional(),
  schema: z.number().optional(),
  type: z.string(),
  title: z.string().optional(),
  fields: z.record(z.string(), z.any()).optional(),
  createAt: z.number().optional(),
  updateAt: z.number().optional(),
  deleteAt: z.number().optional(),
});

export type Block = z.infer<typeof BlockSchema>;

/**
 * BlockPatch for partial updates
 */
export const BlockPatchSchema = z.object({
  parentId: z.string().optional(),
  schema: z.number().optional(),
  type: z.string().optional(),
  title: z.string().optional(),
  fields: z.record(z.string(), z.any()).optional(),
  updatedFields: z.record(z.string(), z.any()).optional(),
  deletedFields: z.array(z.string()).optional(),
});

export type BlockPatch = z.infer<typeof BlockPatchSchema>;

/**
 * BlockPatchBatch for batch updates
 */
export const BlockPatchBatchSchema = z.object({
  blockIds: z.array(z.string()),
  blockPatches: z.array(BlockPatchSchema),
});

export type BlockPatchBatch = z.infer<typeof BlockPatchBatchSchema>;

// ============================================================================
// COMBINED TYPES
// ============================================================================

/**
 * BoardsAndBlocks for atomic operations
 */
export const BoardsAndBlocksSchema = z.object({
  boards: z.array(BoardSchema).optional(),
  blocks: z.array(BlockSchema).optional(),
});

export type BoardsAndBlocks = z.infer<typeof BoardsAndBlocksSchema>;

/**
 * PatchBoardsAndBlocks for batch patching
 */
export const PatchBoardsAndBlocksSchema = z.object({
  boardIDs: z.array(z.string()).optional(),
  boardPatches: z.array(BoardPatchSchema).optional(),
  blockIDs: z.array(z.string()).optional(),
  blockPatches: z.array(BlockPatchSchema).optional(),
});

export type PatchBoardsAndBlocks = z.infer<typeof PatchBoardsAndBlocksSchema>;

/**
 * DeleteBoardsAndBlocks for batch deletion
 */
export const DeleteBoardsAndBlocksSchema = z.object({
  boards: z.array(z.string()).optional(),
  blocks: z.array(z.string()).optional(),
});

export type DeleteBoardsAndBlocks = z.infer<typeof DeleteBoardsAndBlocksSchema>;

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * ErrorResponse from API
 */
export const ErrorResponseSchema = z.object({
  error: z.string(),
  errorCode: z.string().optional(),
  details: z.any().optional(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// ============================================================================
// QUERY PARAMETERS
// ============================================================================

/**
 * Query parameters for getBlocks
 */
export const GetBlocksQuerySchema = z.object({
  parent_id: z.string().optional(),
  type: z.string().optional(),
});

export type GetBlocksQuery = z.infer<typeof GetBlocksQuerySchema>;

/**
 * Query parameters for search
 */
export const SearchQuerySchema = z.object({
  q: z.string().min(1),
});

export type SearchQuery = z.infer<typeof SearchQuerySchema>;

/**
 * Disable notify parameter for bulk operations
 */
export const DisableNotifySchema = z.object({
  disable_notify: z.boolean().optional(),
});

export type DisableNotify = z.infer<typeof DisableNotifySchema>;
