# Amazon Web Agent — PRD v0.3

> 状态：Phase 1 + Phase 2 已完成
> 创建：2026-04-30
> 更新：2026-05-01
> 类型：个人/小圈子工具，非商业化

---

## 一句话定义

基于 **FastClaw** 的云端 Agent 平台，给 3-5 个朋友免费使用，浏览器访问，零安装。V1 只做 1 个 Agent：**竞品与需求分析**。

---

## 1. 已锁定

| 项 | 值 |
|---|---|
| 项目名 | `amazon-web-agent` |
| 用户 | 3-5 个朋友，免费 |
| 商业化 | V1 不做 |
| 运行时 | **FastClaw v0.27.0**（Go 二进制，自带 Web UI + Agent 运行时） |
| LLM | **MiniMax M2.7**（备选：zhipu-glm/glm-5.1） |
| 数据源 | **Sorftime MCP**（56 个亚马逊分析工具） |
| 外网暴露 | Cloudflare Tunnel（待配置） |

---

## 2. 架构（实际实现）

```
浏览器
  ↓ HTTPS（Cloudflare Tunnel）
FastClaw (:18953)
  ├─ Web UI（内置 Next.js）
  ├─ Agent "竞品与需求分析"
  │   ├─ SOUL.md（角色 + 意图路由 + 质检清单）
  │   └─ 4 个 SKILL.md（市场调研/竞品分析/用户模型/交易模型）
  ├─ Provider: MiniMax M2.7（OpenAI 兼容协议）
  └─ MCP: Sorftime（经 MCP Proxy 连接）
       ↓
MCP Proxy (:18954)  ← 补全 Accept header + SSE→JSON 转换
       ↓
Sorftime MCP Server (mcp.sorftime.com)
```

**关键设计决策：**
- **不自建后端**：FastClaw 提供完整的 Web UI + Agent 运行时 + 用户管理 + MCP 集成，不需要自建 FastAPI
- **MCP Proxy**：FastClaw 的 Streamable HTTP 客户端缺少 Accept header，通过 20 行 Python proxy 绕过
- **Agent 知识与运行时分离**：`agents/` 目录保存源文件，FastClaw 部署到 `~/.fastclaw/agents/`

---

## 3. 项目结构

```
amazon-web-agent/
├── PRD.md                      # 本文件
├── README.md                   # 运维文档
├── mcp-proxy/                  # MCP header proxy（Python/Starlette）
├── agents/                     # Agent 知识源文件
│   └── 竞品与需求分析/
│       ├── SOUL.md
│       ├── skills/             # 4 个分析模块
│       ├── tools/              # 工具说明文档
│       └── examples/           # 开场示例
├── backend/                    # [已废弃] 原自建后端
├── frontend/                   # [已废弃] 原 Web UI
└── docs/
    └── superpowers/
        └── specs/              # 设计文档
```

---

## 4. 当前进度

### Phase 1：搭建框架 ✅

| 交付物 | 状态 |
|--------|------|
| FastClaw 安装运行 | ✅ v0.27.0，localhost:18953 |
| Agent 创建 | ✅ "竞品与需求分析" (agt_641dd151f236281066ee) |
| Provider 配置 | ✅ MiniMax M2.7 + zhipu-glm |
| MCP 数据源 | ✅ Sorftime 56 个工具（经 proxy） |
| 认证 | ✅ 7aoYi (super_admin) + 测试账号 |

### Phase 2：注入第一个 Agent ✅

| 交付物 | 状态 |
|--------|------|
| SOUL.md | ✅ 角色、意图路由、质检清单 |
| 4 个 Skill 模块 | ✅ 市场调研、竞品分析、用户模型、交易模型 |
| 端到端验证 | ✅ 输入 "foldable keyboard"，输出完整市场分析报告 |

### Phase 3：验证 ⏳

| 交付物 | 状态 |
|--------|------|
| 创建朋友账号 | ⏳ 待用户提供名单 |
| 外网暴露 | ⏳ Cloudflare Tunnel 待配置 |
| 邀请试用 | ⏳ |
| 反馈收集 | ⏳ |

---

## 5. 待做

1. **朋友账号**：需要名单（用户名/邮箱）
2. **外网暴露**：Cloudflare Tunnel 配置
3. **成本控制**：MiniMax API 月度上限
4. **清理**：删除废弃的 `backend/` 和 `frontend/` 目录
5. **报告生成**：V1 先在对话中展示，V2 考虑 PDF 导出

---

## 6. 明确不做（V1）

| 不做项 | 备注 |
|---|---|
| 移动 App | 浏览器够用 |
| 公网开放注册 | 只给朋友 |
| 付费/商业化 | 6 周后再议 |
| 多 Agent | 框架支持扩展，但 V1 只 1 个 |
| 自由聊天主入口 | 进 Agent 才聊天 |
| PDF 报告导出 | V2 |

---

## 变更日志

- v0.1 (2026-04-30)：初稿，单 Agent 假设
- v0.2 (2026-04-30)：改为多 Agent 框架；引入 3 阶段结构
- v0.3 (2026-05-01)：反映实际实现 — FastClaw 运行时、MCP Proxy、Phase 1+2 已完成
