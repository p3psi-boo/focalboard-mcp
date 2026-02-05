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

  createBoard = (data: CreateBoard) => this.request<Board>("POST", "/boards", data);
  getBoard = (id: string) => this.request<Board>("GET", `/boards/${id}`);
  updateBoard = (id: string, patch: BoardPatch) => this.request<Board>("PATCH", `/boards/${id}`, patch);
  deleteBoard = (id: string) => this.request<void>("DELETE", `/boards/${id}`);
  listBoards = (teamId: string) => this.request<Board[]>("GET", `/teams/${teamId}/boards`);
  searchBoards = (teamId: string, q: string) => this.request<Board[]>("GET", `/teams/${teamId}/boards/search?q=${encodeURIComponent(q)}`);

  createBlocks = (boardId: string, blocks: CreateBlock[], disableNotify = false) =>
    this.request<Block[]>("POST", `/boards/${boardId}/blocks?disable_notify=${disableNotify}`, blocks);
  getBlocks = (boardId: string, parentId?: string, type?: string) => {
    const params = new URLSearchParams();
    if (parentId) params.set("parent_id", parentId);
    if (type) params.set("type", type);
    const qs = params.toString();
    return this.request<Block[]>("GET", `/boards/${boardId}/blocks${qs ? `?${qs}` : ""}`);
  };
  updateBlock = (boardId: string, blockId: string, patch: BlockPatch, disableNotify = false) =>
    this.request<Block>("PATCH", `/boards/${boardId}/blocks/${blockId}?disable_notify=${disableNotify}`, patch);
  deleteBlock = (boardId: string, blockId: string, disableNotify = false) =>
    this.request<void>("DELETE", `/boards/${boardId}/blocks/${blockId}?disable_notify=${disableNotify}`);

  insertBoardsAndBlocks = (boards: CreateBoard[], blocks: CreateBlock[]) =>
    this.request<{ boards: Board[]; blocks: Block[] }>("POST", "/boards-and-blocks", { boards, blocks });
  patchBoardsAndBlocks = (boardIDs: string[], boardPatches: BoardPatch[], blockIDs: string[], blockPatches: BlockPatch[]) =>
    this.request<{ boards: Board[]; blocks: Block[] }>("PATCH", "/boards-and-blocks", { boardIDs, boardPatches, blockIDs, blockPatches });
}
