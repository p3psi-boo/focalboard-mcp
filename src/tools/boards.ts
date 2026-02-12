import type { FocalboardClient } from "../client/focalboard";
import { CreateBoardSchema, BoardPatchSchema } from "../types/board";
import { formatBoard, formatMember } from "./format";

export const boardTools = [
  {
    name: "create_board",
    description: "Create a new board",
    inputSchema: { type: "object", properties: {
      title: { type: "string", description: "Board title" },
      description: { type: "string", description: "Board description" },
    }, required: ["title"] },
  },
  {
    name: "get_board",
    description: "Get a single board's metadata including its cardProperties schema (property names, types, option values/IDs). Use this to understand board structure before creating or updating cards.",
    inputSchema: { type: "object", properties: {
      board: { type: "string", description: "Board name or ID" },
    }, required: ["board"] },
  },
  {
    name: "update_board",
    description: "Update board properties. When modifying cardProperties, pass them in the patch and they will be sent as updatedCardProperties to the API for incremental updates.",
    inputSchema: { type: "object", properties: {
      board: { type: "string", description: "Board name or ID" },
      patch: { type: "object", description: "Fields to update: title, description, icon, type (O=Open/P=Private), cardProperties, etc." },
    }, required: ["board", "patch"] },
  },
  {
    name: "delete_board",
    description: "Delete a board",
    inputSchema: { type: "object", properties: {
      board: { type: "string", description: "Board name or ID" },
    }, required: ["board"] },
  },
  {
    name: "list_boards",
    description: "List or search boards. Without query returns all boards; with query searches by title. If you don't have a boardId, use this tool first to find it. Use the shortest keyword possible for best results (e.g. use '\u9700\u6c42' instead of '\u9700\u6c42\u7ba1\u7406\u770b\u677f').",
    inputSchema: { type: "object", properties: {
      query: { type: "string", description: "Shortest keyword to match board title. Use minimal terms for broad matching." },
    } },
  },
  {
    name: "search_boards",
    description: "Search all boards across all teams by title. Requires a non-empty search term.",
    inputSchema: { type: "object", properties: {
      query: { type: "string", description: "Search query to match board titles (required, cannot be empty)" },
    }, required: ["query"] },
  },
  {
    name: "get_board_members",
    description: "List all members of a board (useful for getting user IDs for the Assignee property)",
    inputSchema: { type: "object", properties: {
      board: { type: "string", description: "Board name or ID" },
    }, required: ["board"] },
  },
  {
    name: "list_team_users",
    description: "List all users in a team",
    inputSchema: { type: "object", properties: {
      team: { type: "string", description: "Team ID (defaults to FOCALBOARD_TEAM_ID env var)" },
    } },
  },
];

export async function handleBoardTool(client: FocalboardClient, name: string, args: Record<string, unknown>) {
  const teamId = process.env.FOCALBOARD_TEAM_ID || "0";
  switch (name) {
    case "create_board": {
      const result = await client.createBoard(CreateBoardSchema.parse({ ...args, teamId }));
      return formatBoard(result);
    }
    case "get_board": {
      const board = await client.resolveBoard(args.board as string);
      return formatBoard(board);
    }
    case "update_board": {
      const board = await client.resolveBoard(args.board as string);
      const rawPatch = args.patch as Record<string, unknown>;
      // Transform: if cardProperties is set, move to updatedCardProperties for the PATCH API
      if (rawPatch.cardProperties && !rawPatch.updatedCardProperties) {
        rawPatch.updatedCardProperties = rawPatch.cardProperties;
        delete rawPatch.cardProperties;
      }
      const result = await client.updateBoard(board.id, BoardPatchSchema.parse(rawPatch));
      return formatBoard(result);
    }
    case "delete_board": {
      const board = await client.resolveBoard(args.board as string);
      await client.deleteBoard(board.id);
      return { deleted: board.title };
    }
    case "list_boards": {
      const q = args.query as string | undefined;
      if (q) {
        return (await client.searchAllBoards(q)).map(formatBoard);
      }
      // Try team-based listing; if empty/fails, try team-scoped search as fallback
      // (searchAllBoards/searchBoards require non-empty term — server returns [] for empty)
      let boards: any[] = [];
      try {
        boards = await client.listBoards(teamId);
      } catch {
        // listBoards failed; try search fallback
      }
      if (boards.length === 0) {
        // Broad single-char search as last resort (server rejects empty string)
        try { boards = await client.searchBoards(teamId, " "); } catch {}
      }
      return boards.map(formatBoard);
    }
    case "search_boards": {
      const q = (args.query as string) ?? "";
      return (await client.searchAllBoards(q)).map(formatBoard);
    }
    case "get_board_members": {
      const board = await client.resolveBoard(args.board as string);
      const members = await client.getBoardMembers(board.id);
      return members.map(formatMember);
    }
    case "list_team_users": {
      const tid = (args.team as string) || teamId;
      return await client.listTeamUsers(tid);
    }
    default: throw new Error(`Unknown board tool: ${name}`);
  }
}
