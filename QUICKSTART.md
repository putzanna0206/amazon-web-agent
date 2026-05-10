# AmaWebAgent 快速启动指南

> **用途**: 快速启动和重启所有服务
> **最后更新**: 2026年5月9日

---

## 🚀 一键启动脚本

### 完整启动 (首次使用)

```bash
#!/bin/bash
echo "=== 启动 AmaWebAgent 服务 ==="

# 1. 启动FastClaw后端
echo "📡 启动FastClaw后端..."
fastclaw gateway --port 18953 > /tmp/fastclaw.log 2>&1 &
sleep 2

# 2. 检查FastClaw是否启动
if ! lsof -i :18953 > /dev/null 2>&1; then
    echo "❌ FastClaw启动失败，检查日志:"
    tail -20 /tmp/fastclaw.log
    exit 1
fi
echo "✅ FastClaw已启动 (PID: $(lsof -ti:18953))"

# 3. 启动Next.js前端
echo "🌐 启动Next.js前端..."
cd ~/amazon-web-agent/web
pnpm build > /tmp/next-build.log 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Next.js构建失败，检查日志:"
    tail -20 /tmp/next-build.log
    exit 1
fi

pnpm start > /tmp/next-prod.log 2>&1 &
sleep 3

# 4. 检查Next.js是否启动
if ! lsof -i :3000 > /dev/null 2>&1; then
    echo "❌ Next.js启动失败，检查日志:"
    tail -20 /tmp/next-prod.log
    exit 1
fi
echo "✅ Next.js已启动 (PID: $(lsof -ti:3000))"

# 5. 启动Cloudflare隧道
echo "🌍 启动Cloudflare隧道..."
cloudflared tunnel run amazon-agent > /tmp/cloudflared.log 2>&1 &
sleep 3

# 6. 检查隧道是否连接
if ! ps aux | grep cloudflared | grep -v grep > /dev/null; then
    echo "❌ Cloudflare Tunnel启动失败"
    exit 1
fi
echo "✅ Cloudflare Tunnel已启动"

echo "=== 所有服务启动完成 ==="
echo "🌐 外网访问: https://xinxiannews.info"
echo "🏠 本地访问: http://localhost:3000"
echo ""
echo "📊 服务状态:"
lsof -i :3000 -F "Process: ${PID// / }" | head -1
lsof -i :18953 -F "Process: ${PID// / }" | head -1
ps aux | grep cloudflared | grep -v grep | head -1
```

### 快速重启 (服务已运行)

```bash
#!/bin/bash
echo "=== 重启 AmaWebAgent 服务 ==="

# 停止所有服务
echo "⏹️  停止服务..."
pkill -f "next start"
pkill -f "cloudflared tunnel"
# 注意: FastClaw继续运行，除非明确需要重启

# 重启前端
echo "🔄 重启Next.js..."
cd ~/amazon-web-agent/web
pnpm start > /tmp/next-prod.log 2>&1 &
sleep 3

# 重启隧道
echo "🌍 重启Cloudflare隧道..."
cloudflared tunnel run amazon-agent > /tmp/cloudflared.log 2>&1 &
sleep 3

echo "✅ 重启完成"
echo "🌐 https://xinxiannews.info"
```

---

## 🔍 服务状态检查

### 一键检查脚本

```bash
#!/bin/bash
echo "=== AmaWebAgent 服务状态 ==="
echo ""

# 检查Next.js
echo "📡 Next.js (端口 3000):"
if lsof -i :3000 > /dev/null 2>&1; then
    echo "  ✅ 运行中 (PID: $(lsof -ti:3000))"
else
    echo "  ❌ 未运行"
fi

# 检查FastClaw
echo "🤖 FastClaw (端口 18953):"
if lsof -i :18953 > /dev/null 2>&1; then
    echo "  ✅ 运行中 (PID: $(lsof -ti:18953))"
else
    echo "  ❌ 未运行"
fi

# 检查Cloudflare Tunnel
echo "🌍 Cloudflare Tunnel:"
if ps aux | grep "cloudflared tunnel run amazon-agent" | grep -v grep > /dev/null; then
    echo "  ✅ 运行中"
else
    echo "  ❌ 未运行"
fi

# 测试外网访问
echo ""
echo "🌐 外网访问测试:"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://xinxiannews.info/login)
if [ "$HTTP_CODE" = "200" ]; then
    echo "  ✅ 外网正常 (HTTP $HTTP_CODE)"
else
    echo "  ❌ 外网异常 (HTTP $HTTP_CODE)"
fi

# 测试本地访问
echo ""
echo "🏠 本地访问测试:"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/login)
if [ "$HTTP_CODE" = "200" ]; then
    echo "  ✅ 本地正常 (HTTP $HTTP_CODE)"
else
    echo "  ❌ 本地异常 (HTTP $HTTP_CODE)"
fi

echo ""
echo "=== 检查完成 ==="
```

---

## 🛠️ 常用维护命令

### 日志查看

```bash
# Next.js日志
tail -f /tmp/next-prod.log

# Cloudflare Tunnel日志
tail -f /tmp/cloudflared.log

# FastClaw日志
tail -f ~/.fastclaw/logs/*.log

# 所有日志 (并行)
tail -f /tmp/next-prod.log /tmp/cloudflared.log ~/.fastclaw/logs/*.log
```

### 服务管理

```bash
# 停止所有服务
pkill -f "next|cloudflared"

# 停止特定服务
pkill -f "next start"    # 只停止Next.js
pkill -f "cloudflared"   # 只停止隧道

# 强制停止端口占用
lsof -ti:3000 | xargs kill -9  # 强制释放3000端口
```

### 数据库操作

```bash
# 备份数据库
cp ~/.fastclaw/fastclaw.db ~/.fastclaw/backup/backup_$(date +%Y%m%d_%H%M%S).db

# 查看用户列表
sqlite3 ~/.fastclaw/fastclaw.db "SELECT username, email, role FROM users;"

# 数据库优化
sqlite3 ~/.fastclaw/fastclaw.db "VACUUM; ANALYZE;"

# 数据库大小
du -h ~/.fastclaw/fastclaw.db
```

---

## 🧪 功能测试

### API测试

```bash
# 测试登录API
curl -X POST http://localhost:18953/api/login \
  -H "Content-Type: application/json" \
  -d '{"login":"7aoYi","password":"123456"}'

# 测试通过代理的登录
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"login":"7aoYi","password":"123456"}' \
  -v 2>&1 | grep "set-cookie"
```

### 页面访问测试

```bash
# 测试本地页面
curl -I http://localhost:3000/login
curl -I http://localhost:3000/chat

# 测试外网页面
curl -I https://xinxiannews.info/login
curl -I https://xinxiannews.info/chat
```

---

## 📋 故障排查清单

### 问题: 无法访问外网

- [ ] 检查Cloudflare Tunnel是否运行: `ps aux | grep cloudflared`
- [ ] 检查本地Next.js是否运行: `lsof -i :3000`
- [ ] 测试本地访问: `curl -I http://localhost:3000`
- [ ] 查看隧道日志: `tail -20 /tmp/cloudflared.log`

### 问题: 登录失败

- [ ] 检查FastClaw服务: `lsof -i :18953`
- [ ] 测试API直接调用: `curl -X POST http://localhost:18953/api/login ...`
- [ ] 检查API代理: `curl -X POST http://localhost:3000/api/login ...`
- [ ] 查看用户数据: `sqlite3 ~/.fastclaw/fastclaw.db "SELECT * FROM users WHERE username='7aoYi';"`

### 问题: 页面空白

- [ ] 检查Next.js构建: `cd ~/amazon-web-agent/web && pnpm build`
- [ ] 查看Next.js日志: `tail -50 /tmp/next-prod.log`
- [ ] 检查浏览器控制台错误
- [ ] 验证内联样式存在: `curl http://localhost:3000/login | grep "style="`

---

## 🔧 开发环境

### 启动开发服务器

```bash
cd ~/amazon-web-agent/web
pnpm dev
# 访问 http://localhost:3000
```

### 运行测试

```bash
cd ~/amazon-web-agent/web
pnpm test           # 运行所有测试
pnpm test:watch  # 监视模式
```

### 代码热重载

开发模式下修改代码会自动刷新，无需手动重启。

---

## 📞 紧急联系

### 快速诊断

```bash
# 一键诊断所有关键点
echo "=== 紧急诊断 ===" && \
echo "FastClaw: $(lsof -i :18953 | head -1 || echo '❌未运行')" && \
echo "Next.js: $(lsof -i :3000 | head -1 || echo '❌未运行')" && \
echo "Cloudflare: $(ps aux | grep cloudflared | grep -v grep | head -1 || echo '❌未运行')" && \
echo "外网访问: $(curl -s -o /dev/null -w '%{http_code}' https://xinxiannews.info/login)" && \
echo "本地访问: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login)"
```

### 关键路径

```bash
# 项目根目录
cd ~/amazon-web-agent

# 前端目录
cd ~/amazon-web-agent/web

# FastClaw目录
cd ~/.fastclaw

# 数据库位置
~/.fastclaw/fastclaw.db
```

---

**更新时间**: 2026年5月9日
**维护者**: AI QA Agent
