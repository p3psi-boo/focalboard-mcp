/**
 * MCP Tool Specifications - Board Operations
 * Based on Focalboard API swagger.yml
 */

import { z } from "zod";
import type { Board, BoardPatch, BoardMember } from "./types";

// ============================================================================
// BOARD CRUD OPERATIONS
// ============================================================================

/**
 * Tool: create_board
 * POST /boards
 * Creates a new board
 */
export const createBoardTool = {
  name: "create_board",
  description: "Creates a new board in Focalboard. A board groups a set of blocks and defines their layout.",
  inputSchema: {
    type: "object",
    properties: {
      teamId: {
        type: "string",
        description: "ID of the team where the board will be created"
      },
      title: {
        type: "string",
        description: "Title of the board"
      },
      description: {
        type: "string",
        description: "Optional description of the board"
      },
      icon: {
        type: "string",
        description: "Optional icon for the board (emoji or URL)"
      },
      showDescription: {
        type: "boolean",
        description: "Whether to show the description"
      },
      isTemplate: {
        type: "boolean",
        description: "Whether this board is a template"
      },
      type: {
        type: "string",
        description: "Board type (e.g., 'board', 'kanban', 'table', 'gallery', 'calendar')"
      },
      minimumRole: {
        type: "string",
        description: "Minimum role required to access the board"
      }
    },
    required: ["teamId", "title"]
  }
};

/**
 * Tool: get_board
 * GET /boards/{boardID}
 * Returns a board by ID
 */
export const getBoardTool = {
  name: "get_board",
  description: "Retrieves a board by its ID, including all metadata and configuration.",
  inputSchema: {
    type: "object",
    properties: {
      boardId: {
        type: "string",
        description: "ID of the board to retrieve"
      }
    },
    required: ["boardId"]
  }
};

/**
 * Tool: update_board
 * PATCH /boards/{boardID}
 * Partially updates a board
 */
export const updateBoardTool = {
  name: "update_board",
  description: "Partially updates a board's properties. Only provided fields will be updated.",
  inputSchema: {
    type: "object",
    properties: {
      boardId: {
        type: "string",
        description: "ID of the board to update"
      },
      title: {
        type: "string",
        description: "New title for the board"
      },
      description: {
        type: "string",
        description: "New description for the board"
      },
      icon: {
        type: "string",
        description: "New icon for the board"
      },
      showDescription: {
        type: "boolean",
        description: "Whether to show the description"
      },
      type: {
        type: "string",
        description: "Board type"
      },
      minimumRole: {
        type: "string",
        description: "Minimum role required to access"
      }
    },
    required: ["boardId"]
  }
};

/**
 * Tool: delete_board
 * DELETE /boards/{boardID}
 * Removes a board (soft delete)
 */
export const deleteBoardTool = {
  name: "delete_board",
  description: "Deletes a board (soft delete). The board can be restored using undelete_board.",
  inputSchema: {
    type: "object",
    properties: {
      boardId: {
        type: "string",
        description: "ID of the board to delete"
      }
    },
    required: ["boardId"]
  }
};

// ============================================================================
// BOARD QUERY OPERATIONS
// ============================================================================

/**
 * Tool: list_boards
 * GET /teams/{teamID}/boards
 * Returns all boards for a team
 */
export const listBoardsTool = {
  name: "list_boards",
  description: "Lists all boards that belong to a specific team.",
  inputSchema: {
    type: "object",
    properties: {
      teamId: {
        type: "string",
        description: "ID of the team"
      }
    },
    required: ["teamId"]
  }
};

/**
 * Tool: search_boards
 * GET /boards/search?q={query}
 * Searches boards by title/description
 */
export const searchBoardsTool = {
  name: "search_boards",
  description: "Searches for boards matching a search term. Searches across board titles and descriptions.",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search term (must have at least one character)",
        minLength: 1
      }
    },
    required: ["query"]
  }
};

// ============================================================================
// BOARD SPECIAL OPERATIONS
// ============================================================================

/**
 * Tool: duplicate_board
 * POST /boards/{boardID}/duplicate
 * Creates a copy of a board with all its blocks
 */
export const duplicateBoardTool = {
  name: "duplicate_board",
  description: "Creates a complete copy of a board including all its blocks and structure.",
  inputSchema: {
    type: "object",
    properties: {
      boardId: {
        type: "string",
        description: "ID of the board to duplicate"
      }
    },
    required: ["boardId"]
  }
};

/**
 * Tool: archive_board
 * GET /boards/{boardID}/archive/export
 * Exports a board as an archive file
 */
export const archiveBoardTool = {
  name: "archive_board",
  description: "Exports a board and all its blocks as an archive file for backup or migration.",
  inputSchema: {
    type: "object",
    properties: {
      boardId: {
        type: "string",
        description: "ID of the board to export"
      }
    },
    required: ["boardId"]
  }
};

/**
 * Tool: undelete_board
 * POST /boards/{boardID}/undelete
 * Restores a deleted board
 */
export const undeleteBoardTool = {
  name: "undelete_board",
  description: "Restores a previously deleted board.",
  inputSchema: {
    type: "object",
    properties: {
      boardId: {
        type: "string",
        description: "ID of the board to restore"
      }
    },
    required: ["boardId"]
  }
};

// ============================================================================
// BOARD MEMBERSHIP OPERATIONS
// ============================================================================

/**
 * Tool: join_board
 * POST /boards/{boardID}/join
 * Become a member of a board
 */
export const joinBoardTool = {
  name: "join_board",
  description: "Join a board as a member. Requires appropriate permissions.",
  inputSchema: {
    type: "object",
    properties: {
      boardId: {
        type: "string",
        description: "ID of the board to join"
      }
    },
    required: ["boardId"]
  }
};

/**
 * Tool: leave_board
 * POST /boards/{boardID}/leave
 * Remove your membership from a board
 */
export const leaveBoardTool = {
  name: "leave_board",
  description: "Leave a board by removing your own membership.",
  inputSchema: {
    type: "object",
    properties: {
      boardId: {
        type: "string",
        description: "ID of the board to leave"
      }
    },
    required: ["boardId"]
  }
};

// ============================================================================
// FUNCTION SIGNATURES
// ============================================================================

export interface BoardToolFunctions {
  createBoard(params: {
    teamId: string;
    title: string;
    description?: string;
    icon?: string;
    showDescription?: boolean;
    isTemplate?: boolean;
    type?: string;
    minimumRole?: string;
  }): Promise<Board>;

  getBoard(params: { boardId: string }): Promise<Board>;

  updateBoard(params: {
    boardId: string;
    title?: string;
    description?: string;
    icon?: string;
    showDescription?: boolean;
    type?: string;
    minimumRole?: string;
  }): Promise<Board>;

  deleteBoard(params: { boardId: string }): Promise<void>;

  listBoards(params: { teamId: string }): Promise<Board[]>;

  searchBoards(params: { query: string }): Promise<Board[]>;

  duplicateBoard(params: { boardId: string }): Promise<{ boards: Board[]; blocks: any[] }>;

  archiveBoard(params: { boardId: string }): Promise<Blob>;

  undeleteBoard(params: { boardId: string }): Promise<void>;

  joinBoard(params: { boardId: string }): Promise<BoardMember>;

  leaveBoard(params: { boardId: string }): Promise<void>;
}
