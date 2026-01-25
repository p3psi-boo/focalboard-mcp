# Focalboard MCP Server

一个基于 Model Context Protocol 的 Focalboard 服务器，为 AI 助手提供与 Focalboard/Kanban 板进行交互的能力。

## 功能特性

- **Board 操作**: 创建、读取、更新、删除、搜索、复制、归档看板
- **Block 操作**: 管理看板中的块（卡片、任务等）
- **批量操作**: 支持批量创建和更新块
- **原子操作**: 确保看板和块操作的事务性
- **认证系统**: 完整的用户认证和权限管理

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
export FOCALBOARD_TOKEN="your-auth-token"
```

或创建 `.env` 文件：

```env
FOCALBOARD_URL=https://your-focalboard-instance.com
FOCALBOARD_TOKEN=your-auth-token
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
- `search_boards`: 搜索看板
- `list_boards`: 列出所有看板
- `copy_board`: 复制看板
- `archive_board`: 归档看板

#### Block 管理工具
- `create_block`: 创建新块（卡片、任务等）
- `get_block`: 获取块详情
- `update_block`: 更新块信息
- `delete_block`: 删除块
- `create_blocks`: 批量创建块
- `update_blocks`: 批量更新块
- `copy_block`: 复制块

#### 组合操作
- `create_board_with_blocks`: 创建看板并添加初始块
- `update_board_and_blocks`: 同时更新看板和多个块

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

#### 数据备份
```
复制看板"项目A"的所有内容到新看板"项目A-备份"
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
├── planning/                         # 详细规划文件
│   ├── types.ts                      # 类型定义
│   ├── tools-spec-*.ts               # 工具规范
│   └── test-cases-*.md               # 测试用例
└── README.md                         # 本文件
```

## 工具分类

### Board 操作（11个工具）
- 创建、读取、更新、删除看板
- 搜索和列出现有看板
- 复制和归档看板
- 管理看板成员（加入/离开）
- 恢复已删除的看板

### Block 操作（7个工具）
- 创建、读取、更新、删除块
- 批量创建和更新块
- 复制现有块
- 恢复已删除的块

### 组合操作（3个工具）
- 原子性的看板+块操作
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
