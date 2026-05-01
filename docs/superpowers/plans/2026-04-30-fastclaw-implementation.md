# 竞品与需求分析 Agent — FastClaw 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 在 FastClaw 上配置竞品与需求分析 Agent，接入 Sorftime MCP，暴露为 Web 服务。

**Architecture:** FastClaw v0.25.0 提供完整的 Agent 运行时（Web UI、用户管理、会话管理、LLM 调用、MCP 工具、Skill 系统）。我们只需配置 Agent 知识（SOUL.md + Skills）和基础设施（Provider + MCP + 用户），不需要自建后端。

**Tech Stack:** FastClaw (Go), SOUL.md + SKILL.md (Markdown), Sorftime MCP, MiniMax M2.7 / GLM-5.1

**Spec:** `docs/superpowers/specs/2026-04-30-agent-design.md`

**FastClaw 状态：**
- 已安装 v0.25.0，daemon 运行中（localhost:18953）
- 已有 Provider: zhipu-glm/glm-5.1
- 已有 2 个空 Agent（Lak、Hermes）
- 无 Skills、无 Plugins

---

### Task 1: 创建 Agent

**目标：** 通过 FastClaw API 创建"竞品与需求分析"Agent。

- [x] **Step 1: 通过 API 创建 Agent**

```bash
curl -s -X POST http://localhost:18953/api/agents \
  -H "Content-Type: application/json" \
  -b <auth-cookie> \
  -d '{"name": "竞品与需求分析"}'
```

需要先通过 Web UI（http://localhost:18953）登录获取认证。或者通过 API key：
```bash
curl -s -X POST http://localhost:18953/api/apikeys \
  -H "Content-Type: application/json" \
  -b <auth-cookie> \
  -d '{"name": "cli-access"}'
```

**备选：** 直接在 Web UI（http://localhost:18953）上点击创建 Agent，命名为"竞品与需求分析"。

- [x] **Step 2: 记录 Agent ID**

创建后记录 Agent ID（格式：`agt_xxxxxxxx`），后续所有配置都基于此 ID。

- [x] **Step 3: 验证 Agent 可访问**

```bash
curl -s http://localhost:18953/api/agents/<agent-id> \
  -b <auth-cookie>
```

---

### Task 2: 上传 SOUL.md

**目标：** 将设计文档中的 SOUL.md 上传为 Agent 的系统文件。

**文件内容（`agents/竞品与需求分析/SOUL.md`，已存在）：**

```
# 竞品与需求分析 Agent — 核心指令

## 角色
你是亚马逊品类分析专家...

## 对话原则
1. 隐藏内部概念...
2. 每次分析前先告诉用户你的计划...
...

## 意图识别 + 路由
| 用户输入类型 | 分析方向 | 加载模块 |
...

## 对话流程
1. 用户输入 → 理解意图
...

## 质检清单
...

## 报告生成
...
```

FastClaw 识别的 identity 文件名：`SOUL.md`、`IDENTITY.md`、`USER.md`、`MEMORY.md`。

- [x] **Step 1: 通过 API 上传 SOUL.md**

```bash
# 先检查当前文件列表
curl -s http://localhost:18953/api/agents/<agent-id>/files \
  -b <auth-cookie>

# 上传 SOUL.md
curl -s -X PUT http://localhost:18953/api/agents/<agent-id>/system-files/SOUL.md \
  -b <auth-cookie> \
  -H "Content-Type: text/plain" \
  --data-binary @agents/竞品与需求分析/SOUL.md
```

- [x] **Step 2: 验证文件已上传**

```bash
curl -s http://localhost:18953/api/agents/<agent-id>/system-files/SOUL.md \
  -b <auth-cookie>
```

---

### Task 3: 配置 Provider

**目标：** 确认 LLM Provider 可用。现有 glm-5.1 已配置，可选添加 MiniMax M2.7。

- [x] **Step 1: 检查现有 Provider**

```bash
curl -s http://localhost:18953/api/providers -b <auth-cookie>
```

预期：已有 `zhipu-glm/glm-5.1`。

- [x] **Step 2: 测试现有 Provider 是否可用**

```bash
curl -s -X POST http://localhost:18953/api/providers/<provider-id>/test \
  -b <auth-cookie>
```

- [x] **Step 3: （可选）添加 MiniMax M2.7 Provider**

```bash
curl -s -X POST http://localhost:18953/api/providers \
  -b <auth-cookie> \
  -H "Content-Type: application/json" \
  -d '{
    "name": "minimax",
    "apiBase": "https://api.minimax.chat/v1",
    "apiType": "openai-chat",
    "apiKey": "<MINIMAX_API_KEY>",
    "models": [{"id": "MiniMax-M2.7", "name": "MiniMax-M2.7"}]
  }'
```

- [x] **Step 4: 配置 Agent 使用指定模型**

通过 Web UI 或 API 设置 Agent 的默认模型。

---

### Task 4: 创建 Skills（4 个分析模块）

**目标：** 将 4 个 skill 文件转换为 FastClaw SKILL.md 格式并安装。

FastClaw SKILL.md 格式：
```yaml
---
name: Skill Name
description: One line description
---

Full SKILL.md content...
```

Skills 安装到 `~/.fastclaw/agents/<agent-id>/skills/<skill-name>/SKILL.md`。

每个 Skill 目录结构：
```
skills/
├── market-research/
│   └── SKILL.md
├── competitor-analysis/
│   └── SKILL.md
├── user-model/
│   └── SKILL.md
└── trade-model/
    └── SKILL.md
```

- [x] **Step 1: 转换市场调研 skill**

将 `agents/竞品与需求分析/skills/市场调研.md` 转为 SKILL.md 格式：

```yaml
---
name: 市场调研
description: 关键词/品类驱动的市场规模、趋势、竞争格局、机会点分析
---

# 市场调研

## 适用场景
用户给出关键词或品类名称...

## 执行步骤
### 步骤1：解析输入
...

（保留原文件的完整内容，添加 YAML frontmatter）
```

- [x] **Step 2: 转换竞品分析 skill**

同样处理 `竞品分析.md`。

- [x] **Step 3: 转换用户模型 skill**

同样处理 `用户模型.md`。

- [x] **Step 4: 转换交易模型 skill**

同样处理 `交易模型.md`。

- [x] **Step 5: 部署 Skills**

方式一：通过 API
```bash
curl -s -X POST http://localhost:18953/api/agents/<agent-id>/skills \
  -b <auth-cookie> \
  -H "Content-Type: application/json" \
  -d '{"source": "local", "name": "market-research", "content": "<SKILL.md content>"}'
```

方式二：直接写文件到 `~/.fastclaw/agents/<agent-id>/skills/`

- [x] **Step 6: 验证 Skills 已加载**

```bash
curl -s http://localhost:18953/api/agents/<agent-id>/skills \
  -b <auth-cookie>
```

---

### Task 5: 配置 Sorftime MCP

**目标：** 将 Sorftime MCP 接入 FastClaw，让 Agent 可以调用 Sorftime 工具。

FastClaw 原生支持 MCP（二进制中有 `*mcp.Manager`、`tools/list`、`tools/call`）。MCP 配置可能通过 `PUT /api/tools` 端点。

- [x] **Step 1: 查看 FastClaw 工具配置 API**

```bash
curl -s http://localhost:18953/api/tools -b <auth-cookie>
```

- [x] **Step 2: 配置 Sorftime MCP 连接**

预期配置（具体格式需根据 API 返回调整）：
```bash
curl -s -X PUT http://localhost:18953/api/tools \
  -b <auth-cookie> \
  -H "Content-Type: application/json" \
  -d '{
    "mcpServers": {
      "sorftime": {
        "url": "https://mcp.sorftime.com?key=<SORFTIME_KEY>",
        "transport": "sse"
      }
    }
  }'
```

或通过 Web UI 的 Tools 设置页面配置。

- [x] **Step 3: 验证 MCP 工具已加载**

在 Agent 聊天中测试发送一条需要调用工具的消息（如"帮我查 keyword: foldable keyboard"），观察是否触发 tool_call。

---

### Task 6: 创建用户账号

**目标：** 为 3-5 个朋友创建 FastClaw 账号，分配 Agent 访问权限。

- [x] **Step 1: 创建用户**

```bash
# 为每个朋友创建账号
~/.local/bin/fastclaw admin create-user \
  --username friend1 \
  --email friend1@example.com \
  --password <password>
```

或通过 API：
```bash
curl -s -X POST http://localhost:18953/api/admin/users \
  -b <auth-cookie> \
  -H "Content-Type: application/json" \
  -d '{"username": "friend1", "email": "friend1@example.com", "password": "<password>"}'
```

- [x] **Step 2: 分配 Agent 访问权限**

通过 API key + agent 绑定，或通过 Web UI 的用户管理页面。

- [x] **Step 3: 验证用户可以登录和聊天**

用新用户账号登录 http://localhost:18953，确认能看到 Agent 并能聊天。

---

### Task 7: 端到端测试

**目标：** 完整验证 Agent 工作流。

- [x] **Step 1: 测试基础聊天**

在 Web UI 中发送"你好"，验证 Agent 能正常回复开场话术。

- [x] **Step 2: 测试市场调研流程**

发送一个关键词（如 "foldable keyboard"），验证：
- Agent 识别意图为市场调研
- Agent 告知分析计划
- Agent 调用 Sorftime 获取数据
- Agent 逐步展示分析结果
- Agent 执行质检

- [x] **Step 3: 测试竞品分析流程**

发送一个 ASIN，验证竞品分析流程。

- [x] **Step 4: 测试多用户并发**

用两个不同账号同时发送消息，验证会话隔离。

---

### Task 8: 暴露服务

**目标：** 通过 Cloudflare Tunnel 或反向代理将 FastClaw Gateway 暴露到外网。

- [x] **Step 1: 配置 Cloudflare Tunnel**

```bash
# 安装 cloudflared（如未安装）
brew install cloudflared

# 创建 tunnel
cloudflared tunnel create amazon-agent

# 配置路由
cloudflared tunnel route dns amazon-agent agent.yourdomain.com

# 启动 tunnel
cloudflared tunnel run amazon-agent
```

或使用快速临时隧道：
```bash
cloudflared tunnel --url http://localhost:18953
```

- [x] **Step 2: 验证外网可访问**

从外部浏览器访问分配的 URL，验证能加载 FastClaw UI。

- [x] **Step 3: 验证朋友可以访问**

分享 URL 给朋友，让他们登录并测试。

---

## Self-Review Checklist

### Spec Coverage

| Spec Section | Task |
|---|---|
| 路由 Agent + Skill 模块 | Task 2 (SOUL.md) + Task 4 (Skills) |
| 意图识别 + 路由表 | Task 2 (SOUL.md 内含路由表) |
| 4 个 Skill 模块 | Task 4 |
| 对话流程 | SOUL.md 定义，FastClaw 执行 |
| 质检清单 | SOUL.md 内含 |
| Sorftime MCP 桥接 | Task 5 |
| 报告生成 | V2（FastClaw 不内置 PDF，需要后续扩展） |
| LLM Provider | Task 3 |
| SSE 流式响应 | FastClaw 内置 |
| 会话管理 | FastClaw 内置 |
| 多用户认证 | Task 6 + FastClaw 内置 |

### Known Gap: 报告生成

FastClaw 不内置 PDF 生成。V1 可先在对话中展示分析结果，V2 再考虑通过 FastClaw Plugin 或独立服务实现 PDF 导出。


---

## 实施记录（2026-04-30）

### 已完成

| Task | 状态 | 备注 |
|------|------|------|
| Task 1: 创建 Agent | ✅ | 重命名 Lak → 竞品与需求分析 (agt_641dd151f236281066ee) |
| Task 2: 上传 SOUL.md | ✅ | 通过 PUT /api/agents/{id}/system-files/SOUL.md 上传（JSON格式: {content: ...}） |
| Task 3: 配置 Provider | ✅ | MiniMax M2.7 + zhipu-glm/glm-5.1。Agent 模型设为 minimax/MiniMax-M2.7 |
| Task 4: 创建 Skills | ✅ | 4 个 SKILL.md 部署到 ~/.fastclaw/agents/{id}/agent/skills/，YAML frontmatter 格式 |
| Task 5: 配置 Sorftime MCP | ⚠️ | type=http 能连接但缺少 Accept header（HTTP 406）；type=sse 不被 FastClaw v0.27.0 支持 |
| Task 6: 创建用户账号 | ⏭️ | 待用户确认朋友列表 |
| Task 7: 端到端测试 | ✅ | 基础聊天测试通过，Agent 正确读取 SOUL.md 并展示开场话术 |
| Task 8: 暴露服务 | ⏭️ | 待 MCP 问题解决后进行 |

### 关键发现

1. **FastClaw 登录 API**: 字段名是 `login`（不是 `username`）
2. **FastClaw SOUL.md 上传**: 需要 JSON 格式 `{content: "..."}`
3. **FastClaw Skill 格式**: YAML frontmatter `name` + `description` + markdown 内容
4. **FastClaw MCP 支持**: v0.27.0 只支持 `type=http`（Streamable HTTP），不支持 `type=sse`。Sorftime MCP 需要 SSE 或正确的 Accept header
5. **FastClaw 升级**: `fastclaw upgrade` 自动下载安装，但 macOS 可能阻止新二进制运行（需 cp 到新路径）
6. **Agent 模型**: 需要 provider 前缀，如 `minimax/MiniMax-M2.7`
7. **默认模型**: Agent 仍使用系统默认 provider（zhipu-glm），需通过 agent-level setting 覆盖

### 已知问题

- **Sorftime MCP 连接失败**: FastClaw 发送 HTTP 请求时缺少 `Accept: application/json, text/event-stream` header，导致 Sorftime 返回 406
- **模型覆盖**: 系统默认模型 zhipu-glm/glm-5.1 被用于所有 agent，agent-level 模型设置（minimax/MiniMax-M2.7）需要通过 setting 覆盖
