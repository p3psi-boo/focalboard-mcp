import type { FocalboardConfig } from "../types/common";
import type { Board, BoardPatch, CreateBoard } from "../types/board";
import type { Block, BlockPatch, CreateBlock } from "../types/block";

export type AuthMode = "auto" | "focalboard" | "mattermost";

export interface LoginParams {
  /** Mattermost uses login_id; Focalboard typically uses username/email */
  loginId?: string;
  username?: string;
  password: string;
  /** Force which login endpoint to use */
  mode?: AuthMode;
}

export interface LoginResult {
  mode: Exclude<AuthMode, "auto">;
  token: string;
  csrfToken?: string;
}

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

  private inferAuthMode(): Exclude<AuthMode, "auto"> {
    // Heuristic: plugin deployments use /plugins/focalboard/api/v2.
    return this.apiPrefix.includes("/plugins/focalboard/") ? "mattermost" : "focalboard";
  }

  private getSetCookieHeaders(headers: Headers): string[] {
    // Bun/undici: Headers.getSetCookie() returns string[]
    const anyHeaders = headers as any;
    if (typeof anyHeaders.getSetCookie === "function") {
      const v = anyHeaders.getSetCookie();
      if (Array.isArray(v)) return v;
    }

    // Fallback: some runtimes concatenate multiple Set-Cookie values.
    const raw = headers.get("set-cookie");
    if (!raw) return [];

    // Split on commas that look like cookie delimiters, not Expires.
    return raw.split(/,(?=[^;\s]+=)/g).map((s) => s.trim()).filter(Boolean);
  }

  private findCookie(setCookies: string[], name: string): string | undefined {
    for (const sc of setCookies) {
      if (sc.startsWith(`${name}=`)) {
        return sc.slice(name.length + 1).split(";")[0];
      }
    }
    return undefined;
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
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  }

  async login(params: LoginParams): Promise<LoginResult> {
    const mode = params.mode && params.mode !== "auto" ? params.mode : this.inferAuthMode();
    if (mode === "mattermost") {
      const login_id = params.loginId || params.username;
      if (!login_id) throw new Error("login requires loginId or username");
      const res = await fetch(`${this.baseUrl}/api/v4/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.requestedWith ? { "X-Requested-With": this.requestedWith } : {}),
        },
        body: JSON.stringify({ login_id, password: params.password }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const token = res.headers.get("Token") || res.headers.get("token") || "";
      if (!token) throw new Error("Login succeeded but no Token header returned");

      const setCookies = this.getSetCookieHeaders(res.headers);
      const csrfToken = this.findCookie(setCookies, "MMCSRF");

      this.setAuth({ token, csrfToken });
      return { mode, token, csrfToken };
    }

    // Standalone Focalboard login endpoint
    const username = params.username || params.loginId;
    if (!username) throw new Error("login requires username or loginId");
    const res = await fetch(`${this.baseUrl}${this.apiPrefix}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.requestedWith ? { "X-Requested-With": this.requestedWith } : {}),
      },
      body: JSON.stringify({ username, password: params.password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const data = await res.json().catch(() => null) as any;
    const token = data?.token as string | undefined;
    if (!token) throw new Error("Login succeeded but response had no token");
    this.setAuth({ token });
    return { mode, token };
  }

  async logout(mode: AuthMode = "auto"): Promise<{ ok: true }> {
    const resolved = mode !== "auto" ? mode : this.inferAuthMode();
    // Best-effort server-side logout; always clear local auth.
    try {
      if (resolved === "mattermost") {
        const headers: Record<string, string> = {};
        if (this.token) headers.Authorization = `Bearer ${this.token}`;
        if (this.csrfToken) headers["X-CSRF-Token"] = this.csrfToken;
        if (this.requestedWith) headers["X-Requested-With"] = this.requestedWith;
        await fetch(`${this.baseUrl}/api/v4/users/logout`, { method: "POST", headers });
      } else {
        await fetch(`${this.baseUrl}${this.apiPrefix}/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
            ...(this.requestedWith ? { "X-Requested-With": this.requestedWith } : {}),
          },
        });
      }
    } catch {
      // Ignore logout network errors; local clear is the important part.
    }

    this.setAuth({ token: "", csrfToken: undefined });
    return { ok: true };
  }

  async resolveBoard(board: string): Promise<Board> {
    const isId = /^[a-z0-9]{20,}$/.test(board) || /^[0-9a-f-]{36}$/.test(board);
    if (isId) {
      try { return await this.getBoard(board); } catch {}
    }
    const teamId = process.env.FOCALBOARD_TEAM_ID || "0";
    const results = await this.searchBoards(teamId, board);
    const exact = results.find(b => b.title === board);
    if (exact) return exact;
    if (results.length === 1) return results[0];
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
    if (matches.length === 1) return matches[0];
    if (matches.length > 1) throw new Error(`Found ${matches.length} blocks matching "${block}". Please use the block ID: ${matches.map(b => `${b.title} (${b.id})`).join(", ")}`);
    throw new Error(`Block "${block}" not found in this board`);
  }

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

}
