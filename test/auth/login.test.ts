import { afterEach, expect, test } from "bun:test";

import { FocalboardClient } from "../../src/client/focalboard";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("Mattermost login extracts Token + MMCSRF and uses them", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];

  globalThis.fetch = (async (input: any, init?: any) => {
    const url = typeof input === "string" ? input : String(input);
    calls.push({ url, init });

    if (url.endsWith("/api/v4/users/login")) {
      const headers = new Headers();
      headers.set("Content-Type", "application/json");
      headers.set("Token", "tok123");
      headers.append("Set-Cookie", "MMAUTHTOKEN=tok123; Path=/; HttpOnly");
      headers.append("Set-Cookie", "MMCSRF=csrf456; Path=/");
      return new Response(JSON.stringify({ id: "u" }), { status: 200, headers });
    }

    if (url.endsWith("/plugins/focalboard/api/v2/teams/team1/boards")) {
      // Our client passes headers as a plain object.
      const headers = init?.headers as Record<string, string> | undefined;
      expect(headers?.Authorization).toBe("Bearer tok123");
      expect(headers?.["X-CSRF-Token"]).toBe("csrf456");
      expect(headers?.["X-Requested-With"]).toBe("XMLHttpRequest");

      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("not found", { status: 404 });
  }) as any;

  const client = new FocalboardClient({
    baseUrl: "http://localhost:8065",
    apiPrefix: "/plugins/focalboard/api/v2",
    token: "",
    requestedWith: "XMLHttpRequest",
  });

  const login = await client.login({
    mode: "mattermost",
    loginId: "bsr",
    password: "12345",
  });

  expect(login.mode).toBe("mattermost");
  expect(login.token).toBe("tok123");
  expect(login.csrfToken).toBe("csrf456");

  await client.listBoards("team1");

  expect(calls[0]?.url).toBe("http://localhost:8065/api/v4/users/login");
  expect(calls[1]?.url).toBe("http://localhost:8065/plugins/focalboard/api/v2/teams/team1/boards");
});
