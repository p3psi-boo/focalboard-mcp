import type { AuthMode } from "./client/auth";

export const config = {
  focalboard: {
    baseUrl: process.env.FOCALBOARD_URL || "http://localhost:8000",
    apiPrefix: process.env.FOCALBOARD_API_PREFIX || "/api/v2",
    token: process.env.FOCALBOARD_TOKEN || "",
    csrfToken: process.env.FOCALBOARD_CSRF_TOKEN,
    requestedWith: process.env.FOCALBOARD_REQUESTED_WITH || "XMLHttpRequest",
    teamId: process.env.FOCALBOARD_TEAM_ID || "0",
    authMode: (process.env.FOCALBOARD_AUTH_MODE as AuthMode | undefined) || "auto",
    password: process.env.FOCALBOARD_PASSWORD,
    loginId: process.env.FOCALBOARD_LOGIN_ID,
    username: process.env.FOCALBOARD_USERNAME,
  },
  transport: {
    mode: process.env.MCP_TRANSPORT || "stdio",
    httpPort: parseInt(process.env.MCP_HTTP_PORT || "3000", 10),
    httpPath: process.env.MCP_HTTP_PATH || "/mcp",
  },
} as const;
