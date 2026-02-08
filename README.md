# Focalboard MCP Server

一个基于 [Model Context Protocol](https://modelcontextprotocol.io) 的 [Focalboard](https://www.focalboard.com) 服务器，为 AI 助手提供与 Focalboard 看板交互的能力。

## 功能特性

- **Board 管理** — 创建、读取、更新、删除、搜索、列表
- **Block 管理** — 卡片 / 任务的 CRUD 及批量操作
- **组合操作** — 原子性地同时创建或更新看板与块
- **双传输模式** — 支持 Stdio 和 HTTP Streamable 两种 MCP 传输方式
- **灵活认证** — Token 直接认证 或 用户名/密码自动登录（支持 Mattermost）

## 技术栈

| 组件 | 版本 |
|------|------|
| [Bun](https://bun.sh) | v1.3.5+ |
| [MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk) | v1.25.3 |
| [Zod](https://zod.dev) | v4.3.6 |
| TypeScript | 5+ |

## 安装

```bash
git clone https://github.com/p3psi-boo/focalboard-mcp.git
cd focalboard-mcp
bun install
```

## 快速开始

### Stdio 模式（默认）

```bash
bun run index.ts
```

### HTTP Streamable 模式

```bash
MCP_TRANSPORT=http bun run index.ts
```

服务器默认监听 `http://localhost:3000/mcp`。

## 环境变量

### Focalboard 连接

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `FOCALBOARD_URL` | Focalboard 实例地址 | `http://localhost:8000` |
| `FOCALBOARD_API_PREFIX` | API 路径前缀 | `/api/v2` |
| `FOCALBOARD_TOKEN` | 认证 Token | — |
| `FOCALBOARD_CSRF_TOKEN` | CSRF Token（一般不需要手动设置） | — |
| `FOCALBOARD_REQUESTED_WITH` | `X-Requested-With` 请求头 | `XMLHttpRequest` |

### 自动登录（可选）

设置密码后服务器启动时自动登录，退出时自动登出。

| 变量 | 说明 |
|------|------|
| `FOCALBOARD_PASSWORD` | 登录密码 |
| `FOCALBOARD_LOGIN_ID` | Mattermost 登录 ID |
| `FOCALBOARD_USERNAME` | Focalboard 用户名 |
| `FOCALBOARD_AUTH_MODE` | 认证模式：`auto`（默认）/ `mattermost` / `focalboard` |

> `FOCALBOARD_PASSWORD` 必须与 `FOCALBOARD_LOGIN_ID` 或 `FOCALBOARD_USERNAME` 之一配合使用。

### 传输模式

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `MCP_TRANSPORT` | 传输模式：`stdio` / `http` | `stdio` |
| `MCP_HTTP_PORT` | HTTP 模式监听端口 | `3000` |
| `MCP_HTTP_PATH` | HTTP 模式端点路径 | `/mcp` |

## MCP 客户端配置

### Claude Desktop（Stdio 模式）

`~/Library/Application Support/Claude/claude_desktop_config.json`:

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

### HTTP Streamable 模式

启动服务器后，将 MCP 客户端指向 `http://localhost:3000/mcp`（或你自定义的地址）。

HTTP 模式支持：
- 有状态会话管理（自动分配 Session ID）
- SSE 流式传输
- 多客户端并发连接
- `DELETE` 请求清理会话

## 可用工具

### Board 管理（6 个）

| 工具 | 说明 |
|------|------|
| `create_board` | 在团队中创建新看板 |
| `get_board` | 获取看板详情 |
| `update_board` | 更新看板属性 |
| `delete_board` | 删除看板 |
| `list_boards` | 列出团队中所有看板 |
| `search_boards` | 按标题搜索看板 |

### Block 管理（4 个）

| 工具 | 说明 |
|------|------|
| `create_blocks` | 批量创建块（卡片、任务等） |
| `get_blocks` | 获取看板中的块（可按父 ID 或类型过滤） |
| `update_block` | 更新单个块 |
| `delete_block` | 删除单个块 |

### 组合操作（2 个）

| 工具 | 说明 |
|------|------|
| `insert_boards_and_blocks` | 原子性地同时创建看板和块 |
| `patch_boards_and_blocks` | 原子性地同时更新看板和块 |

## 使用示例

```
请创建一个名为"项目跟踪"的新看板
```

```
在看板中添加一个任务：标题"完成 API 设计"，状态"进行中"
```

```
搜索所有包含"API"关键词的看板
```

## 项目结构

```
focalboard-mcp/
├── index.ts              # 入口（re-export）
├── src/
│   ├── index.ts          # 服务器启动与传输层
│   ├── client/
│   │   └── focalboard.ts # Focalboard API 客户端
│   ├── tools/
│   │   ├── boards.ts     # Board 工具定义与处理
│   │   ├── blocks.ts     # Block 工具定义与处理
│   │   └── combined.ts   # 组合操作工具
│   └── types/
│       ├── board.ts      # Board Zod schemas
│       ├── block.ts      # Block Zod schemas
│       └── common.ts     # 公共类型
├── test/                 # 测试文件
├── swagger.yml           # Focalboard API 规范
├── package.json
└── tsconfig.json
```

## 开发

```bash
# 热重载开发
bun --hot index.ts

# 运行测试
bun test

# 监听模式测试
bun test --watch

# 测试覆盖率
bun test --coverage
```

## 许可证

MIT
