# AmaWebAgent 项目完整文档

> **项目概览**: AI驱动的亚马逊竞品与需求分析系统
> **最后更新**: 2026年5月9日
> **版本**: v1.0

---

## 🏗️ 项目架构

### 系统组成

```
AmaWebAgent/
├── fastclaw/          # AI后端核心
│   ├── agents/       # Agent配置和能力定义
│   ├── skills/        # 技能包
│   ├── workspaces/    # 工作空间管理
│   └── fastclaw.db   # SQLite数据库
├── web/              # Next.js前端
│   ├── src/
│   │   ├── app/      # Next.js 16页面和API路由
│   │   ├── lib/      # 工具库和组件
│   │   └── components/# React组件
│   └── public/       # 静态资源
└── docs/             # 项目文档
```

### 技术栈

#### 前端技术栈
- **框架**: Next.js 16.2.4 (Turbopack)
- **UI库**: React 19.2.4
- **语言**: TypeScript 5.x
- **样式**: Tailwind CSS v4
- **图表**: Recharts ^3.8.1
- **状态管理**: React Context (auth.tsx)
- **构建工具**: Turbopack (Next.js内置)

#### 后端技术栈
- **AI引擎**: FastClaw (自定义框架)
- **数据库**: SQLite
- **API**: RESTful + SSE流式响应
- **认证**: Session-based (HttpOnly cookies)

#### 部署架构
- **CDN**: Cloudflare
- **隧道**: Cloudflare Tunnel (tunnel: amazon-agent)
- **域名**: xinxiannews.info
- **SSL**: 自动HTTPS (Let's Encrypt)
- **服务器**: 本地Mac Mini (自托管)

---

## 🔧 环境配置

### 必需工具

```bash
# Node.js 运行时
node --version  # v18+ 推荐

# 包管理器
npm --version    # v9+

# Cloudflared (隧道工具)
cloudflared --version

# FastClaw CLI
fastclaw --version
```

### 环境变量

#### FastClaw环境
```bash
# 位置: ~/.fastclaw/
FASTCLAW_PORT=18953        # API服务端口
FASTCLAW_DB=~/.fastclaw/fastclaw.db
```

#### Next.js环境
```bash
# 位置: web/
NEXT_PUBLIC_API_BASE=     # 可选，默认使用相对路径
```

### 服务端口

| 服务 | 端口 | 用途 |
|------|------|------|
| Next.js开发 | 3000 | 开发服务器 |
| Next.js生产 | 3000 | 生产服务器 |
| FastClaw API | 18953 | AI后端API |
| Cloudflared | 自动 | 隧道管理 |

---

## 🚀 部署架构

### 生产环境

#### 域名和DNS
```
域名: xinxiannews.info
DNS: Cloudflare托管
SSL: Let's Encrypt自动证书
```

#### Cloudflare配置
```yaml
# 位置: ~/.cloudflared/config.yml
tunnel: amazon-agent
credentials-file: ~/.cloudflared/7fcc6618-e56c-4e6c-9422-97309281eabe.json

ingress:
  - hostname: xinxiannews.info
    service: http://localhost:3000
  - service: http_status:404
```

#### 服务启动流程

1. **启动FastClaw后端**
   ```bash
   fastclaw gateway --port 18953 &
   ```

2. **启动Next.js生产服务器**
   ```bash
   cd ~/amazon-web-agent/web
   npm run build  # 构建生产版本
   npm start &      # 启动生产服务器
   ```

3. **启动Cloudflare隧道**
   ```bash
   cloudflared tunnel run amazon-agent &
   ```

#### 服务管理命令

```bash
# 查看服务状态
ps aux | grep -E "next|fastclaw|cloudflared"

# 停止所有服务
pkill -f "next|fastclaw|cloudflared"

# 重启服务
cd ~/amazon-web-agent/web && npm start &
cloudflared tunnel run amazon-agent &
```

---

## 💻 开发工作流

### 本地开发

#### 1. 启动开发服务器
```bash
cd ~/amazon-web-agent/web
npm run dev
# 访问 http://localhost:3000
```

#### 2. 开发模式特性
- ✅ 热模块替换(HMR)
- ✅ 快速刷新
- ✅ TypeScript错误提示
- ✅ 源码映射

### 生产构建

#### 1. 构建流程
```bash
cd ~/amazon-web-agent/web
npm run build
# 输出到 .next/ 目录
```

#### 2. 生产特性
- ✅ 代码压缩
- ✅ Tree-shaking
- ✅ 静态优化
- ✅ 图片优化

### 代码规范

#### 文件命名
- React组件: PascalCase (如 `ChatPage.tsx`)
- 工具函数: camelCase (如 `formatDate.ts`)
- 样式文件: kebab-case (如 `globals.css`)
- 页面路由: kebab-case (如 `new-page/`)

#### Git提交规范
```bash
# 功能提交
git commit -m "feat: 添加新功能描述"

# 修复提交
git commit -m "fix: 修复问题描述"

# 文档提交
git commit -m "docs: 更新文档说明"

# 重构提交
git commit -m "refactor: 代码重构描述"
```

---

## 🔐 认证系统

### 用户数据

#### 数据库位置
```bash
~/.fastclaw/fastclaw.db
```

#### 查询用户信息
```bash
sqlite3 ~/.fastclaw/fastclaw.db "SELECT username, email, role FROM users;"
```

#### 当前测试账号
```
用户名: 7aoYi
密码: ding1994
角色: super_admin
```

### 认证流程

#### 1. 前端登录流程
```typescript
// 1. 用户填写表单
// 2. 调用 /api/login
POST /api/login
Body: { "login": "7aoYi", "password": "ding1994" }

// 3. 后端验证并设置Session Cookie
Response: Set-Cookie: fastclaw_session=...

// 4. 前端存储用户信息到localStorage
localStorage.setItem("fc_user", JSON.stringify({ user, agent }))
```

#### 2. API代理配置
```typescript
// 文件: web/src/app/api/[...path]/route.ts
// 关键: 转发Set-Cookie头
const setCookie = upstream.headers.get("Set-Cookie");
if (setCookie) {
  resHeaders.set("Set-Cookie", setCookie);
}
```

---

## 📁 关键文件说明

### 前端核心文件

| 文件路径 | 功能 | 关键点 |
|---------|------|--------|
| `web/src/app/login/page.tsx` | 登录页面 | 有内联样式fallback |
| `web/src/app/chat/page.tsx` | 聊天主页面 | 包含文件上传功能 |
| `web/src/lib/auth.tsx` | 认证Context | 管理用户状态 |
| `web/src/lib/api.ts` | API客户端 | 封装FastClaw调用 |
| `web/src/lib/markdown.tsx` | Markdown渲染 | 支持图片和图表 |
| `web/src/app/api/[...path]/route.ts` | API代理 | 转发到FastClaw |
| `web/src/app/api/upload/route.ts` | 文件上传API | 处理multipart数据 |

### 后端核心文件

| 路径 | 功能 |
|------|------|
| `~/.fastclaw/agents/` | Agent配置目录 |
| `~/.fastclaw/skills/` | 技能包目录 |
| `~/.fastclaw/fastclaw.db` | SQLite数据库 |

---

## 🎯 功能特性

### 核心功能

1. **市场调研** - 搜索量、价格带、头部品牌分析
2. **竞品分析** - ASIN对比、产品详情分析
3. **用户需求分析** - 使用场景、痛点分析
4. **选品评估** - 市场规模、竞争分析

### 新增功能 (v1.0)

#### 1. 文件上传
- **UI组件**: 输入框左侧📎按钮
- **支持格式**: 图片、PDF、Word、Excel、TXT
- **API端点**: `/api/upload`
- **多文件**: 支持同时上传多个文件

#### 2. 图表渲染
- **库**: Recharts ^3.8.1
- **支持类型**: 柱状图、折线图、饼图、雷达图
- **Markdown语法**: 自动识别并渲染图表

#### 3. 图片显示
- **Markdown语法**: `![alt](filename)`
- **自动处理**: 路径解析和响应式样式
- **错误处理**: 优雅降级

---

## 🔍 常见问题排查

### 问题1: 登录页面空白

**症状**: 访问 `/login` 看到空白页

**排查步骤**:
```bash
# 1. 检查服务状态
curl -I http://localhost:3000/login

# 2. 检查HTML内容
curl http://localhost:3000/login | grep "form"

# 3. 检查Next.js进程
ps aux | grep "next"
```

**解决方案**:
- ✅ 已修复: 添加内联样式fallback
- 检查 `web/src/app/login/page.tsx` 中的 `style` 属性

### 问题2: 登录后立即退出

**症状**: 登录成功但马上重定向回登录页

**排查步骤**:
```bash
# 1. 测试API直接调用
curl -X POST http://localhost:18953/api/login \
  -H "Content-Type: application/json" \
  -d '{"login":"7aoYi","password":"ding1994"}'

# 2. 检查API代理Cookie转发
curl -I -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"login":"7aoYi","password":"ding1994"}'
```

**解决方案**:
- ✅ 已修复: 检查 `web/src/app/api/[...path]/route.ts` 中的 Set-Cookie 转发

### 问题3: 外网无法访问

**症状**: `https://xinxiannews.info` 无法打开

**排查步骤**:
```bash
# 1. 检查Cloudflare Tunnel状态
ps aux | grep cloudflared

# 2. 检查隧道连接
cloudflared tunnel list

# 3. 检查本地服务
curl -I http://localhost:3000
```

**解决方案**:
```bash
# 重启Cloudflare Tunnel
pkill cloudflared
cloudflared tunnel run amazon-agent &
```

### 问题4: API调用401错误

**症状**: API请求返回401 Unauthorized

**可能原因**:
1. Session Cookie过期
2. API代理未正确转发Cookie
3. FastClaw服务未运行

**排查步骤**:
```bash
# 1. 检查FastClaw服务
ps aux | grep fastclaw

# 2. 测试直接API调用
curl -X POST http://localhost:18953/api/login \
  -H "Content-Type: application/json" \
  -d '{"login":"7aoYi","password":"ding1994"}'

# 3. 检查通过代理的调用
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"login":"7aoYi","password":"ding1994"}' \
  -v 2>&1 | grep "set-cookie"
```

---

## 🛠️ 维护指南

### 日常维护

#### 1. 服务监控
```bash
# 检查服务状态
ps aux | grep -E "next|fastclaw|cloudflared" | grep -v grep

# 检查端口占用
lsof -i :3000  # Next.js
lsof -i :18953 # FastClaw
```

#### 2. 日志查看
```bash
# FastClaw日志
tail -f ~/.fastclaw/logs/*.log

# Next.js日志 (开发模式)
# 直接在终端查看

# Cloudflare Tunnel日志
cloudflared tunnel run amazon-agent 2>&1 | tee /tmp/tunnel.log
```

#### 3. 数据库维护
```bash
# 备份数据库
cp ~/.fastclaw/fastclaw.db ~/.fastclaw/backup/fastclaw_$(date +%Y%m%d).db

# 查看数据库大小
du -h ~/.fastclaw/fastclaw.db

# 优化数据库
sqlite3 ~/.fastclaw/fastclaw.db "VACUUM;"
```

### 更新部署

#### 1. 前端更新
```bash
cd ~/amazon-web-agent/web

# 拉取最新代码
git pull origin main

# 安装依赖 (如有更新)
npm install

# 构建生产版本
npm run build

# 重启服务
pkill -f "next start"
npm start &
```

#### 2. 后端更新
```bash
# 重启FastClaw服务
pkill -f fastclaw
fastclaw gateway --port 18953 &
```

#### 3. 完整重启
```bash
# 停止所有服务
pkill -f "next|fastclaw|cloudflared"

# 按顺序启动
fastclaw gateway --port 18953 &
cd ~/amazon-web-agent/web && npm start &
cloudflared tunnel run amazon-agent &
```

---

## 📊 性能优化

### 前端优化

#### 1. 构建优化
```typescript
// next.config.js (如需自定义)
module.exports = {
  // 启用SWC压缩
  swcMinify: true,
  
  // 图片优化
  images: {
    domains: ['example.com'],
  },
}
```

#### 2. 生产构建检查
```bash
npm run build

# 检查构建输出
ls -lh .next/static/
```

### 后端优化

#### 1. 数据库优化
```bash
# 定期VACUUM
sqlite3 fastclaw.db "VACUUM;"

# 重建索引
sqlite3 fastclaw.db "REINDEX;"
```

#### 2. 日志管理
```bash
# 清理旧日志 (保留最近7天)
find ~/.fastclaw/logs/ -name "*.log" -mtime +7 -delete
```

---

## 🔐 安全建议

### 1. 认证安全
- ✅ 使用HttpOnly cookies
- ✅ 启用CSRF保护 (待实施)
- ✅ 定期更新依赖

### 2. API安全
- ✅ 输入验证
- ✅ SQL注入防护 (参数化查询)
- ✅ XSS防护 (React默认转义)

### 3. 数据安全
- ✅ 定期备份数据库
- ✅ 敏感信息不记录日志
- ✅ 生产环境关闭调试信息

---

## 🧪 测试

### 单元测试
```bash
cd ~/amazon-web-agent/web
npm test          # 运行所有测试
npm run test:ci   # CI模式运行
```

### 手动测试清单

#### 登录功能
- [ ] 访问 `/login` 页面显示正常
- [ ] 输入用户名密码可以登录
- [ ] 登录后重定向到 `/chat`
- [ ] Session Cookie正确设置

#### 聊天功能
- [ ] 聊天页面正常加载
- [ ] 输入框可以输入文字
- [ ] 发送按钮点击正常
- [ ] 模板选择按钮工作
- [ ] 文件上传按钮可见

#### API功能
- [ ] `/api/login` 正常返回
- [ ] `/api/agents` 认证检查正常
- [ ] `/api/chat/stream` SSE流式响应
- [ ] `/api/upload` 文件上传

---

## 📞 故障联系

### 关键信息

| 项目 | 值 |
|------|-----|
| 域名 | xinxiannews.info |
| 隧道名称 | amazon-agent |
| 主要端口 | 3000 (Next.js), 18953 (FastClaw) |
| 数据库 | ~/.fastclaw/fastclaw.db |
| 项目路径 | ~/amazon-web-agent |

### 快速诊断命令

```bash
# 一键检查所有服务状态
echo "=== 服务状态检查 ===" && \
echo "Next.js:" && lsof -i :3000 | head -1 && \
echo "FastClaw:" && lsof -i :18953 | head -1 && \
echo "Cloudflare:" && ps aux | grep cloudflared | grep -v grep | head -1 && \
echo "=== 外网访问测试 ===" && \
curl -I https://xinxiannews.info/login | head -1
```

---

## 📝 更新日志

### v1.0 (2026-05-09)
- ✅ 初始版本发布
- ✅ 登录认证系统
- ✅ 聊天界面
- ✅ 文件上传功能
- ✅ 图表和图片渲染
- ✅ 外网部署 (xinxiannews.info)
- ✅ Cloudflare Tunnel集成

---

**文档维护**: 如有重大变更，请及时更新此文档
**最后审查**: 2026年5月9日
