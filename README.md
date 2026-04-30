# Amazon Web Agent

对话式亚马逊品类分析 Agent。用户自由提问，Agent 调度 4 个分析模块 + Sorftime 数据，输出分析结论和 PDF 报告。

## 快速启动

```bash
cd backend
cp .env.example .env
# 编辑 .env 填入 API keys
./run.sh
```

打开 http://localhost:8000/static/index.html

## 环境变量

| 变量 | 说明 |
|---|---|
| MINIMAX_API_KEY | MiniMax API 密钥 |
| MINIMAX_BASE_URL | MiniMax API 地址（默认 https://api.minimax.chat/v1） |
| MINIMAX_MODEL | 模型名（默认 MiniMax-M2.7） |
| SORFTIME_MCP_URL | Sorftime MCP 服务地址 |
| AGENT_DATA_DIR | Agent 数据目录（默认 ../../agents） |

## 项目结构

```
backend/       — FastAPI 后端
agents/        — Agent 知识文件（SOUL.md + skills + tools）
frontend/      — 聊天 UI（vanilla HTML/JS）
```

## 技术栈

- Python 3.14 + FastAPI
- MiniMax M2.7 (OpenAI 兼容协议)
- Sorftime MCP (数据源)
- Chrome headless (PDF 生成)
