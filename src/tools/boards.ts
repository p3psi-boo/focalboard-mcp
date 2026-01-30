import type { FocalboardClient } from "../client/focalboard";
import { CreateBoardSchema, BoardPatchSchema } from "../types/board";

export const boardTools = [
  {
    name: "create_board",
    description: "Create a new board in a team",
    inputSchema: { type: "object", properties: {
      teamId: { type: "string", description: "Team ID" },
      title: { type: "string", description: "Board title" },
      description: { type: "string", description: "Board description" },
      icon: { type: "string", description: "Board icon emoji" },
      type: { type: "string", enum: ["O", "P"], default: "P", description: "O=Open, P=Private" },
    }, required: ["teamId", "title"] },
  },
  {
    name: "get_board",
    description: "Get board details by ID",
    inputSchema: { type: "object", properties: { boardId: { type: "string" } }, required: ["boardId"] },
  },
  {
    name: "update_board",
    description: "Update board properties",
    inputSchema: { type: "object", properties: {
      boardId: { type: "string" },
      title: { type: "string" },
      description: { type: "string" },
      icon: { type: "string" },
      type: { type: "string", enum: ["O", "P"] },
    }, required: ["boardId"] },
  },
  {
    name: "delete_board",
    description: "Delete a board",
    inputSchema: { type: "object", properties: { boardId: { type: "string" } }, required: ["boardId"] },
  },
  {
    name: "list_boards",
    description: "List all boards in a team",
    inputSchema: { type: "object", properties: { teamId: { type: "string" } }, required: ["teamId"] },
  },
  {
    name: "search_boards",
    description: "Search boards by title",
    inputSchema: { type: "object", properties: {
      teamId: { type: "string" },
      query: { type: "string", description: "Search query" },
    }, required: ["teamId", "query"] },
  },
];

export async function handleBoardTool(client: FocalboardClient, name: string, args: Record<string, unknown>) {
  switch (name) {
    case "create_board": return client.createBoard(CreateBoardSchema.parse(args));
    case "get_board": return client.getBoard(args.boardId as string);
    case "update_board": return client.updateBoard(args.boardId as string, BoardPatchSchema.parse(args));
    case "delete_board": return client.deleteBoard(args.boardId as string);
    case "list_boards": return client.listBoards(args.teamId as string);
    case "search_boards": return client.searchBoards(args.teamId as string, args.query as string);
    default: throw new Error(`Unknown board tool: ${name}`);
  }
}
