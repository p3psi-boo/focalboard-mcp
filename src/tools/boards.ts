import type { FocalboardClient } from "../client/focalboard";
import { CreateBoardSchema, BoardPatchSchema } from "../types/board";
import { formatBoard, formatMember } from "./format";
import { config } from "../config";
import { registerTool } from "./registry";

registerTool(
  {
    name: "create_board",
    description: "Create a new board",
    inputSchema: { type: "object", properties: {
      title: { type: "string", description: "Board title" },
      description: { type: "string", description: "Board description" },
    }, required: ["title"] },
  },
  async (client, args) => {
    const result = await client.createBoard(CreateBoardSchema.parse({ ...args, teamId: config.focalboard.teamId }));
    return formatBoard(result);
  },
);

registerTool(
  {
    name: "get_board",
    description: "Get a single board's metadata including its cardProperties schema (property names, types, option values/IDs). Use this to understand board structure before creating or updating cards.",
    inputSchema: { type: "object", properties: {
      board: { type: "string", description: "Board name or ID" },
    }, required: ["board"] },
  },
  async (client, args) => {
    const board = await client.resolveBoard(args.board as string, config.focalboard.teamId);
    return formatBoard(board);
  },
);

registerTool(
  {
    name: "update_board",
    description: "Update board properties. When modifying cardProperties, pass them in the patch and they will be sent as updatedCardProperties to the API for incremental updates.",
    inputSchema: { type: "object", properties: {
      board: { type: "string", description: "Board name or ID" },
      patch: { type: "object", description: "Fields to update: title, description, icon, type (O=Open/P=Private), cardProperties, etc." },
    }, required: ["board", "patch"] },
  },
  async (client, args) => {
    const board = await client.resolveBoard(args.board as string, config.focalboard.teamId);
    const rawPatch = args.patch as Record<string, unknown>;
    if (rawPatch.cardProperties && !rawPatch.updatedCardProperties) {
      rawPatch.updatedCardProperties = rawPatch.cardProperties;
      delete rawPatch.cardProperties;
    }
    const result = await client.updateBoard(board.id, BoardPatchSchema.parse(rawPatch));
    return formatBoard(result);
  },
);

registerTool(
  {
    name: "delete_board",
    description: "Delete a board",
    inputSchema: { type: "object", properties: {
      board: { type: "string", description: "Board name or ID" },
    }, required: ["board"] },
  },
  async (client, args) => {
    const board = await client.resolveBoard(args.board as string, config.focalboard.teamId);
    await client.deleteBoard(board.id);
    return { deleted: board.title };
  },
);

registerTool(
  {
    name: "list_boards",
    description: "List or search boards. Without query returns all boards; with query searches by title. If you don't have a boardId, use this tool first to find it. Use the shortest keyword possible for best results (e.g. use '\u9700\u6c42' instead of '\u9700\u6c42\u7ba1\u7406\u770b\u677f').",
    inputSchema: { type: "object", properties: {
      query: { type: "string", description: "Shortest keyword to match board title. Use minimal terms for broad matching." },
    } },
  },
  async (client, args) => {
    const teamId = config.focalboard.teamId;
    const q = args.query as string | undefined;
    if (q) {
      return (await client.searchAllBoards(q)).map(formatBoard);
    }
    let boards: any[] = [];
    try {
      boards = await client.listBoards(teamId);
    } catch {
      // listBoards failed; try search fallback
    }
    if (boards.length === 0) {
      try { boards = await client.searchBoards(teamId, " "); } catch {}
    }
    return boards.map(formatBoard);
  },
);

registerTool(
  {
    name: "search_boards",
    description: "Search all boards across all teams by title. Requires a non-empty search term.",
    inputSchema: { type: "object", properties: {
      query: { type: "string", description: "Search query to match board titles (required, cannot be empty)" },
    }, required: ["query"] },
  },
  async (client, args) => {
    const q = (args.query as string) ?? "";
    return (await client.searchAllBoards(q)).map(formatBoard);
  },
);

registerTool(
  {
    name: "get_board_members",
    description: "List all members of a board (useful for getting user IDs for the Assignee property)",
    inputSchema: { type: "object", properties: {
      board: { type: "string", description: "Board name or ID" },
    }, required: ["board"] },
  },
  async (client, args) => {
    const board = await client.resolveBoard(args.board as string, config.focalboard.teamId);
    const members = await client.getBoardMembers(board.id);
    return members.map(formatMember);
  },
);

registerTool(
  {
    name: "list_team_users",
    description: "List all users in a team",
    inputSchema: { type: "object", properties: {
      team: { type: "string", description: "Team ID (defaults to FOCALBOARD_TEAM_ID env var)" },
    } },
  },
  async (client, args) => {
    const tid = (args.team as string) || config.focalboard.teamId;
    return await client.listTeamUsers(tid);
  },
);
