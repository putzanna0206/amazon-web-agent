# 工作日志

> AI 每次完成有意义的变更后**主动追加**。倒序，简短，只记关键信息。

---

## 2026-05-11 — 文件下载 404 修复 + workspaceRef 路径对齐

**问题**：write_file 通过 workspace store 存储文件时带 sessionId，文件落在 `sessions/{sid}/` 下，但 file event 报告的路径是裸文件名（无 session 前缀），前端构造的下载 URL 匹配不到 → 404

**根因**：`MEDIA_WORKSPACE:` 标记只输出用户传入的相对路径，不含 workspace store 的 session 前缀

**修复**：
- `tools/file.go`：新增 `workspaceRef()` 辅助函数，sessionId 非空时返回 `sessions/{sid}/{path}`
- 两处 `MEDIA_WORKSPACE:` 输出（普通版 + sandbox 版）改用 `workspaceRef()`
- file event 的 `path` 字段现在包含完整存储路径，前端下载 URL 直接可用
- exec 创建的文件不受影响（直接写入 workspace root，无 session 前缀）

**验证**：
- write_file 创建文件 → file event 路径含 `sessions/{sid}/` 前缀 → 下载 200 ✅
- exec 创建文件 → file event 路径无前缀 → 下载 200 ✅
- 单测 `TestWorkspaceRef` 4 用例全通过 ✅

---

## 2026-05-11 — 系统性加固（白名单 + 全路径清理 + 编译部署）

**目标**：不是逐个修补，而是从机制上防止整类问题复发

**加固 1 — isUserFacingFile 改为白名单**：
- `loop.go`：原黑名单（逐个排除 .py/.sh/...）改为白名单机制
- 只放行文档(.pdf/.doc/.txt/.md)、图片(.png/.jpg/.svg)、数据(.csv/.xlsx/.json)、音视频(.mp3/.mp4)、压缩包(.zip/.tar)
- 任何不在白名单的扩展名（.py/.sh/.js/.go/.ttf/.log/.tmp/...）全部不触发 file event
- 以后新增语言/格式不会再遗漏

**加固 2 — sanitizeContent 覆盖所有内部路径**：
- 原来只清理 workspacePath，现在同时清理 homePath、homeDir
- `/Users/7aoyi/.fastclaw/workspaces/...`、`/Users/7aoyi/.fastclaw/agents/...`、`/Users/7aoyi/.fastclaw` 三层路径全部清除
- 防止任何内部路径通过 LLM 响应泄漏到前端

**加固 3 — 编译部署 + 前端 QA 验证**：
- 编译新二进制到 `~/.local/bin/fastclaw`，codesign，重启 gateway
- 通过 Next.js 前端代理(localhost:3000) 运行 21 项 QA 测试，全部 PASS
- 白名单(.py=过滤/.md=放行/.ttf=过滤)、路径清理(无泄漏)、exec 检测(正常) 三项专项验证通过

**已知限制**：
- PDF 中文乱码：SOUL.md 已明确禁止生成 PDF，但 LLM 有时无视指令。此为 LLM 遵从度问题，非代码 bug
- workspace 中 .py 中间文件：已被白名单过滤，用户不可见

---

## 2026-05-10 — 文件事件增强 + 路径清理 + exec 文件检测

**问题**：图表/PDF 通过 exec 生成但不显示下载链接；write_file 暴露 .py 中间文件；LLM 回复暴露内部路径

**根因**：
1. exec 工具创建文件后无文件事件检测机制
2. `MEDIA_WORKSPACE:` 对所有文件类型都触发，包括 .py/.sh 等中间产物
3. LLM 响应包含 `/Users/7aoyi/.fastclaw/workspaces/agt_...` 内部路径

**修复**：
- `agent/loop.go`:
  - 新增 `isUserFacingFile()` — 只对 PDF/PNG/JPG/CSV/XLSX 等用户可见类型触发 file event，过滤 .py/.sh/.js 等
  - 新增 `snapshotWorkspace()` + `emitNewWorkspaceFiles()` — exec 后扫描 workspace 新增文件
  - 新增 `sanitizeContent()` — 从 LLM 响应中清除 workspace 路径前缀
  - HandleMessage/HandleMessageStream 两个入口点均添加：workspace 快照、exec 后扫描、content 清理
- MEDIA_WORKSPACE 事件添加 `isUserFacingFile` 过滤

**验证**：
- write_file .md → file 事件 ✅
- write_file .py → 无 file 事件 ✅
- exec 创建文件 → file 事件 ✅
- Content-Type: PDF=application/pdf, PNG=image/png ✅
- 路径清理：响应不含内部路径 ✅

---

## 2026-05-10 — 文件显示 + PDF 下载修复

**问题**：生成文件显示"保存在工作目录"无下载链接；PDF 文件无法下载/打开

**根因**：
1. `write_file` 工具结果不含 `MEDIA:` 标记，agent loop 不检测新文件
2. 即使检测到文件，`sendMediaFiles` 只发到 IM 消息总线，web SSE 从未收到 `file` 事件
3. `serveFileFromWorkspaceStore` 硬编码 `Content-Type: application/octet-stream`

**修复**：
- `tools/file.go`: `write_file` 成功后追加 `MEDIA:` / `MEDIA_WORKSPACE:` 标记（workspace store 路径用 `MEDIA_WORKSPACE:`）
- `agent/loop.go`: 新增 `extractWorkspaceFileRefs` + `emitFileEventsForWeb`，HandleMessage 和 HandleMessageStream 两个入口点检测文件后通过 `emitEvent` 发 `file` 类型 SSE 事件
- `setup/handlers_agents.go`: `serveFileFromWorkspaceStore` 使用 `mime.TypeByExtension` 按 MIME 类型设置 Content-Type
- 编译部署到 `~/.local/bin/fastclaw`，重启 gateway

**验证**：PDF → `application/pdf`，PNG → `image/png`；前端 file event 格式 `{type:"file", data:{path, name}}` 与 `emitEvent` 输出一致

---

## 2026-05-10 — SSE heartbeat 保活 + BUG-2 proxy 泄漏修复 + SOUL.md 同步 + QA

**SSE heartbeat 保活（FastClaw Fork 修改）**：
- 根因：Cloudflare Tunnel 空闲 ~120s 后发送 RST_STREAM 切断 SSE 连接。MiniMax model call 耗时 2 分钟+时无 SSE 事件，触发超时
- 修复：`fastclaw/internal/agent/loop.go` 新增 `startHeartbeat()` 方法，model call 期间每 30s 发 `{"type":"heartbeat"}` SSE 事件
- 覆盖 `HandleMessage` 和 `HandleMessageStream` 两个入口
- 验证：直连/本地 proxy 2m30s 长请求均成功，heartbeat 事件正常出现，前端静默忽略
- 编译安装新二进制到 `~/.local/bin/fastclaw`，需 codesign --force --sign - 绕过 macOS provenance 检查

**BUG-2 catch-all proxy 泄漏 FastClaw admin HTML**：
- 根因：`next.config.ts` 的 rewrites 把 `/api/:path*` 直接转发到 FastClaw，绕过了 `route.ts` 的 HTML 拦截逻辑
- 修复 1：`web/src/app/api/[...path]/route.ts` 加 Content-Type 检查，上游返回 text/html 时返回 404
- 修复 2：`web/next.config.ts` 删除 rewrites()（route handler 已做 proxy，rewrites 是死代码且优先级更高导致拦截失效）
- 验证：`/api/nonexistent` 本地和外网均返回 404，不含 FastClaw 文字；正常 API（login/chat/stream）不受影响

**SOUL.md 同步**：
- 仓库文件 12280B vs 数据库 5690B，不同步
- 已通过 sqlite3 readfile 同步到 12280B
- `agents/竞品与需求分析/sync-to-runtime.sh` agent ID 从旧 `agt_26223160cd1acbfc5020` 修正为 `agt_8443b1b15e52f2a9b8f8`

**QA 完整测试（Exhaustive 级别）**：
- Agent team 编排：QA 测试员（40+ 测试）+ 审查员（独立验证 + 补充 8 项遗漏场景）
- 测试结果：38 PASS / 1 WARN / 1 FAIL，6 个 bug（1 HIGH / 3 MEDIUM / 2 COSMETIC）
- BUG-2（HIGH）已修复并验证，质检 12 项全 PASS
- 前端单元测试 95/95 通过
- 结论：Ship-ready

---

## 2026-05-10 — 工作日志规范 + 文档一致性修复 + 运行时部署

- **日志规范**：CLAUDE.md 新增工作日志规则（AI 主动记录、唯一文件 WORK_LOG.md、30 天归档）
- **日志合并**：重写 WORK_LOG.md，合并 PROJECT.md 和 MAINTENANCE_LOG.md 的日志，后两者不再记日志
- **MAINTENANCE_LOG.md**：标记废弃
- **Agent ID**：PROJECT.md 和真名代号映射从旧 ID `agt_641dd151f236281066ee` 修正为实际 `agt_8443b1b15e52f2a9b8f8`
- **密码**：ARCHITECTURE.md/QUICKSTART.md 从 `ding1994` 修正为实际 `123456`
- **包管理器**：统一为 pnpm，删 `package-lock.json`，ARCHITECTURE.md/QUICKSTART.md 的 npm → pnpm
- **外网状态**：PROJECT.md Phase 3 外网暴露标记为已完成（xinxiannews.info 返回 200）
- **运行时重建**：发现当前 agent `agt_8443b1b15e52f2a9b8f8` 是空壳（无 Skills/SOUL/MCP/Provider scope）
  - 从旧 agent 目录复制 4 Skills + TOOLS.md
  - SOUL.md 通过 API 写入数据库
  - MCP Sorftime 配置加入 agent config
  - Provider scope 从空修正为 `system`（Fork 版要求 scope 字段）
  - 从 Fork 源码重新编译 FastClaw（修复 MCP Accept header）
- **Sorftime API key 失效**：MCP 连接正常但返回 `NotAuthorization`，需用户更新 key
- **Sorftime API key 更新**：用户提供新 key，更新数据库和 agent.json，工具调用恢复正常，返回完整数据

---

## 2026-05-09 — QA 修复 + 内存爆炸

**聊天请求失败修复**：
- 根因：FastClaw v0.34.1 无法解析 FormData，改用 JSON 格式绕过
- 修改 `web/src/lib/api.ts`（streamChat 改 JSON）、`web/src/app/api/chat/stream/route.ts`（优先 JSON）
- 数据库修复：用户密码重置、Agent 配置格式修正、Provider 配置补全、quota 修复
- 当前状态：✅ 聊天正常

**QA 批量修复**：
- 登录页空白 → 加内联样式 fallback（commit `00813b8`）
- Cookie 转发失败 → API 代理补 Set-Cookie 转发（commit `7ceb826`）
- 文件上传 UI 新增（commit `7ceb826`）
- AuthProvider 错误处理增强（commit `51c54ae`）
- 前端状态页和过渡页优化（commit `a672bfa`）

**内存爆炸**：
- AI 错误使用 Agent 后台模式启动 Next.js，产生 4000+ node 进程
- 已清理。教训：用 `npm run dev &` 直接启动，不用 Agent 工具管理 Node 进程

---

## 2026-05-03 — FastClaw 源码分析 + 运行时同步 + 部署调研

- FastClaw Fork 源码分析：搞清 SOUL 走数据库、skill 走文件系统、MCP 真名直传 LLM
- 发现运行时三层防御改动从未 sync，全部重新同步（SOUL → 数据库 8604B、4 SKILL + TOOLS → 文件系统）
- 压力测试 5 轮：L1/L2 通过，L3/L4 教育层失效（MiniMax 指令遵从度低）
- 功能验证：foldable keyboard 分析正常
- 外网部署调研：Cloudflare Tunnel 在 VPN 环境不可行（UDP 被拦截），备选 VPS 中转
- 商业模式从"卖模板"调整为"免费引流 + 后端服务变现"

---

## 2026-05-02 — 项目梳理 + 三层防御 + 文档整理

- 项目全景梳理，清理废弃目录（`frontend/` `mcp-proxy/` `.playwright-mcp/`）
- 三层品牌防御重构：源头去真名、语义化禁令、sanitize 加强
- 新建 `docs/真名代号映射.md`（机密，不进 agent context）
- 合并 PRD + spec + 进度文档为 `PROJECT.md`
- 旧文档归档到 `docs/archive/`
