# AI Agent 安全协议

> **核心原则**: 我做执行，用户做决策。任何危险操作前自动备份，操作后自动验证。
> **触发条件**: 每次执行可能影响系统的操作前

---

## 🛡️ **安全协议（自动执行）**

### **第1步：危险操作前自动备份**

```bash
# 每次危险操作前自动执行
AUTO_BACKUP() {
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_DIR="/Users/7aoyi/backups/fastclaw_auto/$TIMESTAMP"

    # 1. 备份数据库
    mkdir -p "$BACKUP_DIR"
    cp ~/.fastclaw/fastclaw.db "$BACKUP_DIR/fastclaw.db"

    # 2. 备份配置文件
    cp -r ~/.fastclaw/agents "$BACKUP_DIR/" 2>/dev/null || true
    cp -r ~/.fastclaw/workspaces "$BACKUP_DIR/" 2>/dev/null || true

    # 3. 记录当前状态
    echo "备份时间: $(date)" > "$BACKUP_DIR/backup_info.txt"
    echo "备份原因: $1" >> "$BACKUP_DIR/backup_info.txt"
    sqlite3 ~/.fastclaw/fastclaw.db ".schema" >> "$BACKUP_DIR/backup_info.txt"

    echo "🔄 自动备份完成: $BACKUP_DIR"
}
```

### **第2步：操作后自动验证**

```bash
# 每次操作后自动执行
AUTO_VERIFY() {
    echo "🔍 自动验证系统状态..."

    # 1. 检查进程
    FASTCLAW_RUNNING=$(ps aux | grep "fastclaw gateway" | grep -v grep | wc -l)
    NEXTJS_RUNNING=$(ps aux | grep "next-server" | grep -v grep | wc -l)

    # 2. 检查API
    FASTCLAW_API=$(curl -s http://localhost:18953/api/agents > /dev/null && echo "OK" || echo "FAIL")
    NEXTJS_API=$(curl -s http://localhost:3000 > /dev/null && echo "OK" || echo "FAIL")

    # 3. 检查数据库
    DB_OK=$(sqlite3 ~/.fastclaw/fastclaw.db "SELECT 1" > /dev/null 2>&1 && echo "OK" || echo "FAIL")

    # 4. 检查关键数据
    USER_COUNT=$(sqlite3 ~/.fastclaw/fastclaw.db "SELECT COUNT(*) FROM users")
    AGENT_COUNT=$(sqlite3 ~/.fastclaw/fastclaw.db "SELECT COUNT(*) FROM agents")

    echo "📊 验证结果:"
    echo "  FastClaw进程: $FASTCLAW_RUNNING"
    echo "  Next.js进程: $NEXTJS_RUNNING"
    echo "  FastClaw API: $FASTCLAW_API"
    echo "  Next.js API: $NEXTJS_API"
    echo "  数据库: $DB_OK"
    echo "  用户数: $USER_COUNT"
    echo "  Agent数: $AGENT_COUNT"

    # 5. 判断是否需要回滚
    if [ "$FASTCLAW_RUNNING" -eq 0 ] || [ "$FASTCLAW_API" = "FAIL" ] || [ "$DB_OK" = "FAIL" ]; then
        echo "🚨 系统验证失败！需要立即修复！"
        return 1
    else
        echo "✅ 系统验证通过"
        return 0
    fi
}
```

### **第3步：破坏检测和自动回滚**

```bash
# 检测到破坏时自动执行
AUTO_ROLLBACK() {
    BACKUP_DIR="$1"

    echo "🔄 开始自动回滚..."
    echo "使用备份: $BACKUP_DIR"

    # 1. 停止服务
    pkill -f "fastclaw gateway" || true

    # 2. 恢复数据库
    cp "$BACKUP_DIR/fastclaw.db" ~/.fastclaw/fastclaw.db

    # 3. 恢复配置
    rm -rf ~/.fastclaw/agents
    rm -rf ~/.fastclaw/workspaces
    cp -r "$BACKUP_DIR/agents" ~/.fastclaw/ 2>/dev/null || true
    cp -r "$BACKUP_DIR/workspaces" ~/.fastclaw/ 2>/dev/null || true

    # 4. 重启服务
    fastclaw gateway --port 18953 > ~/.fastclaw/logs/gateway.log 2>&1 &

    # 5. 验证恢复
    sleep 3
    AUTO_VERIFY

    echo "✅ 自动回滚完成"
}
```

---

## 🎯 **工作流程（职责明确）**

### **我的职责（执行层）**
```
✅ 自动备份
✅ 执行操作
✅ 自动验证
✅ 检测问题
✅ 自动修复
✅ 汇报状态
```

### **用户的职责（决策层）**
```
✅ 批准操作
✅ 选择方案
✅ 确认修复
✅ 决策方向
```

---

## 📋 **操作前检查清单**

### **危险操作定义**
```bash
# 以下操作必须经过安全协议：
IS_DANGEROUS_OPERATION() {
    OPERATION="$1"

    # 危险操作列表
    DANGEROUS_PATTERNS=(
        "DELETE FROM"
        "DROP TABLE"
        "UPDATE.*SET.*WHERE"
        "kill.*fastclaw"
        "rm -rf.*fastclaw"
        "restart.*fastclaw"
        "modify.*database"
        "change.*config"
    )

    for pattern in "${DANGEROUS_PATTERNS[@]}"; do
        if echo "$OPERATION" | grep -qE "$pattern"; then
            return 0  # 是危险操作
        fi
    done

    return 1  # 不是危险操作
}
```

### **安全操作流程**
```bash
SAFE_EXECUTE() {
    OPERATION="$1"
    REASON="$2"

    echo "📋 准备执行操作: $OPERATION"
    echo "原因: $REASON"

    # 1. 检查是否危险
    if IS_DANGEROUS_OPERATION "$OPERATION"; then
        echo "⚠️  检测到危险操作"

        # 2. 自动备份
        AUTO_BACKUP "$REASON"
        BACKUP_DIR="$BACKUP_DIR"

        # 3. 询问用户
        echo "❓ 需要用户确认: 是否执行此操作？"
        echo "操作: $OPERATION"
        echo "备份: $BACKUP_DIR"

        # 这里等待用户确认
        read -p "确认执行？[y/N] " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "❌ 用户取消操作"
            return 1
        fi
    fi

    # 4. 执行操作
    echo "🔄 执行操作..."
    eval "$OPERATION"
    EXEC_RESULT=$?

    # 5. 自动验证
    if ! AUTO_VERIFY; then
        echo "🚨 操作后验证失败！"

        if [ -n "$BACKUP_DIR" ]; then
            echo "🔄 开始自动回滚..."
            AUTO_ROLLBACK "$BACKUP_DIR"
        fi

        return 1
    fi

    echo "✅ 操作完成并验证通过"
    return 0
}
```

---

## 🚨 **破坏检测和恢复**

### **实时监控脚本**
```bash
#!/bin/bash
# 后台运行，实时监控系统状态

while true; do
    # 每分钟检查一次
    sleep 60

    # 检查关键指标
    FASTCLAW_UP=$(curl -s http://localhost:18953/api/agents > /dev/null && echo "1" || echo "0")

    if [ "$FASTCLAW_UP" = "0" ]; then
        echo "🚨 检测到FastClaw服务停止！"
        echo "时间: $(date)"

        # 尝试自动重启
        fastclaw gateway --port 18953 > ~/.fastclaw/logs/gateway.log 2>&1 &

        sleep 3

        # 如果还是失败，通知用户
        FASTCLAW_UP=$(curl -s http://localhost:18953/api/agents > /dev/null && echo "1" || echo "0")
        if [ "$FASTCLAW_UP" = "0" ]; then
            echo "🚨🚨🚨 自动重启失败！需要用户介入！"
            # 这里可以发送通知
        fi
    fi
done &
```

---

## 📊 **系统状态报告模板**

### **每次操作后自动生成**
```markdown
## 系统状态报告

**操作时间**: YYYY-MM-DD HH:MM:SS
**操作内容**: [具体操作]
**操作人**: AI Agent

### 操作前状态
- FastClaw: ✅ 运行中
- Next.js: ✅ 运行中
- 数据库: ✅ 正常
- 用户数: X
- Agent数: Y

### 操作内容
- 备份位置: /path/to/backup
- 执行命令: [具体命令]
- 执行结果: 成功/失败

### 操作后状态
- FastClaw: ✅/❌
- Next.js: ✅/❌
- 数据库: ✅/❌
- 用户数: X
- Agent数: Y

### 验证结果
- ✅ 系统验证通过
- ❌ 系统验证失败，已自动回滚

### 用户需要知道
- [ ] 是否需要重启服务
- [ ] 是否需要清理临时文件
- [ ] 是否有其他需要注意的事项
```

---

## 🎯 **立即行动**

### **建立自动化保护**
```bash
#!/bin/bash
# 立即执行，建立保护机制

# 1. 创建备份目录
mkdir -p /Users/7aoyi/backups/fastclaw_auto

# 2. 立即备份当前状态
AUTO_BACKUP "建立安全协议前的初始备份"

# 3. 启动监控脚本
nohup bash /path/to/monitor_script.sh > /tmp/monitor.log 2>&1 &

# 4. 记录当前状态
AUTO_VERIFY > /tmp/current_status.txt

echo "✅ 安全协议已建立"
```

---

**文档版本**: v1.0
**创建日期**: 2026-05-09
**触发原因**: 用户指出我没有自我保护意识，可能破坏系统而不知
**核心原则**: 我做执行，用户做决策
