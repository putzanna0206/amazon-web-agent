# Amazon Web Agent

> 竞品与需求分析 Web Agent — 基于 FastClaw 的亚马逊品类分析工具

## 架构

```
浏览器（朋友）
    ↓ HTTPS（Cloudflare Tunnel）
┌─────────────────────────────────┐
│  FastClaw v0.27.0  :18953       │
│  ├─ Web UI（Next.js 内置）       │
│  ├─ 用户管理 / 多会话            │
│  ├─ Agent 运行时                 │
│  │   ├─ SOUL.md（角色 + 路由）   │
│  │   └─ 4 个 SKILL.md           │
│  ├─ LLM Provider: MiniMax M2.7  │
│  └─ MCP 工具: Sorftime (56个)   │
└─────────────────────────────────┘
    ↓ localhost:18954
┌─────────────────────────────────┐
│  MCP Proxy :18954                │
│  注入 Accept header              │
│  SSE → JSON 响应转换             │
└─────────────────────────────────┘
    ↓ HTTPS
  Sorftime MCP Server
```

**为什么需要 Proxy：** FastClaw 的 Streamable HTTP 客户端缺少 `Accept: application/json, text/event-stream` header，Sorftime 返回 406。Proxy 补全 header 并将 SSE 响应转为 JSON。

## 服务地址

| 服务 | 地址 | 用途 |
|------|------|------|
| FastClaw (本地) | http://localhost:18953 | 本地访问 |
| FastClaw (外网) | https://macbook-pro.tail31cb8d.ts.net | 朋友访问入口（Tailscale Funnel） |
| MCP Proxy | http://localhost:18954 | Sorftime header 代理（内部） |

## 目录结构

```
amazon-web-agent/
├── PRD.md                          # 产品需求文档
├── README.md                       # 本文件
├── mcp-proxy/                      # MCP header proxy
│   ├── main.py                     # Starlette 反向代理
│   └── pyproject.toml
├── agents/                         # Agent 知识文件（源文件）
│   └── 竞品与需求分析/
│       ├── SOUL.md                 # 角色 + 意图路由 + 质检清单
│       ├── skills/                 # 4 个分析模块
│       │   ├── 市场调研.md
│       │   ├── 竞品分析.md
│       │   ├── 用户模型.md
│       │   └── 交易模型.md
│       ├── tools/                  # 工具说明（参考用）
│       └── examples/               # 开场示例
├── backend/                        # [已废弃] 原自建 FastAPI 后端
├── frontend/                       # [已废弃] 原 Web UI
└── docs/
    └── superpowers/
        └── specs/2026-04-30-agent-design.md
```

### 部署位置（FastClaw 管理）

```
~/.fastclaw/
├── fastclaw.db                     # SQLite（用户、Agent、Provider、配置）
├── agents/
│   └── agt_641dd151f236281066ee/   # 竞品与需求分析
│       └── agent/
│           ├── skills/
│           │   ├── market-research/SKILL.md
│           │   ├── competitor-analysis/SKILL.md
│           │   ├── user-model/SKILL.md
│           │   └── trade-model/SKILL.md
│           └── memory/
└── logs/gateway.log
```

## 配置详情

### Agent: 竞品与需求分析

| 配置项 | 值 |
|--------|-----|
| Agent ID | `agt_641dd151f236281066ee` |
| 模型 | `minimax/MiniMax-M2.7` |
| SOUL.md | 角色、意图路由表、质检清单 |
| Skills | 4 个（市场调研、竞品分析、用户模型、交易模型） |
| MCP | Sorftime（56 个工具，经 proxy 连接） |

### LLM Provider

| Provider | API Base | 协议 | 模型 |
|----------|----------|------|------|
| minimax | `https://api.minimax.chat/v1` | OpenAI Chat | MiniMax-M2.7（**默认**） |
| zhipu-glm | `https://open.bigmodel.cn/api/anthropic` | Anthropic Messages | glm-5.1 |

### 用户

| 用户 | 角色 |
|------|------|
| 7aoYi | super_admin |
| testuser | user（测试账号） |

## 运维

```bash
# FastClaw
~/.local/bin/fastclaw daemon start    # 启动
~/.local/bin/fastclaw daemon restart  # 重启
~/.local/bin/fastclaw daemon status   # 状态

# MCP Proxy
cd amazon-web-agent/mcp-proxy
source .venv/bin/activate
python main.py                        # 前台运行

# 登录 API（注意：字段名是 login 不是 username）
curl -X POST http://localhost:18953/api/login \
  -H "Content-Type: application/json" \
  -d '{"login":"7aoYi","password":"ding1994"}'

# 日志
tail -f ~/.fastclaw/logs/gateway.log
```

## 已知问题

| 问题 | 影响 | 状态 |
|------|------|------|
| FastClaw MCP 客户端缺少 Accept header | Sorftime 直连失败（406） | 已通过 MCP Proxy 绕过 |
| FastClaw 不支持 `type=sse` MCP | 只能用 `type=http` | 不影响，Proxy 处理 |

## 待做

- [ ] 创建朋友账号（需要用户提供名单）
- [ ] 配置 Cloudflare Tunnel 暴露外网
- [ ] 设置 API 月度成本上限
- [ ] 清理废弃的 `backend/` 和 `frontend/` 目录
