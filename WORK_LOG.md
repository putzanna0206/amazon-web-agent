# 工作日志

> AI 每次完成有意义的变更后**主动追加**。倒序，简短，只记关键信息。

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
