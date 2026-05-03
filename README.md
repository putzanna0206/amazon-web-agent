# Amazon Web Agent

> 竞品与需求分析 Web Agent — 基于 FastClaw（Fork）的亚马逊品类分析工具

## 完整文档

- **[PROJECT.md](PROJECT.md)** — 项目百科（产品定义、实现、品牌保护、状态规划）
- **[CLAUDE.md](CLAUDE.md)** — AI 协作行为规则

## 架构

```
朋友浏览器 → HTTPS（Tailscale Funnel）→ Next.js (web/)
                                         ↓ /api/* (rewrites)
                                   FastClaw :18953
                                   ├─ Agent 运行时（SOUL + 4 SKILL）
                                   ├─ LLM: MiniMax M2.7 HighSpeed
                                   └─ MCP 直连: Sorftime 56 工具
```

## 服务地址

| 服务 | 地址 |
|------|------|
| FastClaw (本地) | http://localhost:18953 |
| Chat UI (本地) | http://localhost:3000 |
| FastClaw (外网) | https://macbook-pro.tail31cb8d.ts.net |

## 目录结构

```
amazon-web-agent/
├── PROJECT.md                  # 项目百科
├── CLAUDE.md                   # AI 协作行为规则
├── README.md                   # 本文件
├── agents/                     # Agent 知识源文件
│   └── 竞品与需求分析/
│       ├── SOUL.md
│       ├── 客服手册.md
│       ├── skills/             # 4 个分析模块
│       ├── tools/              # 工具代号参考 + 报告规范
│       └── examples/           # 开场示例
├── web/                        # 自建 chat UI（Next.js 16）
├── docs/
│   ├── 真名代号映射.md          # 机密映射表
│   └── archive/               # 归档的旧文档
└── backend/                    # ⚠️ 废弃（104MB），待清理
```

## 运维

```bash
# FastClaw daemon
~/.local/bin/fastclaw daemon start
~/.local/bin/fastclaw daemon restart  # 会断朋友会话
~/.local/bin/fastclaw daemon status

# 重新编译 Fork（修改 ~/fastclaw/ 源码后）
cd ~/fastclaw
cd web && pnpm install && pnpm build && cd ..
cp -r web/out internal/setup/web
go build -o fastclaw-test ./cmd/fastclaw
~/.local/bin/fastclaw daemon stop
cp fastclaw-test ~/.local/bin/fastclaw
~/.local/bin/fastclaw daemon start

# Web UI
cd web && pnpm dev     # 开发
cd web && pnpm build   # 构建

# 日志
tail -f ~/.fastclaw/logs/gateway.log
```

## 已知问题

| 问题 | 状态 |
|------|------|
| FastClaw MCP 客户端缺 Accept header | ✅ 已在 Fork 中修复 |
| FastClaw 不支持 SSE 响应解析 | ✅ 已在 Fork 中修复 |
| 三层防御未同步到运行时 | ⚠️ 待 sync |
| MCP 工具真名在 tool schema 暴露 | ⚠️ 待验证 |
