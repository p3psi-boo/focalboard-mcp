import type { FocalboardClient } from "../client/focalboard";
import { CreateBoardSchema, BoardPatchSchema } from "../types/board";
import { formatBoard } from "./format";

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
    name: "update_board",
    description: "Update board properties",
    inputSchema: { type: "object", properties: {
      board: { type: "string", description: "Board name or ID" },
      patch: { type: "object", description: "Fields to update: title, description, icon, type (O=Open/P=Private), etc." },
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
    description: "List or search boards. Without query returns all boards; with query searches by title. If you don't have a boardId, use this tool first to find it. Use the shortest keyword possible for best results (e.g. use '需求' instead of '需求管理看板').",
    inputSchema: { type: "object", properties: {
      query: { type: "string", description: "Shortest keyword to match board title. Use minimal terms for broad matching." },
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
    case "update_board": {
      const board = await client.resolveBoard(args.board as string);
      const result = await client.updateBoard(board.id, BoardPatchSchema.parse(args.patch));
      return formatBoard(result);
    }
    case "delete_board": {
      const board = await client.resolveBoard(args.board as string);
      await client.deleteBoard(board.id);
      return { deleted: board.title };
    }
    case "list_boards": {
      const q = args.query as string | undefined;
      const boards = q
        ? await client.searchAllBoards(q)
        : await client.listBoards(teamId);
      return boards.map(formatBoard);
    }
    default: throw new Error(`Unknown board tool: ${name}`);
  }
}
