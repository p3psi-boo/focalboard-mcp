# Focalboard MCP Server

一个基于 Model Context Protocol 的 Focalboard 服务器，为 AI 助手提供与 Focalboard/Kanban 板进行交互的能力。

## 功能特性

- **Board 操作**: 创建、读取、更新、删除、搜索、复制、归档看板
- **Block 操作**: 管理看板中的块（卡片、任务等）
- **批量操作**: 支持批量创建和更新块
- **原子操作**: 确保看板和块操作的事务性
- **认证**: 支持 Token 认证；可选支持启动时使用用户名/密码自动登录

## 技术栈

- **运行时**: [Bun](https://bun.sh) v1.3.5+
- **协议**: [Model Context Protocol](https://modelcontextprotocol.io) SDK v1.25.3
- **验证**: Zod v4.3.6
- **语言**: TypeScript 5+

## 安装

```bash
# 克隆仓库
git clone <repository-url>
cd focalboard-mcp

# 安装依赖
bun install
```

## 快速开始

### 开发模式运行

```bash
bun --hot index.ts
```

### 生产模式运行

```bash
bun run index.ts
```

## 如何使用

### 1. 配置 Focalboard 服务器

首先需要设置 Focalboard 实例的连接信息：

```bash
# 设置环境变量
export FOCALBOARD_URL="https://your-focalboard-instance.com"
export FOCALBOARD_TOKEN="your-auth-token"  # 可选：如果不使用用户名/密码登录

# 可选：Focalboard API 前缀
# - 独立部署（默认）：/api/v2
# - Mattermost 插件：/plugins/focalboard/api/v2
export FOCALBOARD_API_PREFIX="/api/v2"
```

或创建 `.env` 文件：

```env
FOCALBOARD_URL=https://your-focalboard-instance.com
FOCALBOARD_TOKEN=your-auth-token
FOCALBOARD_API_PREFIX=/api/v2
```

#### 启动时使用用户名/密码自动登录（可选）

此服务器默认使用 `FOCALBOARD_TOKEN` 通过 `Authorization: Bearer <token>` 访问。

如果你希望不手动维护 token，可以在启动服务器时提供用户名/密码；服务器会在启动时自动登录，在收到退出信号时（SIGINT/SIGTERM）尽力自动登出。

推荐变量：

```bash
# 其一：Mattermost（常见）
export FOCALBOARD_LOGIN_ID="bsr"
export FOCALBOARD_PASSWORD="12345"

# 其二：独立 Focalboard
export FOCALBOARD_USERNAME="your-username"
export FOCALBOARD_PASSWORD="your-password"

# 可选：强制模式（默认 auto，会根据 apiPrefix 推断）
export FOCALBOARD_AUTH_MODE="auto"  # auto | mattermost | focalboard
```

额外可选环境变量：

```bash
# 如果你想手动提供 CSRF（一般不需要；Mattermost 登录会自动获取 MMCSRF）
export FOCALBOARD_CSRF_TOKEN="your-csrf-token"

# 某些部署需要 X-Requested-With（默认已设置为 XMLHttpRequest）
export FOCALBOARD_REQUESTED_WITH="XMLHttpRequest"
```

### 2. 配置 MCP 客户端

在您的 MCP 客户端配置文件中添加此服务器：

**Claude Desktop 配置示例** (`~/Library/Application Support/Claude/claude_desktop_config.json`):

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

### 3. 使用示例

配置完成后，您可以在对话中直接使用 Focalboard 功能：

#### 创建看板

```
请创建一个名为"项目跟踪"的新看板
```

#### 添加任务

```
在看板"项目跟踪"中添加一个任务：
- 标题：完成 API 设计
- 描述：设计 RESTful API 接口文档
- 状态：进行中
```

#### 查看看板

```
显示"项目跟踪"看板中的所有任务
```

#### 更新任务

```
将任务"完成 API 设计"的状态更新为"已完成"
```

#### 搜索

```
搜索所有包含"API"关键词的任务
```

### 4. 可用工具

服务器提供以下工具类别：

#### Board 管理工具
- `create_board`: 创建新看板
- `get_board`: 获取看板详情
- `update_board`: 更新看板信息
- `delete_board`: 删除看板
- `list_boards`: 列出团队中的所有看板
- `search_boards`: 按标题搜索看板

#### Block 管理工具
- `create_blocks`: 批量创建块（卡片、任务等）
- `get_blocks`: 获取看板中的块（支持按父ID或类型过滤）
- `update_block`: 更新单个块的信息
- `delete_block`: 删除单个块

#### 组合操作
- `insert_boards_and_blocks`: 原子性地同时创建看板和块
- `patch_boards_and_blocks`: 原子性地同时更新看板和块

### 5. 常见用例

#### 项目管理
```
创建一个敏捷开发看板，包含以下列：
- 待办事项
- 进行中
- 代码审查
- 已完成

然后添加5个初始任务卡片
```

#### 任务跟踪
```
显示所有优先级为"高"且状态为"进行中"的任务
```

#### 批量操作

```
将看板"周计划"中的所有未完成任务分配给用户"张三"
```

## 项目结构

```
focalboard-mcp/
├── index.ts                          # 服务器入口点
├── package.json                      # 项目配置
├── tsconfig.json                     # TypeScript 配置
├── swagger.yml                       # Focalboard API 规范
├── CLAUDE.md                         # 开发者指南
├── PLANNING.md                       # 项目规划文档
├── src/                              # 源代码
│   ├── client/                       # Focalboard 客户端
│   ├── tools/                        # MCP 工具实现
│   └── types/                        # 类型定义
├── test/                             # 测试文件
├── planning/                         # 详细规划文件
└── README.md                         # 本文件
```

## 工具分类

### Board 操作（6个工具）
- 创建、读取、更新、删除看板
- 搜索和列出现有看板

### Block 操作（4个工具）
- 批量创建块
- 获取/过滤块
- 更新和删除单个块

### 组合操作（2个工具）
- 原子性的看板+块创建
- 原子性的看板+块更新
- 事务性语义保证

## 开发指南

### 代码风格

项目遵循以下约定：
- 使用 Zod 进行运行时验证和类型推断
- 错误处理遵循 HTTP 状态码规范（404、403、401、500）
- 批量操作使用 `disable_notify` 参数优化性能

### 测试

```bash
# 运行测试
bun test
```

测试策略：
- 单元测试覆盖每个工具
- 集成测试验证 API 调用
- 模拟 Focalboard API 响应
- 全面测试错误场景

### 类型系统

所有类型定义从 Zod schemas 生成，确保：
- 运行时类型安全
- 编译时类型检查
- 与 Swagger 定义保持一致

## 配置

服务器需要连接到 Focalboard 实例。配置方式待定。

## 架构决策

1. **类型系统**: 使用 Zod 进行运行时验证，从 Swagger 定义生成类型
2. **错误处理**: 遵循 HTTP 状态码语义，提供清晰的错误信息
3. **批量操作**: 优化 API 调用，使用 `disable_notify` 减少通知开销
4. **事务性**: 关键操作提供原子性保证

## 贡献指南

欢迎贡献！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可证

待定

## 联系方式

如有问题或建议，请提交 Issue。

---

**注意**: 本项目使用 Bun 运行时，确保使用 `bun` 命令而非 `npm` 或 `yarn`。
