# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Focalboard MCP Server — a Model Context Protocol server that exposes Focalboard/Mattermost Boards as AI-accessible tools. Built with Bun, TypeScript, Zod 4, and `@modelcontextprotocol/sdk`.

## Commands

```bash
bun run index.ts              # Start MCP server (stdio mode)
MCP_TRANSPORT=http bun run index.ts  # Start in HTTP streamable mode
bun test                      # Run all tests
bun test --watch              # Watch mode
bun test --coverage           # With coverage
bun test test/auth/           # Run tests in a specific directory
bun install                   # Install dependencies
```

Always use Bun, never Node.js/npm/npx. Bun auto-loads `.env` files — don't use dotenv.

## Architecture

### Entry Point & Transport

`src/index.ts` creates the MCP server, a shared `FocalboardClient` instance, and routes to the selected transport. On startup, if `FOCALBOARD_PASSWORD` is set, auto-login runs via `startupAuth()`. Graceful shutdown (SIGINT/SIGTERM/beforeExit) calls `client.logout()`.

Transport modes (controlled by `MCP_TRANSPORT` env var):
- **stdio** (default) — `src/transport/stdio.ts`, wraps `StdioServerTransport`
- **http** — `src/transport/http.ts`, `Bun.serve()` with SSE streaming and per-session server instances

### API Client

`src/client/focalboard.ts` — `FocalboardClient` class wrapping Focalboard's HTTP API. Key patterns:
- **Name resolution**: `resolveBoard(nameOrId)` and `resolveBlock(boardId, nameOrId)` convert human-readable names to IDs. Tools accept names or IDs transparently.
- **Auth modes** (`src/client/auth.ts`): `mattermost` (Mattermost `/api/v4` endpoints with CSRF), `focalboard` (native `/api/v2` with Bearer token), or `auto` (inferred from `FOCALBOARD_API_PREFIX` containing `/plugins/focalboard/`).
- **ID generation**: `generateId()` produces 27-char alphanumeric IDs matching Focalboard's format.

### Tool Registry (16 tools)

Tools use a **side-effect registration pattern**:

1. `src/tools/registry.ts` — Two `Map`s (`definitions` and `handlers`) with `registerTool(definition, handler)`, `getAllToolDefinitions()`, and `getToolHandler(name)`
2. Each tool file (`boards.ts`, `cards.ts`, `blocks.ts`) calls `registerTool()` at module load time
3. `src/tools/index.ts` imports tool files for side effects, then re-exports registry functions

| File | Tools |
|------|-------|
| `boards.ts` | 8 tools (CRUD + list/search + members + team users) |
| `cards.ts` | 4 tools (list/get/create/update) |
| `blocks.ts` | 4 tools (create/get/update/delete) |

**Key tool patterns:**
- `create_card` accepts an optional `description` param that auto-creates a child text block and sets `contentOrder`
- `update_card` does client-side property merging — fetches existing card, merges `properties` → `updatedProperties`, handles `deletedProperties`
- `update_board` transforms `cardProperties` → `updatedCardProperties` for the patch API

### Configuration

`src/config.ts` — Single `config` object reading all env vars at startup with two sections: `config.focalboard` and `config.transport`.

### Types & Schemas

`src/types/` — Zod schemas for runtime validation. Each resource has `*Schema`, `*PatchSchema`, and `Create*Schema`. Types are inferred from Zod with `z.infer<>`.

- `common.ts` — `PropertyOptionSchema`, `PropertyTemplateSchema`, `FocalboardConfig`
- `board.ts` — Board schemas (type field: `"O"` open, `"P"` private)
- `card.ts` — Card schemas
- `block.ts` — Block schemas (14 block types: text, image, view, card, comment, etc.)

### Response Formatting

`src/tools/format.ts` — Formatters (`formatBoard`, `formatCard`, `formatBlock`, `formatMember`) that selectively include fields, omitting empty/null values to minimize token usage.

## Testing

Tests use Bun's built-in test runner (`bun:test`) with `describe`/`test`/`expect`.

| Directory | Purpose |
|-----------|---------|
| `test/auth/` | Auth flow tests (Mattermost + standalone modes) |
| `test/e2e/` | End-to-end lifecycle tests (board, block, batch operations) |
| `test/integration/` | Server integration with mock Focalboard API |
| `test/validation/` | Zod schema validation and error handling |
| `test/performance/` | Stress tests and performance benchmarks |

Test utilities: `test/fixtures.ts` (mock data factories like `createMockBoard()`) and `test/mocks.ts` (`MockHTTPClient` for intercepting HTTP calls).

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `FOCALBOARD_URL` | `http://localhost:8000` | Focalboard base URL |
| `FOCALBOARD_API_PREFIX` | `/api/v2` | API path prefix |
| `FOCALBOARD_TEAM_ID` | `0` | Default team ID |
| `FOCALBOARD_TOKEN` | — | Auth token |
| `FOCALBOARD_PASSWORD` | — | Auto-login password |
| `FOCALBOARD_LOGIN_ID` | — | Mattermost login ID |
| `FOCALBOARD_USERNAME` | — | Focalboard username |
| `FOCALBOARD_AUTH_MODE` | `auto` | `auto`, `mattermost`, or `focalboard` |
| `MCP_TRANSPORT` | `stdio` | `stdio` or `http` |
| `MCP_HTTP_PORT` | `3000` | HTTP mode port |
| `MCP_HTTP_PATH` | `/mcp` | HTTP mode endpoint path |

## Adding a New Tool

1. In the appropriate `src/tools/*.ts` file, call `registerTool(definition, handler)` with the tool schema and async handler function
2. If adding a new resource type: create `src/types/<resource>.ts` with Zod schemas, add formatter in `format.ts`, create `src/tools/<resource>.ts`, and import it for side effects in `src/tools/index.ts`

The registry auto-discovers tools — no manual wiring needed in `src/index.ts`.

## API Reference

The full Focalboard API specification is in `swagger.yml` at the project root.
