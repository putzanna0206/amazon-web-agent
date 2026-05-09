# AmaWebAgent 标准问题诊断流程

> **目的**: 提供系统性的问题诊断方法，避免盲目尝试
> **适用范围**: 所有技术问题的诊断和解决
> **核心原则**: 建立反馈循环，用数据说话

---

## 🚀 **快速诊断流程（5步法）**

### **第1步：理解问题（5分钟）**

#### 🔍 **关键问题清单**

```bash
# 1. 问题表现
- 具体错误信息是什么？
- 什么时候开始的？
- 影响范围多大？

# 2. 使用场景
- 用户是本地使用还是外网访问？
- 开发环境还是生产环境？
- 之前工作正常吗？

# 3. 最近变更
- 最近有没有升级/修改？
- 有没有配置变更？
- 有没有代码部署？
```

#### 📋 **信息收集模板**

```markdown
## 问题报告

**报告时间**: YYYY-MM-DD HH:MM
**报告人**: 用户名
**问题描述**: [一句话描述]

### 症状
- 错误信息: [完整错误消息]
- 发生时间: [具体时间]
- 影响功能: [哪些功能受影响]
- 影响用户: [多少用户受影响]

### 环境
- 访问方式: [本地/外网]
- 浏览器/客户端: [具体版本]
- 网络环境: [WiFi/4G/公司网络]

### 最近变更
- 代码变更: [有/无，具体内容]
- 配置变更: [有/无，具体内容]
- 环境变更: [有/无，具体内容]

### 复现步骤
1. 步骤1
2. 步骤2
3. 出现错误

### 预期行为 vs 实际行为
- 预期: [应该怎样]
- 实际: [实际怎样]
```

---

### **第2步：建立反馈循环（15分钟）**

#### ⚡ **为什么要建立反馈循环？**

```
❌ 没有反馈循环:
修改配置 → 重启服务 → 等待用户测试 → 发现失败 → 重复
耗时: 每次循环10-30分钟

✅ 有反馈循环:
创建测试脚本 → 运行测试 → 立即看到结果 → 调整
耗时: 每次循环30秒
```

#### 🛠️ **快速测试脚本模板**

```bash
#!/bin/bash
# 快速健康检查脚本

echo "🔍 开始系统健康检查..."

# 1. 检查服务状态
echo "📋 检查服务状态..."
curl -s http://localhost:3000 > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Next.js前端: 正常"
else
    echo "❌ Next.js前端: 异常"
fi

curl -s http://localhost:18953/api/agents > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ FastClaw后端: 正常"
else
    echo "❌ FastClaw后端: 异常"
fi

# 2. 检查关键功能
echo "📋 检查登录功能..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"login":"test","password":"test"}')
echo "$LOGIN_RESPONSE" | grep -q "ok"
if [ $? -eq 0 ]; then
    echo "✅ 登录API: 正常"
else
    echo "❌ 登录API: 异常"
fi

# 3. 检查数据库连接
echo "📋 检查数据库..."
sqlite3 ~/.fastclaw/fastclaw.db "SELECT 1" > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ 数据库: 正常"
else
    echo "❌ 数据库: 异常"
fi

echo "🔍 健康检查完成"
```

#### 🔄 **反馈循环原则**

1. **快速**: 每次循环<1分钟
2. **可重复**: 同样的输入总是同样的输出
3. **自动化**: 尽可能自动化
4. **数据驱动**: 不靠感觉，靠数据

---

### **第3步：逐层排查（30分钟）**

#### 🏗️ **系统架构分层**

```
┌─────────────────────────────────────┐
│   用户界面层 (浏览器/前端)            │
├─────────────────────────────────────┤
│   API网关层 (Next.js API路由)        │
├─────────────────────────────────────┤
│   业务逻辑层 (FastClaw后端)           │
├─────────────────────────────────────┤
│   数据存储层 (SQLite数据库)           │
├─────────────────────────────────────┤
│   外部服务层 (MiniMax API等)          │
└─────────────────────────────────────┘
```

#### 🔍 **逐层测试顺序**

```bash
# 第1层：用户界面层
echo "📋 测试前端是否正常..."
curl -s http://localhost:3000 | grep -q "AmaWebAgent"
# 如果失败 → 前端问题

# 第2层：API网关层
echo "📋 测试API代理是否正常..."
curl -s http://localhost:3000/api/agents
# 如果失败 → API代理问题

# 第3层：业务逻辑层
echo "📋 测试FastClaw是否正常..."
curl -s http://localhost:18953/api/agents
# 如果失败 → FastClaw问题

# 第4层：数据存储层
echo "📋 测试数据库是否正常..."
sqlite3 ~/.fastclaw/fastclaw.db "SELECT COUNT(*) FROM users"
# 如果失败 → 数据库问题

# 第5层：外部服务层
echo "📋 测试MiniMax API是否正常..."
curl -s https://api.minimaxi.com/anthropic/v1/messages
# 如果失败 → 外部API问题
```

#### 📊 **分层测试结果记录**

```markdown
## 分层测试结果

| 层级 | 测试项 | 状态 | 响应时间 | 备注 |
|------|--------|------|----------|------|
| 前端 | HTTP 200 | ✅ | 50ms | 正常 |
| API代理 | /api/agents | ❌ | - | 返回400 |
| FastClaw | /api/agents | ✅ | 30ms | 正常 |
| 数据库 | SELECT查询 | ✅ | 10ms | 正常 |
| MiniMax API | API调用 | ✅ | 500ms | 正常 |

**结论**: 问题在API代理层，FastClaw本身正常
```

---

### **第4步：假设验证（20分钟）**

#### 🎯 **生成3-5个假设**

```
基于前面的分层测试，生成假设：

假设1（可能性70%）:
- 问题: API代理没有正确转发认证头
- 验证: 检查API代理代码中的Cookie转发
- 预测: 修复Cookie转发后问题解决

假设2（可能性20%）:
- 问题: FastClaw配置错误
- 验证: 检查agent和provider配置
- 预测: 修复配置后问题解决

假设3（可能性10%）:
- 问题: 前端发送的请求格式错误
- 验证: 检查前端请求格式
- 预测: 修复请求格式后问题解决
```

#### 🧪 **验证假设**

```bash
# 验证假设1: 检查Cookie转发
echo "🔍 验证假设1: Cookie转发..."
curl -v http://localhost:3000/api/agents \
  -H "Cookie: fastclaw_session=test" 2>&1 | grep -i "cookie"
# 如果看到Cookie被转发 → 假设1错误
# 如果没有看到Cookie → 假设1正确

# 验证假设2: 检查FastClaw配置
echo "🔍 验证假设2: FastClaw配置..."
sqlite3 ~/.fastclaw/fastclaw.db "SELECT config FROM agents"
# 如果配置格式错误 → 假设2正确

# 验证假设3: 检查前端请求格式
echo "🔍 验证假设3: 前端请求格式..."
# 打开浏览器开发者工具，查看Network标签
# 检查请求的Content-Type和Body格式
```

#### 📋 **假设验证记录表**

```markdown
## 假设验证记录

| 假设 | 可能性 | 验证方法 | 结果 | 结论 |
|------|--------|----------|------|------|
| Cookie转发问题 | 70% | 检查API代理代码 | ❌ Cookie正常转发 | 排除 |
| FastClaw配置错误 | 20% | 检查数据库配置 | ✅ 配置格式错误 | 确认原因 |
| 前端请求格式错误 | 10% | 检查Network标签 | - | - |

**最终结论**: 假设2正确，FastClaw配置格式错误
```

---

### **第5步：修复验证（10分钟）**

#### 🛠️ **修复流程**

```bash
# 1. 备份当前状态
git add -A && git commit -m "backup: 修复前状态"

# 2. 应用修复
# [具体的修复操作]

# 3. 重启相关服务
# [重启命令]

# 4. 运行验证测试
./quick_test.sh

# 5. 如果成功，提交修复
git add -A && git commit -m "fix: 具体修复内容"

# 6. 如果失败，回滚
git reset --hard HEAD~1
```

#### ✅ **验证清单**

```markdown
## 修复验证清单

### 功能验证
- [ ] 问题症状消失
- [ ] 相关功能正常
- [ ] 没有引入新问题

### 性能验证
- [ ] 响应时间正常
- [ ] 没有性能下降
- [ ] 资源使用正常

### 兼容性验证
- [ ] 浏览器兼容性
- [ ] 设备兼容性
- [ ] 版本兼容性

### 文档更新
- [ ] 更新WORK_LOG.md
- [ ] 更新ISSUE_ANALYSIS.md（如果是重大问题）
- [ ] 更新相关技术文档
```

---

## 🚨 **常见问题快速诊断**

### **问题1: 聊天功能失败**

```bash
# 快速诊断脚本
curl -s http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"login":"7aoYi","password":"123456"}' \
  -c /tmp/cookies.txt

curl -s http://localhost:3000/api/chat/stream \
  -H "Content-Type: application/json" \
  -H "Cookie: $(cat /tmp/cookies.txt | grep fastclaw_session | cut -f7)" \
  -d '{"agentId":"agt_8443b1b15e52f2a9b8f8","sessionId":"test","message":"你好"}'

# 预期结果:
# - 如果返回200且AI响应 → 正常
# - 如果返回400/401 → 认证问题
# - 如果返回"invalid character" → FormData格式问题
```

### **问题2: 登录失败**

```bash
# 检查用户是否存在
sqlite3 ~/.fastclaw/fastclaw.db "SELECT username FROM users"

# 重置密码
python3 <<'EOF'
import bcrypt, sqlite3
hash = bcrypt.hashpw('123456'.encode(), bcrypt.gensalt()).decode()
conn = sqlite3.connect('/Users/7aoyi/.fastclaw/fastclaw.db')
conn.execute("UPDATE users SET password_hash = ? WHERE username = '7aoYi'", (hash,))
conn.commit()
EOF

# 测试登录
curl -s http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"login":"7aoYi","password":"123456"}'
```

### **问题3: API代理错误**

```bash
# 检查Next.js日志
tail -50 ~/.pm2/logs/web-out.log

# 检查FastClaw日志
tail -50 ~/.fastclaw/logs/gateway.log

# 测试FastClaw直连
curl -s http://localhost:18953/api/agents

# 如果FastClaw直连正常，但通过Next.js失败 → API代理问题
```

---

## 📊 **效率对比**

### **传统方法 vs 系统性方法**

| 阶段 | 传统方法 | 系统性方法 | 效率提升 |
|------|----------|------------|----------|
| 理解问题 | 靠猜测 | 结构化清单 | 2x |
| 建立测试 | 手动测试 | 自动化脚本 | 10x |
| 问题定位 | 随机尝试 | 逐层排查 | 5x |
| 假设验证 | 单一假设 | 多假设并行 | 3x |
| 修复验证 | 手动验证 | 自动验证 | 5x |

**总体效率**: **系统性方法比传统方法快10-50倍**

---

## 🎯 **最佳实践**

### **DO ✅**

1. **先理解，后行动**
   - 用5分钟理解问题和环境
   - 用15分钟建立测试脚本
   - 用30分钟系统性诊断

2. **用数据说话**
   - 记录每次测试的结果
   - 用数字衡量改进
   - 不靠感觉，靠证据

3. **建立知识库**
   - 记录每次问题的解决过程
   - 创建可复用的诊断脚本
   - 分享经验和教训

### **DON'T ❌**

1. **不要盲目修改**
   - 不理解问题就修改配置
   - 不验证效果就继续下一步
   - 不记录过程就忘记教训

2. **不要单一假设**
   - 只有一个想法就深入
   - 忽视其他可能性
   - 过度依赖经验

3. **不要忽略用户反馈**
   - 用户的线索很关键
   - 他们比你更了解系统
   - 认真倾听每个细节

---

## 📚 **相关资源**

### **内部文档**
- `WORK_LOG.md` - 工作日志
- `ISSUE_ANALYSIS.md` - 问题复盘
- `MAINTENANCE_LOG.md` - 维护记录
- `README.md` - 项目说明

### **外部资源**
- FastClaw文档: https://fastclaw.dev/docs
- Next.js文档: https://nextjs.org/docs
- SQLite文档: https://www.sqlite.org/docs.html

### **工具和脚本**
- `/tmp/test_frontend_flow.js` - 前端功能测试
- `/tmp/test_json_format.js` - JSON格式测试
- `/tmp/quick_health_check.sh` - 快速健康检查

---

## 🔄 **持续改进**

### **定期回顾**
- 每周回顾本周问题
- 每月总结常见问题模式
- 每季度更新诊断流程

### **流程优化**
- 记录每次诊断的耗时
- 找出效率瓶颈
- 改进工具和脚本

### **知识分享**
- 团队内部分享会
- 编写最佳实践文档
- 培训新的开发者

---

**文档版本**: v1.0
**创建日期**: 2026-05-09
**最后更新**: 2026-05-09
**维护人**: AI Agent

**重要提醒**:
- 遇到技术问题，优先使用 `/diagnose` 技能
- 建立反馈循环比盲目尝试有效10倍
- 30分钟的系统性诊断 > 3小时的盲目修改
