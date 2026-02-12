# Focalboard MCP Server

A [Model Context Protocol](https://modelcontextprotocol.io) server for [Focalboard](https://www.focalboard.com) / Mattermost Boards, giving AI assistants full access to boards, cards, and blocks.

## Features

- **Board management** — create, read, update, delete, search, list (team ID auto-loaded from env)
- **Card management** — list, get, create (with inline description), update with property merging
- **Block management** — CRUD for text, images, views, and all other block types
- **Member & user tools** — list board members and team users
- **Dual transport** — Stdio and HTTP Streamable MCP transports
- **Flexible auth** — direct token, or username/password auto-login (supports Mattermost)

## Tech Stack

| Component | Version |
|-----------|---------|
| [Bun](https://bun.sh) | v1.3.5+ |
| [MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk) | v1.25.3 |
| [Zod](https://zod.dev) | v4.3.6 |
| TypeScript | 5+ |

## Architecture

### High-Level Overview

```mermaid
graph TB
    AI[AI Assistant<br>Claude / GPT / etc.]

    subgraph MCP Server
        Transport[Transport Layer<br>stdio · HTTP+SSE]
        Server[MCP Server<br>@modelcontextprotocol/sdk]
        Registry[Tool Registry<br>16 tools]
        Client[FocalboardClient<br>HTTP API wrapper]
        Auth[Auth Module<br>login · logout]
        Config[Config<br>centralized env vars]
    end

    FB[Focalboard / Mattermost<br>REST API]

    AI <-->|MCP Protocol| Transport
    Transport <--> Server
    Server -->|CallToolRequest| Registry
    Registry -->|handler fn| Client
    Client -->|delegates| Auth
    Client -->|HTTP| FB
    Config -.->|reads env once| Server
    Config -.-> Registry
    Config -.-> Client
```

### Startup Sequence

```mermaid
sequenceDiagram
    participant Env as Environment
    participant Config as config.ts
    participant Index as index.ts
    participant Auth as auth.ts
    participant Client as FocalboardClient
    participant FB as Focalboard API
    participant Transport as Transport Layer

    Env->>Config: process.env.*
    Config-->>Index: config object

    Index->>Client: new FocalboardClient(config)

    alt password is set
        Index->>Client: client.login(params)
        Client->>Auth: login(ctx, params)
        Auth->>FB: POST /api/v4/users/login (Mattermost)<br>or POST /api/v2/login (standalone)
        FB-->>Auth: token + CSRF cookie
        Auth-->>Client: LoginResult
        Client->>Client: setAuth(token, csrfToken)
    end

    Index->>Index: createServer()
    Index->>Index: register signal handlers

    alt MCP_TRANSPORT = "http"
        Index->>Transport: startHttpTransport(createServer, config)
        Transport->>Transport: Bun.serve() on port 3000
    else MCP_TRANSPORT = "stdio" (default)
        Index->>Transport: startStdioTransport(server)
        Transport->>Transport: StdioServerTransport.connect()
    end
```

### Tool Call Request Flow

```mermaid
sequenceDiagram
    participant AI as AI Assistant
    participant MCP as MCP Server
    participant Registry as Tool Registry
    participant Handler as Tool Handler fn
    participant Client as FocalboardClient
    participant FB as Focalboard API

    AI->>MCP: CallToolRequest { name: "create_card", args }
    MCP->>Registry: getToolHandler("create_card")
    Registry-->>MCP: handler function
    MCP->>Handler: handler(client, args)

    Handler->>Client: resolveBoard("Sprint Planning", teamId)
    Client->>FB: GET /boards/search?q=Sprint+Planning
    FB-->>Client: [{ id: "abc123", title: "Sprint Planning", ... }]
    Client-->>Handler: Board { id: "abc123" }

    Handler->>Client: createCard("abc123", data)
    Client->>FB: POST /boards/abc123/cards
    FB-->>Client: Card { id: "card456", ... }

    opt description provided
        Handler->>Client: createBlocks("abc123", [text block])
        Client->>FB: POST /boards/abc123/blocks
        FB-->>Client: Block[]
        Handler->>Client: updateCard("card456", { contentOrder })
        Client->>FB: PATCH /cards/card456
        FB-->>Client: Card (updated)
    end

    Handler-->>MCP: formatted result
    MCP-->>AI: CallToolResult { content: [{ type: "text", text: "..." }] }
```

### Tool Registry Pattern

```mermaid
graph LR
    subgraph "Module Load (side effects)"
        B[boards.ts] -->|registerTool × 8| R[Registry Map]
        C[cards.ts] -->|registerTool × 4| R
        K[blocks.ts] -->|registerTool × 4| R
    end

    subgraph "Runtime"
        R -->|getAllToolDefinitions| LS[ListToolsRequest]
        R -->|getToolHandler name| CT[CallToolRequest]
    end

    style R fill:#f9f,stroke:#333
```

### Module Dependency Graph

```mermaid
graph TD
    index[src/index.ts<br>entry point]
    config[src/config.ts<br>env vars]
    client[src/client/focalboard.ts<br>API client]
    auth[src/client/auth.ts<br>login / logout]
    toolsIdx[src/tools/index.ts<br>re-exports registry]
    registry[src/tools/registry.ts<br>tool Map]
    boards[src/tools/boards.ts<br>8 board tools]
    cards[src/tools/cards.ts<br>4 card tools]
    blocks[src/tools/blocks.ts<br>4 block tools]
    format[src/tools/format.ts<br>response formatters]
    types[src/types/<br>Zod schemas]
    httpT[src/transport/http.ts<br>Bun.serve + SSE]
    stdioT[src/transport/stdio.ts<br>StdioServerTransport]

    index --> config
    index --> client
    index --> toolsIdx
    index --> httpT
    index --> stdioT

    client --> auth
    client --> types

    toolsIdx --> registry
    toolsIdx --> boards
    toolsIdx --> cards
    toolsIdx --> blocks

    boards --> registry
    boards --> config
    boards --> format
    boards --> types
    cards --> registry
    cards --> config
    cards --> format
    cards --> types
    blocks --> registry
    blocks --> config
    blocks --> format
    blocks --> types

    style index fill:#ffd,stroke:#333
    style registry fill:#f9f,stroke:#333
    style config fill:#dfd,stroke:#333
    style auth fill:#ddf,stroke:#333
```

### HTTP Transport Session Management

```mermaid
sequenceDiagram
    participant C1 as Client A
    participant C2 as Client B
    participant HTTP as HTTP Transport
    participant S1 as MCP Server (session-1)
    participant S2 as MCP Server (session-2)

    C1->>HTTP: POST /mcp { method: "initialize" }
    HTTP->>HTTP: create new transport + session ID
    HTTP->>S1: server.connect(transport)
    HTTP-->>C1: 200 + Mcp-Session-Id: session-1

    C2->>HTTP: POST /mcp { method: "initialize" }
    HTTP->>S2: new server + transport
    HTTP-->>C2: 200 + Mcp-Session-Id: session-2

    C1->>HTTP: POST /mcp { tool call }<br>Mcp-Session-Id: session-1
    HTTP->>S1: transport.handleRequest()
    S1-->>C1: SSE stream with result

    C1->>HTTP: GET /mcp<br>Mcp-Session-Id: session-1
    HTTP->>S1: SSE reconnect
    S1-->>C1: SSE event stream

    C1->>HTTP: DELETE /mcp<br>Mcp-Session-Id: session-1
    HTTP->>HTTP: sessions.delete("session-1")
    HTTP-->>C1: 200
```

### Authentication Modes

```mermaid
flowchart TD
    Start[client.login] --> Mode{auth mode?}

    Mode -->|"auto"| Infer{apiPrefix contains<br>/plugins/focalboard/?}
    Infer -->|yes| MM
    Infer -->|no| FB

    Mode -->|"mattermost"| MM[Mattermost Auth]
    Mode -->|"focalboard"| FB[Focalboard Auth]

    MM --> MM1[POST /api/v4/users/login<br>body: login_id + password]
    MM1 --> MM2[Extract Token header<br>+ MMCSRF cookie]
    MM2 --> Done[setAuth token + csrfToken]

    FB --> FB1[POST /api/v2/login<br>body: username + password]
    FB1 --> FB2[Extract token from<br>JSON response]
    FB2 --> Done
```

## Installation

```bash
git clone https://github.com/p3psi-boo/focalboard-mcp.git
cd focalboard-mcp
bun install
```

## Quick Start

### Stdio mode (default)

```bash
bun run index.ts
```

### HTTP Streamable mode

```bash
MCP_TRANSPORT=http bun run index.ts
```

Server listens on `http://localhost:3000/mcp` by default.

## Environment Variables

### Focalboard Connection

| Variable | Description | Default |
|----------|-------------|---------|
| `FOCALBOARD_URL` | Focalboard instance URL | `http://localhost:8000` |
| `FOCALBOARD_API_PREFIX` | API path prefix | `/api/v2` |
| `FOCALBOARD_TEAM_ID` | Default team ID (for list/create) | `0` |
| `FOCALBOARD_TOKEN` | Auth token | — |
| `FOCALBOARD_CSRF_TOKEN` | CSRF token (usually not needed manually) | — |
| `FOCALBOARD_REQUESTED_WITH` | `X-Requested-With` header | `XMLHttpRequest` |

### Auto-login (optional)

When a password is set, the server logs in at startup and logs out on exit.

| Variable | Description |
|----------|-------------|
| `FOCALBOARD_PASSWORD` | Login password |
| `FOCALBOARD_LOGIN_ID` | Mattermost login ID |
| `FOCALBOARD_USERNAME` | Focalboard username |
| `FOCALBOARD_AUTH_MODE` | Auth mode: `auto` (default) / `mattermost` / `focalboard` |

> `FOCALBOARD_PASSWORD` must be paired with either `FOCALBOARD_LOGIN_ID` or `FOCALBOARD_USERNAME`.

### Transport

| Variable | Description | Default |
|----------|-------------|---------|
| `MCP_TRANSPORT` | Transport mode: `stdio` / `http` | `stdio` |
| `MCP_HTTP_PORT` | HTTP mode listen port | `3000` |
| `MCP_HTTP_PATH` | HTTP mode endpoint path | `/mcp` |

## MCP Client Configuration

### Claude Desktop (Stdio mode)

`~/Library/Application Support/Claude/claude_desktop_config.json`:

**Standalone Focalboard:**

```json
{
  "mcpServers": {
    "focalboard": {
      "command": "bun",
      "args": ["/path/to/focalboard-mcp/index.ts"],
      "env": {
        "FOCALBOARD_URL": "https://your-focalboard-instance.com",
        "FOCALBOARD_TOKEN": "your-auth-token"
      }
    }
  }
}
```

**Focalboard as Mattermost plugin:**

```json
{
  "mcpServers": {
    "focalboard": {
      "command": "bun",
      "args": ["/path/to/focalboard-mcp/index.ts"],
      "env": {
        "FOCALBOARD_URL": "https://your-mattermost-instance.com",
        "FOCALBOARD_API_PREFIX": "/plugins/focalboard/api/v2",
        "FOCALBOARD_TOKEN": "your-auth-token",
        "FOCALBOARD_REQUESTED_WITH": "XMLHttpRequest"
      }
    }
  }
}
```

### Claude Code

`~/.claude/settings.json` or project `.mcp.json`:

**Standalone Focalboard:**

```json
{
  "mcpServers": {
    "focalboard": {
      "command": "bun",
      "args": ["/path/to/focalboard-mcp/index.ts"],
      "env": {
        "FOCALBOARD_URL": "https://your-focalboard-instance.com",
        "FOCALBOARD_TOKEN": "your-auth-token"
      }
    }
  }
}
```

**Focalboard as Mattermost plugin:**

```json
{
  "mcpServers": {
    "focalboard": {
      "command": "bun",
      "args": ["/path/to/focalboard-mcp/index.ts"],
      "env": {
        "FOCALBOARD_URL": "https://your-mattermost-instance.com",
        "FOCALBOARD_API_PREFIX": "/plugins/focalboard/api/v2",
        "FOCALBOARD_TOKEN": "your-auth-token",
        "FOCALBOARD_REQUESTED_WITH": "XMLHttpRequest"
      }
    }
  }
}
```

> **Tip:** When running Focalboard as a Mattermost plugin, `FOCALBOARD_API_PREFIX` must be set to `/plugins/focalboard/api/v2`. `FOCALBOARD_REQUESTED_WITH` set to `XMLHttpRequest` is required by Mattermost's CSRF protection. For auto-login, you can use `FOCALBOARD_LOGIN_ID` + `FOCALBOARD_PASSWORD` instead of `FOCALBOARD_TOKEN`.

### HTTP Streamable mode

Start the server, then point your MCP client to `http://localhost:3000/mcp` (or your custom address).

HTTP mode supports:
- Stateful session management (auto-assigned Session ID)
- SSE streaming
- Concurrent multi-client connections
- `DELETE` request to clean up sessions

## Available Tools

> All parameters accept **names** instead of IDs. The server resolves names to IDs automatically. Responses include only essential fields to save tokens.

### Board Tools (8)

| Tool | Required params | Description |
|------|----------------|-------------|
| `create_board` | `title` | Create a new board |
| `get_board` | `board` | Get board details by name or ID |
| `update_board` | `board`, `patch` | Update board properties |
| `delete_board` | `board` | Delete a board |
| `list_boards` | _(none)_ | List all boards (optional `query` to search by title) |
| `search_boards` | `query` | Search boards across all teams |
| `get_board_members` | `board` | List members of a board |
| `list_team_users` | _(none)_ | List all users in a team |

### Card Tools (4)

| Tool | Required params | Description |
|------|----------------|-------------|
| `list_cards` | `board` | List cards with pagination (`page`, `per_page`) |
| `get_card` | `card` | Get a single card with all properties |
| `create_card` | `board` | Create a card with properties and optional `description` (auto-creates text block + contentOrder) |
| `update_card` | `card`, `patch` | Update card title, icon, or properties (merges incrementally) |

### Block Tools (4)

| Tool | Required params | Description |
|------|----------------|-------------|
| `create_block` | `board`, `type` | Create a block (text, image, card, view, divider, checkbox, h1-h3, etc.) |
| `get_blocks` | `board` | Get blocks from a board (optional `type` and `parent` filters) |
| `update_block` | `board`, `block`, `patch` | Update a block |
| `delete_block` | `board`, `block` | Delete a block |

## Usage Examples

```
Create a new board called "Sprint Planning"
```

```
Create a card on "Sprint Planning" with title "Design API schema" and description "Define the REST endpoints and request/response models for the new service"
```

```
List all cards on the "Sprint Planning" board
```

```
Update the card "Design API schema" — set status to "In Progress"
```

## Project Structure

```
focalboard-mcp/
├── index.ts                  # Entry point (re-export)
├── src/
│   ├── index.ts              # Server startup, auth bootstrap, transport selection
│   ├── config.ts             # Centralized environment variable config
│   ├── client/
│   │   ├── focalboard.ts     # Focalboard HTTP API client (CRUD + resolution)
│   │   └── auth.ts           # Authentication (login/logout, cookie parsing)
│   ├── tools/
│   │   ├── registry.ts       # Tool registry (Map-based registerTool pattern)
│   │   ├── boards.ts         # 8 board tools (registered at import)
│   │   ├── cards.ts          # 4 card tools (registered at import)
│   │   ├── blocks.ts         # 4 block tools (registered at import)
│   │   ├── format.ts         # Response formatting utilities
│   │   └── index.ts          # Side-effect imports + registry re-exports
│   ├── transport/
│   │   ├── http.ts           # HTTP Streamable transport (Bun.serve + SSE)
│   │   └── stdio.ts          # Stdio transport wrapper
│   └── types/
│       ├── board.ts          # Board Zod schemas
│       ├── card.ts           # Card Zod schemas
│       ├── block.ts          # Block Zod schemas
│       ├── common.ts         # Shared types (FocalboardConfig, PropertyOption, etc.)
│       └── index.ts          # Type re-exports
├── test/                     # Test files
├── swagger.yml               # Focalboard API specification
├── package.json
└── tsconfig.json
```

## Development

```bash
# Hot-reload development
bun --hot index.ts

# Run tests
bun test

# Watch mode tests
bun test --watch

# Test coverage
bun test --coverage
```

## License

MIT
