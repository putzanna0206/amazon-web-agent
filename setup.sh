#!/bin/bash
# 构建并安装 FastClaw 二进制到 ~/.local/bin/fastclaw
#
# 范围：仅"源码 → 二进制"。daemon 启停、agent/provider/MCP 配置、secrets
# 由用户后续手动操作（避免脚本误动现有运行时状态）。
#
# 用法：在仓库根目录跑 `./setup.sh`

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
FC="$REPO_ROOT/fastclaw"
BIN_DIR="$HOME/.local/bin"
BIN="$BIN_DIR/fastclaw"

echo "=== FastClaw 构建脚本 ==="
echo "仓库根: $REPO_ROOT"
echo "fork  : $FC"
echo "目标  : $BIN"
echo ""

# 1. 工具链检查
echo "--- 1/5 检查工具链 ---"
missing=0
for cmd in go pnpm; do
  if command -v "$cmd" >/dev/null 2>&1; then
    echo "✅ $cmd: $($cmd --version 2>&1 | head -1)"
  else
    echo "❌ 缺少 $cmd"
    missing=1
  fi
done
if [ "$missing" = "1" ]; then
  echo ""
  echo "请先安装缺失的工具："
  echo "  go   : https://go.dev/dl/"
  echo "  pnpm : npm i -g pnpm"
  exit 1
fi

# 2. 构建 admin web
echo ""
echo "--- 2/5 构建 admin web (fastclaw/web) ---"
cd "$FC/web"
pnpm install
pnpm build
cd "$FC"

# 3. embed web 产物到 internal/setup/web
echo ""
echo "--- 3/5 嵌入 web 产物 ---"
rm -rf internal/setup/web
cp -r web/out internal/setup/web
echo "✅ web/out → internal/setup/web"

# 4. go build
echo ""
echo "--- 4/5 编译 fastclaw 二进制 ---"
go build -o fastclaw-test ./cmd/fastclaw
echo "✅ 编译完成: $FC/fastclaw-test"

# 5. 安装到 ~/.local/bin/
echo ""
echo "--- 5/5 安装到 $BIN ---"
mkdir -p "$BIN_DIR"
if [ -x "$BIN" ]; then
  echo "检测到现有二进制。如 daemon 在跑请先手动停："
  echo "  $BIN daemon stop"
  echo ""
  read -r -p "继续覆盖现有二进制？[y/N] " ans
  case "$ans" in
    y|Y) ;;
    *) echo "已取消。"; exit 0 ;;
  esac
fi
cp fastclaw-test "$BIN"
chmod +x "$BIN"
echo "✅ 已安装: $BIN"

echo ""
echo "=== 构建完成 ==="
echo ""
echo "下一步（脚本不替你做，避免误动现有状态）："
echo "  1. 启动 daemon         : $BIN daemon start"
echo "  2. 打开 admin UI       : http://localhost:18953"
echo "  3. 创建用户、配置       : Provider (MiniMax)、MCP server (Sorftime)"
echo "  4. 创建 Agent           : 记下生成的 agent ID"
echo "  5. 改 sync 脚本里的 ID  : agents/竞品与需求分析/sync-to-runtime.sh"
echo "  6. 跑 sync 脚本         : ./agents/竞品与需求分析/sync-to-runtime.sh"
echo "  7. SOUL.md 写入数据库    : 在 admin UI Customize 标签粘贴 SOUL.md 全文"
echo "                           (脚本最后一步会打印 curl 替代命令)"
echo ""
echo "Web UI 开发："
echo "  cd web && pnpm install && pnpm dev    # localhost:3000"
