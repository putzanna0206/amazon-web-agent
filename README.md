# Amazon Web Agent

> 竞品与需求分析 Web Agent — 基于 FastClaw（Fork）的亚马逊品类分析工具

## 架构

**两层 UI**——朋友看到的是自建 chat UI（带 sanitize 兜底），管理后台用 FastClaw Fork 自带 admin UI。

```
朋友浏览器
    ↓ HTTPS（Cloudflare Tunnel）
┌─────────────────────────────────────┐
│  自建 Next.js (web/)                │
│  ├─ 极简 chat UI（login + chat）    │
│  └─ sanitize() 兜底层（前端兜底品牌名）│
└─────────────────────────────────────┘
    ↓ /api/* (login / agents / chat/stream)
┌─────────────────────────────────┐
│  FastClaw (Fork)  :18953        │
│  ├─ Fork 自带 admin UI（你管理用） │
│  ├─ 用户管理 / 多会话            │
│  ├─ Agent 运行时                 │
│  │   ├─ SOUL.md（角色 + 路由）   │
│  │   └─ 4 个 SKILL.md           │
│  ├─ LLM Provider: MiniMax M2.7  │
│  └─ MCP 工具: Sorftime (56个)   │
└─────────────────────────────────┘
    ↓ HTTPS（直连，已修复 Accept header）
  Sorftime MCP Server
```

**Fork 改动：** 原版 FastClaw 的 MCP HTTP 客户端缺少 `Accept` header 且不支持 SSE 响应解析。我们 Fork 后修复了这两个问题（`internal/mcp/http.go`），MCP 直连 Sorftime，不再需要 Proxy。

**两层防御（重要）：** 品牌身份保护用了两层兜底——SOUL.md 的"敏感问题应对"教 LLM 不说，`web/src/app/page.tsx` 的 `sanitize()` 在前端再做一次正则替换兜底。任何"绝对禁止输出"清单的改动都要两层同步改。

## 服务地址

| 服务 | 地址 | 用途 |
|------|------|------|
| FastClaw (本地) | http://localhost:18953 | 本地访问 |
| FastClaw (外网) | https://macbook-pro.tail31cb8d.ts.net | 朋友访问入口（Tailscale Funnel） |

## 目录结构

```
amazon-web-agent/
├── PRD.md                          # 产品需求文档
├── README.md                       # 本文件
├── CLAUDE.md                       # AI 协作指南（写作约定 + 反模式）
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
├── web/                            # ✅ 朋友访问入口：自建 Next.js 16 chat UI
│   ├── src/app/                    #    login + page (chat) — 极简两页
│   ├── src/lib/api.ts              #    调 FastClaw API（/api/login /api/chat/stream 等）
│   └── src/app/page.tsx            #    含 sanitize() 兜底层（约 460 行处）
├── docs/
│   └── superpowers/
│       └── specs/2026-04-30-agent-design.md
└── backend/                        # ⚠️ [已废弃] 原自建 FastAPI 后端（待清理，104MB）
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
| FastClaw | Fork 版本（修复 MCP Accept header + SSE 解析） |
| 源码 | `~/fastclaw/`（Fork from github.com/fastclaw-ai/fastclaw） |
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

# 重新编译 Fork 版本（修改源码后）
cd ~/fastclaw
# 如果改了前端：
cd web && pnpm install && pnpm build && cd ..
cp -r web/out internal/setup/web
# 编译 Go 二进制
go build -o fastclaw-test ./cmd/fastclaw
# 替换并重启
~/.local/bin/fastclaw daemon stop
cp fastclaw-test ~/.local/bin/fastclaw
~/.local/bin/fastclaw daemon start

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
| FastClaw MCP 客户端缺少 Accept header | Sorftime 直连失败（406） | ✅ 已在 Fork 中修复 |
| FastClaw 不支持 SSE 响应解析 | MCP 工具调用失败 | ✅ 已在 Fork 中修复 |
| MCP Proxy | 不再需要 | ✅ 已删除（2026-05-02） |

## 待做

- [ ] 创建朋友账号（需要用户提供名单）
- [ ] 配置 Cloudflare Tunnel 暴露外网（含 `web/` 部署方式 — 独立 Next.js 进程 or 编入 FastClaw 二进制）
- [ ] 设置 API 月度成本上限
- [ ] 清理 `backend/`（104MB，需同步清 pyproject.toml 依赖）— 已清理：`frontend/` `mcp-proxy/` `.playwright-mcp/`（2026-05-02）
- [ ] 补 `web/` 启动文档（环境变量 `NEXT_PUBLIC_API_BASE`、`pnpm dev`/`pnpm build`、部署位置）
