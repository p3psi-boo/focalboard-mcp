import type { FocalboardConfig } from "../types/common";
import type { Board, BoardPatch, CreateBoard } from "../types/board";
import type { Block, BlockPatch, CreateBlock } from "../types/block";

export class FocalboardClient {
  constructor(private config: FocalboardConfig) {}

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.config.baseUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  }

  createBoard = (data: CreateBoard) => this.request<Board>("POST", "/api/v2/boards", data);
  getBoard = (id: string) => this.request<Board>("GET", `/api/v2/boards/${id}`);
  updateBoard = (id: string, patch: BoardPatch) => this.request<Board>("PATCH", `/api/v2/boards/${id}`, patch);
  deleteBoard = (id: string) => this.request<void>("DELETE", `/api/v2/boards/${id}`);
  listBoards = (teamId: string) => this.request<Board[]>("GET", `/api/v2/teams/${teamId}/boards`);
  searchBoards = (teamId: string, q: string) => this.request<Board[]>("GET", `/api/v2/teams/${teamId}/boards/search?q=${encodeURIComponent(q)}`);

  createBlocks = (boardId: string, blocks: CreateBlock[], disableNotify = false) =>
    this.request<Block[]>("POST", `/api/v2/boards/${boardId}/blocks?disable_notify=${disableNotify}`, blocks);
  getBlocks = (boardId: string, parentId?: string, type?: string) => {
    const params = new URLSearchParams();
    if (parentId) params.set("parent_id", parentId);
    if (type) params.set("type", type);
    return this.request<Block[]>("GET", `/api/v2/boards/${boardId}/blocks?${params}`);
  };
  updateBlock = (boardId: string, blockId: string, patch: BlockPatch, disableNotify = false) =>
    this.request<Block>("PATCH", `/api/v2/boards/${boardId}/blocks/${blockId}?disable_notify=${disableNotify}`, patch);
  deleteBlock = (boardId: string, blockId: string, disableNotify = false) =>
    this.request<void>("DELETE", `/api/v2/boards/${boardId}/blocks/${blockId}?disable_notify=${disableNotify}`);

  insertBoardsAndBlocks = (boards: CreateBoard[], blocks: CreateBlock[]) =>
    this.request<{ boards: Board[]; blocks: Block[] }>("POST", "/api/v2/boards-and-blocks", { boards, blocks });
  patchBoardsAndBlocks = (boardIDs: string[], boardPatches: BoardPatch[], blockIDs: string[], blockPatches: BlockPatch[]) =>
    this.request<{ boards: Board[]; blocks: Block[] }>("PATCH", "/api/v2/boards-and-blocks", { boardIDs, boardPatches, blockIDs, blockPatches });
}
