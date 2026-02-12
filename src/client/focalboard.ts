import type { FocalboardConfig } from "../types/common";
import type { Board, BoardPatch, CreateBoard } from "../types/board";
import type { Block, BlockPatch, CreateBlock } from "../types/block";
import type { Card, CardPatch, CreateCard } from "../types/card";
import { login as authLogin, logout as authLogout } from "./auth";
import type { AuthMode, LoginParams, LoginResult } from "./auth";

export type { AuthMode, LoginParams, LoginResult };

export class FocalboardClient {
  private token: string;
  private csrfToken?: string;
  private readonly baseUrl: string;
  private readonly apiPrefix: string;
  private readonly requestedWith?: string;

  constructor(private config: FocalboardConfig) {
    this.baseUrl = config.baseUrl;
    this.apiPrefix = config.apiPrefix;
    this.requestedWith = config.requestedWith;
    this.token = config.token;
    this.csrfToken = config.csrfToken;
  }

  setAuth(next: { token: string; csrfToken?: string }) {
    this.token = next.token;
    this.csrfToken = next.csrfToken;
  }

  getAuth(): { token: string; csrfToken?: string } {
    return { token: this.token, csrfToken: this.csrfToken };
  }

  async login(params: LoginParams): Promise<LoginResult> {
    const result = await authLogin(
      { baseUrl: this.baseUrl, apiPrefix: this.apiPrefix, requestedWith: this.requestedWith },
      params,
    );
    this.setAuth({ token: result.token, csrfToken: result.csrfToken });
    return result;
  }

  async logout(mode: AuthMode = "auto"): Promise<{ ok: true }> {
    await authLogout(
      { baseUrl: this.baseUrl, apiPrefix: this.apiPrefix, requestedWith: this.requestedWith, token: this.token, csrfToken: this.csrfToken },
      mode,
    );
    this.setAuth({ token: "", csrfToken: undefined });
    return { ok: true };
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${this.apiPrefix}${path}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;
    if (this.csrfToken) headers["X-CSRF-Token"] = this.csrfToken;
    if (this.requestedWith) headers["X-Requested-With"] = this.requestedWith;

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText })) as Record<string, string>;
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json() as T;
  }

  // Resolution helpers

  async resolveBoard(board: string, teamId: string): Promise<Board> {
    const isId = /^[a-z0-9]{20,}$/.test(board) || /^[0-9a-f-]{36}$/.test(board);
    if (isId) {
      try { return await this.getBoard(board); } catch {}
    }
    const results = await this.searchBoards(teamId, board);
    const exact = results.find(b => b.title === board);
    if (exact) return exact;
    if (results.length === 1) return results[0]!;
    if (results.length > 1) throw new Error(`Found ${results.length} boards matching "${board}": ${results.map(b => b.title).join(", ")}. Please be more specific.`);
    throw new Error(`Board "${board}" not found`);
  }

  async resolveBlock(boardId: string, block: string): Promise<Block> {
    const isId = /^[a-z0-9]{20,}$/.test(block) || /^[0-9a-f-]{36}$/.test(block);
    if (isId) {
      const blocks = await this.getBlocks(boardId);
      const found = blocks.find(b => b.id === block);
      if (found) return found;
    }
    const blocks = await this.getBlocks(boardId);
    const matches = blocks.filter(b => b.title === block);
    if (matches.length === 1) return matches[0]!
    if (matches.length > 1) throw new Error(`Found ${matches.length} blocks matching "${block}". Please use the block ID: ${matches.map(b => `${b.title} (${b.id})`).join(", ")}`);
    throw new Error(`Block "${block}" not found in this board`);
  }

  // Board CRUD

  createBoard = (data: CreateBoard) => {
    const now = Date.now();
    return this.request<Board>("POST", "/boards", { ...data, createAt: now, updateAt: now });
  };
  getBoard = (id: string) => this.request<Board>("GET", `/boards/${id}`);
  updateBoard = (id: string, patch: BoardPatch) => this.request<Board>("PATCH", `/boards/${id}`, patch);
  deleteBoard = (id: string) => this.request<void>("DELETE", `/boards/${id}`);
  listBoards = (teamId: string) => this.request<Board[]>("GET", `/teams/${teamId}/boards`);
  searchBoards = (teamId: string, q: string) => this.request<Board[]>("GET", `/teams/${teamId}/boards/search?q=${encodeURIComponent(q)}`);
  searchAllBoards = (q: string) => this.request<Board[]>("GET", `/boards/search?q=${encodeURIComponent(q)}`);

  // Block CRUD

  createBlocks = (boardId: string, blocks: CreateBlock[]) => {
    const now = Date.now();
    const withIds = blocks.map(b => ({
      ...b,
      id: (b as any).id || this.generateId(),
      boardId,
      createAt: now,
      updateAt: now,
    }));
    return this.request<Block[]>("POST", `/boards/${boardId}/blocks`, withIds);
  };

  private generateId(): string {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    const bytes = new Uint8Array(27);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => chars[b % chars.length]).join("");
  }

  getBlocks = (boardId: string, parentId?: string, type?: string) => {
    const params = new URLSearchParams();
    if (parentId) params.set("parent_id", parentId);
    if (type) params.set("type", type);
    const qs = params.toString();
    return this.request<Block[]>("GET", `/boards/${boardId}/blocks${qs ? `?${qs}` : ""}`);
  };
  updateBlock = (boardId: string, blockId: string, patch: BlockPatch) =>
    this.request<Block>("PATCH", `/boards/${boardId}/blocks/${blockId}`, patch);
  deleteBlock = (boardId: string, blockId: string) =>
    this.request<void>("DELETE", `/boards/${boardId}/blocks/${blockId}`);

  // Card CRUD

  listCards = (boardId: string, page = 0, perPage = 20) =>
    this.request<Card[]>("GET", `/boards/${boardId}/cards?page=${page}&per_page=${perPage}`);
  getCard = (cardId: string) =>
    this.request<Card>("GET", `/cards/${cardId}`);
  createCard = (boardId: string, data: CreateCard) => {
    const now = Date.now();
    return this.request<Card>("POST", `/boards/${boardId}/cards`, { ...data, createAt: now, updateAt: now });
  };
  updateCard = (cardId: string, patch: CardPatch) =>
    this.request<Card>("PATCH", `/cards/${cardId}`, patch);

  // Board members

  getBoardMembers = (boardId: string) =>
    this.request<any[]>("GET", `/boards/${boardId}/members`);

  // Team users

  listTeamUsers = (teamId: string) =>
    this.request<any[]>("GET", `/teams/${teamId}/users`);
}
