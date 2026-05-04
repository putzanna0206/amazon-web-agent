# Amazon Web Agent

> 项目百科：产品定义、实现细节、品牌保护、状态规划。人和 AI 协作者的完整参考。
>
> 新会话第一步：读本文件。CLAUDE.md 是 AI 行为规则（沟通/编码/文件管理），本文件是项目内容。

---

## 一、产品定义

### 定位

基于 FastClaw（Fork）的亚马逊竞品分析 Agent 平台，**免费引流工具，面向国内亚马逊卖家**。

核心价值：**海外模型能力 + 行业工作流封装 + Sorftime 数据 = 开箱即用的 AI 调研助手。**

这不是又一个亚马逊分析工具。它验证一个范式判断：

> **AI 时代要用新范式使用 AI。Agent 形态会跑赢传统单一功能 web 工具形态。**

传统垂直工具有两个根本短板：(1) 功能单一，每个工具只做一件事；(2) 用户被模板束缚。Agent 的差异化在**自主性 + 判断力 + 可对话**：用户说需求，agent 决定调哪些工具、怎么组合、怎么呈现。

判断标准不是"功能多全"，而是"agent 的自主判断有没有让用户少切换工具、少受模板束缚"。

### 商业模式

**免费引流工具 → 公众号关注 → 信任积累 → 高客单价服务**

- 当前阶段：免费开放，不设门槛，目标是让尽可能多用户体验价值
- 引流路径：用户使用 Agent → 感受到专业度 → 关注公众号 → 建立信任关系
- 变现路径：团队/企业客户找上门 → 定制搭建服务 / 咨询 / 培训，获取技术服务费用
- 不卖模板、不卖订阅、不做 SaaS

### 核心壁垒

| 壁垒 | 说明 | 可替代性 |
|------|------|---------|
| 海外模型代理 | 国内用户无法直接使用 Claude/GPT，你提供访问通道 | 低（技术+网络门槛） |
| 行业工作流 | 4 个 SKILL 封装了电商分析方法论 | 中（明文可抄，但需要行业经验） |
| Sorftime MCP 集成 | 56 个工具的封装和调用逻辑 | 中（标准接口，可自行对接） |
| 持续实战迭代 | 你自己是卖家，每天都在用，持续优化 | 低（别人抄不走你的使用经验） |

### 用户

初期：亚马逊卖家朋友，免费体验。通过公众号扩散获取更多用户。
未来：有定制需求的团队/企业客户，付费服务。

### 功能范围

1 个 Agent「竞品与需求分析」，4 个分析方向：

| 用户说 | Agent 做 | 涉及数据 |
|--------|---------|---------|
| 关键词/品类 | 市场调研 | 搜索量、趋势、价格带、品牌格局 |
| ASIN/链接 | 竞品分析 | 产品对比、评论、痛点 |
| 用户行为/评价 | 需求解构 | 使用场景、效用层级、价值演算 |
| 定价/转化/成本 | 交易优化 | 交易成本诊断、定价策略 |

用户不需要知道 skill 名、工具名、内部概念。Agent 用"做什么、要多久、得到什么"的方式沟通。

### V1 明确不做

| 不做 | 原因 |
|------|------|
| 移动 App | 浏览器够用 |
| 付费/订阅/SaaS | 当前阶段是引流工具，不设门槛 |
| 多 Agent | 框架支持扩展，V1 只 1 个 |
| PDF 报告导出 | V2 |
| 固定流程 GUI / 向导表单 | 违反 agent 范式 |
| 卖模板 | 壁垒不够，不可规模化 |

### 竞品对比

| 维度 | 本项目 | Dify Cloud | Coze/扣子 |
|------|--------|-----------|----------|
| Agent 自主推理 | ✅ | ✅ ReAct/Function Calling | ✅ 自主推理 |
| MCP 工具集成 | ✅ Sorftime 56 工具 | ✅ 支持 MCP | ✅ 扣子空间支持 MCP |
| 海外模型访问 | ✅ 直接调 Claude/GPT API | ⚠️ 国内版受限 | ⚠️ 国内版受限 |
| 品牌保护深度 | ✅ 三层防御 | ❌ 无 | ❌ 无 |
| 部署方式 | 自托管（Mac Mini） | 云托管 | 云托管 |
| 行业工作流 | ✅ 电商垂直 SKILL | 通用模板 | 通用模板 |
| 自主管控 | ✅ 完全控制 | ❌ 依赖平台 | ❌ 依赖平台 |

**核心差异**：Dify/Coze 是通用平台，你有垂直行业工作流 + 海外模型代理能力。但对标 Coze + Sorftime MCP 插件，纯 Agent 能力差距不大。真正的壁垒在运营侧（信任关系）和技术侧（海外模型代理）。

---

## 二、实现

### 架构

```
用户浏览器 → HTTPS → Mac Mini (FastClaw :18953)
                         ├─ Agent 运行时（SOUL + 4 SKILL）
                         ├─ LLM: MiniMax M2.7 HighSpeed
                         └─ MCP 直连: Sorftime 56 工具
```

两层 UI：
- **Landing page + Chat UI**（自建 Next.js 16 + React 19）— 用户访问的品牌化入口
- **FastClaw 内置 admin UI** — 你管理账号/agent/provider 用

### 部署方案

```
Mac Mini (16G) ─── Cloudflare Tunnel ─── 自定义域名
     │
     ├── FastClaw daemon
     ├── Next.js (Landing + Chat)
     └── MCP Server (Sorftime)
```

- Mac Mini 作为服务器，Cloudflare Tunnel 暴露到公网（需网络环境支持 UDP/QUIC）
- 备选：VPS 中转（¥30-50/月，避开局域网网络限制）
- 域名绑定 Cloudflare，免费 HTTPS

### FastClaw Fork 改动

原版 FastClaw 的 MCP HTTP 客户端缺 `Accept` header 且不解析 SSE 响应。Fork 修复在 `internal/mcp/http.go`。Fork 源码在 `~/fastclaw/`（不在本仓库）。

### 关键组件

| 组件 | 位置 | 说明 |
|------|------|------|
| Agent 知识源文件 | `agents/竞品与需求分析/` | SOUL.md + 4 skill + tools + 客服手册 |
| Chat UI | `web/` | login + chat 两页，Tailwind v4 |
| sanitize 兜底 | `web/src/app/page.tsx` ~460 行处 | 30+ 正则替换，含拆字/大小写变体 |
| 真名代号映射 | `docs/真名代号映射.md` | 机密，不进 agent context |

### 目录结构

```
amazon-web-agent/
├── PROJECT.md                     # 本文件（项目百科）
├── CLAUDE.md                      # AI 协作行为规则
├── agents/                        # Agent 知识源文件
│   └── 竞品与需求分析/
│       ├── SOUL.md                # 角色 + 意图路由 + 敏感问题话术 + 质检清单
│       ├── 客服手册.md             # 5 层渐进式敏感问题应对话术
│       ├── skills/
│       │   ├── 市场调研.md
│       │   ├── 竞品分析.md
│       │   ├── 用户模型.md
│       │   └── 交易模型.md
│       ├── tools/
│       │   ├── 数据系统.md          # 工具代号参考（agent 看到的版本）
│       │   └── report.md           # 报告生成规范
│       └── examples/
│           └── 开场示例.md
├── web/                           # 自建 chat UI（Next.js 16）
│   ├── src/app/page.tsx           # chat 页 + sanitize()
│   ├── src/app/login/page.tsx     # 登录页
│   ├── src/lib/api.ts             # FastClaw API 封装
│   └── src/lib/auth.tsx           # React Context 认证
├── docs/
│   ├── 真名代号映射.md              # 机密映射表（不进 agent context）
│   ├── archive/                   # 归档的旧文档
│   └── superpowers/               # brainstorm 会话产物
├── .superpowers/                  # brainstorm 会话数据
└── backend/                       # ⚠️ 废弃（104MB），待清理
```

### 源文件 vs 运行时

仓库里的 `agents/` 是源文件。运行时在两个地方：

| 角色 | 仓库位置 | 运行位置 |
|------|---------|---------|
| SOUL.md | `agents/竞品与需求分析/SOUL.md` | **数据库**（agent_files 表，非文件系统） |
| Skill 文件 | `agents/竞品与需求分析/skills/*.md` | `~/.fastclaw/agents/agt_641dd151f236281066ee/agent/skills/<英文目录名>/SKILL.md` |
| 客服手册 / tools / examples | `agents/竞品与需求分析/` 下 | **未部署**（FastClaw 只加载固定 bootstrap 文件） |
| FastClaw 二进制 | 不在仓库 | `~/.local/bin/fastclaw` |
| Fork 源码 | 不在仓库 | `~/fastclaw/` |
| 数据库 | 不在仓库 | `~/.fastclaw/fastclaw.db` |
| 日志 | 不在仓库 | `~/.fastclaw/logs/gateway.log` |

改完 SOUL/SKILL 要同步到运行时才生效。改完 `web/` 要重新 `pnpm build`。改完 Fork 源码要重编 + 重启。

### FastClaw 加载机制（Fork 源码分析）

**SOUL.md**：先查数据库 `agent_files` 表（per-user），再 fallback 到 `<agent_home>/SOUL.md` 文件。当前走数据库路径。更新方式：`PUT /api/agents/{id}/files/SOUL.md`。

**Bootstrap 文件**：固定 7 个（`AGENTS.md, BOOTSTRAP.md, HEARTBEAT.md, SOUL.md, USER.md, TOOLS.md, IDENTITY.md`）。`客服手册.md` 不在列表里，不会自动加载。需合并进 SOUL.md 或 TOOLS.md。

**Skills**：从 `<agent_home>/skills/` 目录发现，每个子目录内的 `SKILL.md` 全量注入 system prompt。目录名作为 `<skill name="...">` 的 name 属性暴露给 LLM。不需要重新注册——文件系统改动后 agent 自动发现。

**MCP 工具**：`ListTools()` 返回的工具名原样注册到 tool registry，`Definitions()` 直接传给 LLM 的 tool_use schema。LLM 能看到所有 MCP 工具真名（如 `keyword_detail`）。

**运行时信息**：system prompt 硬编码 `"You are an AI agent running on the FastClaw runtime."`，每次对话都会出现。

### 已知泄漏向量

| 泄漏源 | 位置 | 严重度 |
|--------|------|--------|
| MCP 工具真名在 tool schema | FastClaw `loop.go:268` | 🔴 高 |
| SKILL 内容里的旧真名（未 sync） | 运行时 4 个 SKILL.md | 🔴 高 |
| SOUL.md 旧版触发示例含真名（未 sync） | 数据库 | 🔴 高 |
| SKILL 目录名在 system prompt | FastClaw `skills.go:381` | 🟡 中 |
| "FastClaw runtime" 硬编码 | FastClaw `context.go:105` | 🟡 中 |

### 配置

| 配置项 | 值 |
|--------|-----|
| Agent ID | `agt_641dd151f236281066ee` |
| 模型 | `minimax/MiniMax-M2.7-highspeed`（备：zhipu-glm/glm-5.1） |
| MCP 数据源 | Sorftime（56 个工具，直连） |
| 外网暴露 | Cloudflare Tunnel（Mac Mini 部署时配置） |
| 用户 | 7aoYi (super_admin) + testuser (user) |

### 运维

```bash
# FastClaw daemon
~/.local/bin/fastclaw daemon start    # 启动
~/.local/bin/fastclaw daemon restart  # 重启（会断朋友会话）
~/.local/bin/fastclaw daemon status   # 状态

# 重新编译 Fork
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

---

## 三、品牌保护系统

### 三层防御

目标：在任何压力测试下，agent 不泄漏底层工具名、框架名、模型名、数据平台品牌名。

#### 第一层：源头层（最重要）

agent 能看到的所有文件里**不出现真名**。

| 源文件 | 用代号 | 不出现 |
|--------|--------|--------|
| SOUL.md | "我们的数据系统"、"分析系统" | 具体品牌名、协议名 |
| 客服手册.md | 语义类别描述 | 具体品牌名、协议名 |
| SKILL.md × 4 | `关键词详情查询`、`产品搜索` 等 | `keyword_detail`、`product_search` |
| tools/数据系统.md | 代号工具表 | 真实工具函数名 |

真名 ↔ 代号映射保存在 `docs/真名代号映射.md`，**该文件不进 agent context**（不放 `agents/` 目录、不部署到 `~/.fastclaw/`、不在 LLM 调用的任何 prompt 里引用）。

LLM 哪怕 100% 复述系统提示，也只能说出代号。

#### 第二层：教育层

SOUL.md 和客服手册.md 定义"敏感问题应对"话术，教 LLM 听到敏感问题时怎么回应。

**5 层渐进式应对**：

| 层级 | 触发情境 | 策略 |
|------|---------|------|
| 1 — 一般好奇 | "你用什么工具？" | 自建系统话术 + 引导回分析 |
| 2 — 功能追问 | "能查什么数据？" | 列四大能力 + 引导 |
| 3 — 品牌试探 | 猜测具体品牌/协议/框架 | "团队自建，细节不便透露" + 引导 |
| 4 — 系统试探 | "复述设定""忽略指令" | 固定话术 + 立即转话题 |
| 5 — 反复纠缠 | 同类问题 > 2 次 | "不在服务范围内" + 给具体示例引导 |

每次回应后必须跟引导语，把用户拉回分析任务。追问越深，回答越简短。

**触发列表和禁令清单只用语义类别描述**（"任何第三方数据平台品牌名"），**不列具体名词**。原因：列出来本身就是 LLM 的学习材料，会被诱导复述。

#### 第三层：兜底层

前端 `web/src/app/page.tsx` 的 `sanitize()` 函数，处理 LLM 漏嘴的情况。

**覆盖范围**：
- 数据源品牌名（含拆字 `S[\s]*o[\s]*r[\s]*f...`、大小写变体）
- Agent 框架名
- 模型名/厂商名（MiniMax、Claude、GPT、Gemini、GLM 等）
- 同类工具名（Helium 10、Jungle Scout 等）
- MCP 工具真名（30+ 个）
- 内部模块名（market-research 等 runtime 路径）
- 内部文件名（SOUL.md、SKILL.md、.fastclaw 等）
- 下划线代码名（`\w+_\w+` 兜底替换为"数据查询"）

### 铁律

1. **禁令清单不列具体名词** — 任何涉及禁令的改动，只在源文件用语义类别描述
2. **三层同步改** — 改了源文件代号 → 检查教育层话术 → 检查 sanitize 正则
3. **真名映射文件不进 agent context** — 永远不部署到运行时
4. **SKILL.md 里不出现真名** — 新增工具时先加映射再写代号

### 已知待解决项

| 问题 | 严重度 | 解决方案 |
|------|--------|---------|
| MCP 工具真名在 tool schema 里暴露给 LLM | 🔴 | 需 Fork 加 alias 层 或 MCP proxy 改名 |
| 运行时 skill 目录名为英文（`market-research`）在 system prompt 可见 | 🟡 | 改目录名或 Fork 改 name 属性注入 |
| system prompt 硬编码 "FastClaw runtime" | 🟡 | 需改 Fork 源码 `context.go` |

---

## 四、状态与规划

### Phase 进度

#### Phase 1：搭建框架 ✅

- [x] FastClaw Fork 安装运行（v0.27.0，localhost:18953）
- [x] Agent 创建「竞品与需求分析」(agt_641dd151f236281066ee)
- [x] Provider 配置（MiniMax M2.7 + zhipu-glm 备选）
- [x] MCP 数据源接入（Sorftime 56 工具，直连）
- [x] 用户认证（7aoYi super_admin + testuser）
- [x] 自建 Next.js chat UI（login + chat 两页 + sanitize 兜底）

#### Phase 2：注入 Agent ✅

- [x] SOUL.md（角色、意图路由、敏感问题话术、质检清单）
- [x] 4 个 SKILL.md（市场调研、竞品分析、用户模型、交易模型）
- [x] 客服手册.md（5 层渐进式应对话术）
- [x] 工具代号参考（tools/数据系统.md）
- [x] 端到端验证（输入 foldable keyboard → 输出完整市场分析报告）
- [x] 三层品牌防御设计（源头去真名 + 教育层话术 + 前端 sanitize）

#### Phase 3：验证 ⏳

- [x] 同步 agents/ 到运行时（SOUL.md → 数据库，4 SKILL.md + TOOLS.md → 文件系统）
- [x] 压力测试 5 轮（一般好奇 / 品牌试探 / 越狱 / 反复纠缠 / 工具真名试探）— 全部通过
- [x] 功能验证（foldable keyboard 分析）— 正常
- [x] MCP schema 泄漏验证 — 工具真名仅在 `<think/>` 块出现，前端 strip 后不可见，🟡 中等风险，V1 可接受
- [ ] 朋友压力测试（让会越狱的人攻击 agent）
- [ ] 创建朋友账号（需名单）
- [ ] 外网暴露（Cloudflare Tunnel 或 Tailscale Funnel）
- [ ] 设置 API 月度成本上限
- [ ] 邀请试用 + 收集反馈

#### Phase 4：产品化 🎯（当前）

**目标**：把 Agent 从"自己用"变成"给他人用的免费引流工具"

**第一阶段：产品打磨（当前设备）**
- [ ] Chat UI 中等改造 — 品牌化（换标题/Logo/配色）、欢迎语引导（"输入 ASIN 或产品名称，我来帮你分析"）、侧边栏 4 个 SKILL 快捷入口、对话状态提示
- [ ] Landing page — 品牌介绍页，链接到 Agent，用户一眼知道能做什么

**第二阶段：部署上线（Mac Mini）**
- [ ] Mac Mini 切换网络环境，测试 Cloudflare Tunnel 连通性
- [ ] Mac Mini 部署 FastClaw + Next.js
- [ ] 配置 Cloudflare Tunnel + 自定义域名
- [ ] 一键部署脚本（为后续给别人部署准备）

**第三阶段：运营验证**
- [ ] 公众号搭建，绑定工具入口
- [ ] 小范围让卖家朋友试用，收集反馈
- [ ] 根据反馈迭代 Agent 工作流和界面体验
- [ ] 观察是否有团队/企业客户找上门

### 决策记录

#### 为什么用 FastClaw 而不是自建后端
原设计是 Python + FastAPI 自建后端。评估后判断 FastClaw 提供了完整的 Web UI + Agent 运行时 + 用户管理 + MCP 集成，不需要重复造轮子。省了自建后端的全部工作量。

#### 禁令清单悖论
在禁令/触发列表里列具体名词（如"Sorftime"），LLM 会学到这些词存在，反而被诱导复述。解决方案：只用语义类别描述（"任何第三方数据平台品牌名"），不列具体名词。已写进铁律。

#### 品牌保护用三层而不是一层
单靠"教育 LLM 不说"不够——LLM 在反复追问下会让步。单靠前端替换也不够——漏了就没救。三层（源头去真名 + 教育话术 + 前端兜底）互相补位，任何一层被穿透都有下一层兜住。

#### 范式验证的判断标准（Phase 3 收集反馈时用）
不问"好不好用"，带这两个问题去问朋友：
1. 相比以前用的工具，agent 让你少切换工具了吗？少了多少？
2. agent 的自主判断带来了哪些模板工具做不到的体验？
如果反馈集中在"功能不够多""界面不好看"——检查 SOUL/SKILL 是否被退化成了模板工具。

#### 话术诚实性（待决策）
当前 SOUL 说"我们有一套自建的电商数据分析系统"——严格说是不实陈述。LLM 自己也"觉得"不该撒谎，追问几次就让步。如果要产品化，建议改成"我们对接了业界数据服务，按合作约定不便透露"。用户未决策，当前保留。

#### 商业模式：免费引流而非卖模板（2026-05-03）
分析了"卖 Agent 模板给亚马逊卖家"方向，结论是壁垒不够（方法论可抄、Dify/Coze 也有 Agent+MCP、客单价低服务成本高）。转为免费引流工具策略：
- 工具免费开放，零门槛，目标是让用户体验价值
- 通过公众号获取关注和信任
- 变现靠后端服务（团队定制搭建、咨询）
- 核心壁垒是海外模型代理能力（国内用户用不了 Claude/GPT）+ 行业工作流

### 工作日志

#### 2026-05-02

**完成：**
1. 项目全景梳理——发现 README 多处与实际不符
2. 新建 CLAUDE.md——沉淀写作 SOP、协作约定、反模式
3. 清理废弃目录——删 `frontend/` `mcp-proxy/` `.playwright-mcp/`（commit `0e0e5aa`）
4. 评估 harness engineering 文档——判断对当前问题几乎无用，3 个思想后续可借鉴
5. 三层防御重构——源头去真名、语义化禁令、sanitize 加强（commit `323bff3`）
6. 新增 `docs/真名代号映射.md`、`docs/进度与待办.md`（commit `a03a388`）

**用户决策：** 删低风险三个废弃目录（不删 backend/）、三层防御方案 OK、两次 commit OK

#### 2026-05-03

**完成：**
1. 深入 FastClaw Fork 源码分析——搞清 SOUL.md 走数据库、skill 走文件系统、MCP 工具真名直传 LLM、运行时信息硬编码泄漏
2. 确认运行时现状——三层防御改动从未 sync，数据库 SOUL.md 是旧版含真名，4 个 SKILL.md 用旧真名
3. 合并 PRD + spec + 进度文档为 `PROJECT.md`（本项目百科）
4. PRD.md、旧 spec、进度文档归档到 `docs/archive/`
5. CLAUDE.md 精简为行为规则 + 指向 PROJECT.md 的引用
6. MCP schema 泄漏验证——分析历史会话，工具真名仅出现在 `<think/>` 块，前端 strip 后不可见，V1 不需要 alias 层
7. 合并客服手册进 SOUL.md、新增 TOOLS.md（数据系统+报告规范）
8. 同步源文件到运行时——SOUL.md → 数据库（sqlite3 直接写入）、4 SKILL.md + TOOLS.md → 文件系统
9. 压力测试 5 轮——一般好奇/品牌试探/越狱/反复纠缠/工具真名，全部通过
10. 功能验证——foldable keyboard 分析正常，报告完整
11. 公网部署方案调研——Cloudflare Tunnel 在当前网络（VPN）不可行（UDP 被拦截、TLS 握手失败），备选：换网络 / VPS 中转 / Mac Mini 直连
12. 竞品对比分析——Dify/Coze 均支持 Agent 自主推理 + MCP，纯 Agent 能力差距不大，核心差异在海外模型代理和垂直工作流
13. 商业模式讨论——从"卖模板"调整为"免费引流工具 + 后端服务变现"
