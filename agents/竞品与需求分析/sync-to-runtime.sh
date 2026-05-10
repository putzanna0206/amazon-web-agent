#!/bin/bash
# 同步 agents/ 源文件到 FastClaw 运行时
# 需要先登录获取 token

set -e

AGENT_HOME="$HOME/.fastclaw/agents/agt_8443b1b15e52f2a9b8f8/agent"
AGENT_ID="agt_8443b1b15e52f2a9b8f8"
SRC="$(dirname "$0")"

echo "=== 同步 Agent 知识源到运行时 ==="

# 1. SKILL.md 文件（直接替换文件系统）
echo ""
echo "--- 同步 4 个 SKILL.md ---"

SKILLS=("market-research:市场调研" "competitor-analysis:竞品分析" "user-model:用户模型" "product-evaluation:选品评估")

for pair in "${SKILLS[@]}"; do
  dir="${pair%%:*}"
  cn="${pair##*:}"
  target="$AGENT_HOME/skills/$dir/SKILL.md"
  source="$SRC/skills/$cn.md"

  if [ ! -f "$source" ]; then
    echo "❌ 源文件不存在: $source"
    exit 1
  fi

  cp "$source" "$target"
  echo "✅ $dir/SKILL.md ← $cn.md"
done

# 2. TOOLS.md（放文件系统，loadFile 会 fallback 到这里）
echo ""
echo "--- 同步 TOOLS.md ---"
cp "$SRC/tools/TOOLS.md" "$AGENT_HOME/TOOLS.md"
echo "✅ TOOLS.md → $AGENT_HOME/TOOLS.md"

# 3. SOUL.md（需要通过 API 写入数据库，因为数据库有旧版会优先读取）
echo ""
echo "--- SOUL.md 需要通过 API 写入数据库 ---"
echo "数据库里已有旧版 SOUL.md，文件系统的文件不会被读取（数据库优先）"
echo ""
echo "请通过 FastClaw Admin UI 操作："
echo "1. 打开 http://localhost:18953 → 登录 → Agents → 竞品与需求分析 → Customize"
echo "2. 选择 SOUL.md tab"
echo "3. 全选 → 粘贴 $SRC/SOUL.md 的内容"
echo "4. 点 Save"
echo ""
echo "或者用命令行（需要先登录获取 token）："
echo "  # 1. 登录获取 token"
echo "  TOKEN=\$(curl -s -X POST http://localhost:18953/api/login -H 'Content-Type: application/json' -d '{\"login\":\"YOUR_USER\",\"password\":\"YOUR_PASS\"}' | python3 -c 'import sys,json; print(json.load(sys.stdin)[\"token\"])')"
echo ""
echo "  # 2. 写入 SOUL.md"
echo "  curl -X PUT http://localhost:18953/api/agents/$AGENT_ID/system-files/SOUL.md \\"
echo "    -H \"Authorization: Bearer \$TOKEN\" \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d \"{\\\"content\\\":\\\"$(cat "$SRC/SOUL.md" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read())[1:-1])')\\\"}\""

echo ""
echo "=== 同步完成（SOUL.md 除外）==="
