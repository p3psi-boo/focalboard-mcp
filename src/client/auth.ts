export type AuthMode = "auto" | "focalboard" | "mattermost";

export interface LoginParams {
  loginId?: string;
  username?: string;
  password: string;
  mode?: AuthMode;
}

export interface LoginResult {
  mode: Exclude<AuthMode, "auto">;
  token: string;
  csrfToken?: string;
}

export function inferAuthMode(apiPrefix: string): Exclude<AuthMode, "auto"> {
  return apiPrefix.includes("/plugins/focalboard/") ? "mattermost" : "focalboard";
}

function getSetCookieHeaders(headers: Headers): string[] {
  const anyHeaders = headers as any;
  if (typeof anyHeaders.getSetCookie === "function") {
    const v = anyHeaders.getSetCookie();
    if (Array.isArray(v)) return v;
  }

  const raw = headers.get("set-cookie");
  if (!raw) return [];

  return raw.split(/,(?=[^;\s]+=)/g).map((s) => s.trim()).filter(Boolean);
}

function findCookie(setCookies: string[], name: string): string | undefined {
  for (const sc of setCookies) {
    if (sc.startsWith(`${name}=`)) {
      return sc.slice(name.length + 1).split(";")[0];
    }
  }
  return undefined;
}

interface AuthContext {
  baseUrl: string;
  apiPrefix: string;
  requestedWith?: string;
}

export async function login(ctx: AuthContext, params: LoginParams): Promise<LoginResult> {
  const mode = params.mode && params.mode !== "auto" ? params.mode : inferAuthMode(ctx.apiPrefix);

  if (mode === "mattermost") {
    const login_id = params.loginId || params.username;
    if (!login_id) throw new Error("login requires loginId or username");
    const res = await fetch(`${ctx.baseUrl}/api/v4/users/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(ctx.requestedWith ? { "X-Requested-With": ctx.requestedWith } : {}),
      },
      body: JSON.stringify({ login_id, password: params.password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText })) as Record<string, string>;
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const token = res.headers.get("Token") || res.headers.get("token") || "";
    if (!token) throw new Error("Login succeeded but no Token header returned");

    const setCookies = getSetCookieHeaders(res.headers);
    const csrfToken = findCookie(setCookies, "MMCSRF");

    return { mode, token, csrfToken };
  }

  // Standalone Focalboard login
  const username = params.username || params.loginId;
  if (!username) throw new Error("login requires username or loginId");
  const res = await fetch(`${ctx.baseUrl}${ctx.apiPrefix}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(ctx.requestedWith ? { "X-Requested-With": ctx.requestedWith } : {}),
    },
    body: JSON.stringify({ username, password: params.password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText })) as Record<string, string>;
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  const data = await res.json().catch(() => null) as any;
  const token = data?.token as string | undefined;
  if (!token) throw new Error("Login succeeded but response had no token");
  return { mode, token };
}

interface LogoutContext extends AuthContext {
  token: string;
  csrfToken?: string;
}

export async function logout(ctx: LogoutContext, mode: AuthMode = "auto"): Promise<void> {
  const resolved = mode !== "auto" ? mode : inferAuthMode(ctx.apiPrefix);
  try {
    if (resolved === "mattermost") {
      const headers: Record<string, string> = {};
      if (ctx.token) headers.Authorization = `Bearer ${ctx.token}`;
      if (ctx.csrfToken) headers["X-CSRF-Token"] = ctx.csrfToken;
      if (ctx.requestedWith) headers["X-Requested-With"] = ctx.requestedWith;
      await fetch(`${ctx.baseUrl}/api/v4/users/logout`, { method: "POST", headers });
    } else {
      await fetch(`${ctx.baseUrl}${ctx.apiPrefix}/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(ctx.token ? { Authorization: `Bearer ${ctx.token}` } : {}),
          ...(ctx.requestedWith ? { "X-Requested-With": ctx.requestedWith } : {}),
        },
      });
    }
  } catch {
    // Ignore logout network errors; local clear is the important part.
  }
}
