# 竞品与需求分析 Agent 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建对话式亚马逊品类分析 Web Agent，用户自由提问，Agent 调度 4 个分析模块 + Sorftime 数据，输出分析结论和 PDF 报告。

**Architecture:** Python + FastAPI 后端，MiniMax M2.7 作为 LLM（OpenAI 兼容协议），Sorftime MCP 远程服务作为数据源。路由 Agent + Skill 模块架构，SOUL.md 轻量核心 + 渐进式加载 skill。SSE 流式响应，内存会话管理。

**Tech Stack:** Python 3.14, FastAPI, openai SDK, mcp SDK, Pydantic, Chrome headless (PDF)

**Spec:** `docs/superpowers/specs/2026-04-30-agent-design.md`

---

## File Structure

```
amazon-web-agent/
├── backend/
│   ├── pyproject.toml
│   ├── .env.example
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app, CORS, static files, routes
│   │   ├── config.py            # Settings from env vars (Pydantic BaseSettings)
│   │   ├── chat.py              # POST /api/chat endpoint + SSE streaming
│   │   ├── prompt_builder.py    # Load SOUL.md, load skill files, build system prompt
│   │   ├── llm_client.py        # MiniMax M2.7 via OpenAI SDK, streaming + tool_call
│   │   ├── session.py           # In-memory session manager, conversation history
│   │   ├── tool_executor.py     # Sorftime MCP client + tool dispatch
│   │   └── report.py            # HTML → PDF report generator
│   └── tests/
│       ├── __init__.py
│       ├── conftest.py
│       ├── test_prompt_builder.py
│       ├── test_session.py
│       ├── test_llm_client.py
│       ├── test_chat.py
│       └── test_tool_executor.py
├── agents/
│   └── 竞品与需求分析/
│       ├── SOUL.md              # ~100 行核心：角色+原则+路由+质检+报告触发
│       ├── skills/
│       │   ├── 市场调研.md       # ~150-200 行：执行步骤+输出规范
│       │   ├── 竞品分析.md       # ~150-200 行
│       │   ├── 用户模型.md       # ~100 行
│       │   └── 交易模型.md       # ~100 行
│       ├── tools/
│       │   ├── sorftime.md      # Sorftime 工具调用指南
│       │   └── report.md        # 报告生成规范+HTML模板
│       └── examples/
│           └── 开场示例.md       # Agent 开场话术
└── frontend/
    └── index.html               # 单页面聊天 UI（vanilla JS + SSE）
```

---

### Task 1: Project Scaffold

**Files:**
- Create: `backend/pyproject.toml`
- Create: `backend/.env.example`
- Create: `backend/app/__init__.py`
- Create: `backend/app/main.py`
- Create: `backend/app/config.py`
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/conftest.py`

- [ ] **Step 1: Create pyproject.toml**

```toml
[project]
name = "amazon-web-agent"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115",
    "uvicorn[standard]>=0.34",
    "openai>=1.60",
    "mcp>=1.6",
    "pydantic-settings>=2.7",
    "httpx-sse>=0.4",
    "jinja2>=3.1",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "pytest-asyncio>=0.24",
    "httpx>=0.28",
]
```

- [ ] **Step 2: Create .env.example**

```
MINIMAX_API_KEY=your-minimax-api-key
MINIMAX_BASE_URL=https://api.minimax.chat/v1
MINIMAX_MODEL=MiniMax-M2.7
SORFTIME_MCP_URL=https://mcp.sorftime.com?key=your-sorftime-key
AGENT_DATA_DIR=../../agents
```

- [ ] **Step 3: Create config.py**

```python
from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    minimax_api_key: str = ""
    minimax_base_url: str = "https://api.minimax.chat/v1"
    minimax_model: str = "MiniMax-M2.7"
    sorftime_mcp_url: str = ""
    agent_data_dir: str = "../../agents"

    model_config = {"env_file": ".env", "extra": "ignore"}

    @property
    def agent_base_path(self) -> Path:
        return Path(self.agent_data_dir)


settings = Settings()
```

- [ ] **Step 4: Create main.py**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

app = FastAPI(title="Amazon Web Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount frontend
frontend_dir = Path(__file__).resolve().parent.parent.parent / "frontend"
if frontend_dir.is_dir():
    app.mount("/static", StaticFiles(directory=str(frontend_dir)), name="static")


@app.get("/health")
async def health():
    return {"status": "ok"}
```

- [ ] **Step 5: Create test conftest.py and empty __init__.py files**

```python
# backend/app/__init__.py
```

```python
# backend/tests/__init__.py
```

```python
# backend/tests/conftest.py
import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
```

- [ ] **Step 6: Write failing test for health endpoint**

```python
# backend/tests/test_main.py
import pytest


@pytest.mark.asyncio
async def test_health(client):
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}
```

- [ ] **Step 7: Install dependencies and run test**

```bash
cd backend
python3.14 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
pytest tests/test_main.py -v
```

Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add backend/
git commit -m "feat: project scaffold with FastAPI, config, and health endpoint"
```

---

### Task 2: Agent Knowledge Files

**Files:**
- Create: `agents/竞品与需求分析/SOUL.md`
- Create: `agents/竞品与需求分析/skills/市场调研.md`
- Create: `agents/竞品与需求分析/skills/竞品分析.md`
- Create: `agents/竞品与需求分析/skills/用户模型.md`
- Create: `agents/竞品与需求分析/skills/交易模型.md`
- Create: `agents/竞品与需求分析/tools/sorftime.md`
- Create: `agents/竞品与需求分析/tools/report.md`
- Create: `agents/竞品与需求分析/examples/开场示例.md`

- [ ] **Step 1: Create SOUL.md**

```markdown
# 竞品与需求分析 Agent — 核心指令

## 角色

你是亚马逊品类分析专家。用户给你关键词、ASIN、或问题，你帮他们做市场调研、竞品分析、需求解构、交易优化。你用中文沟通，结论明确，数据说话。

## 对话原则

1. 隐藏内部概念（skill 名、工具名、技术细节），用户只看到"做什么、要多久、得到什么"
2. 每次分析前，先告诉用户你的计划，等确认后再执行
3. 分析过程中逐步展示进度，每完成一步给简短提示
4. 结论不用"可能""也许""大概"，不确定就标注"待验证"
5. 每个核心结论必须有数据、评论或配置依据

## 意图识别 + 路由

| 用户输入类型 | 分析方向 | 加载模块 |
|---|---|---|
| 关键词/品类 | 市场规模与机会 | market-research |
| ASIN/链接 | 竞品对比分析 | competitor-analysis |
| 用户行为/评价/需求 | 需求解构 | user-model |
| 定价/转化/成本 | 交易优化 | trade-model |
| 模糊方向 | 先提问澄清 | 视情况定 |
| 追问/深入 | 基于上下文继续 | 可能组合多个 |

判断不了时，问用户 1-2 个选择题来确认方向，不要猜。

## 对话流程

1. 用户输入 → 理解意图
2. 告知计划（做什么、要多久、得到什么）
3. 用户确认 / 补充
4. 执行分析，逐步展示（每步完成后给进度提示）
5. 质检（执行自检清单）
6. 总结核心结论
7. 用户选择：继续深入 / 生成报告 / 结束

## 质检清单

分析完成后，逐一检查：

- **结论有数据支撑吗？** 每个核心结论至少有一个数据/评论/配置依据；没有数据的标注"待验证"
- **有模糊结论吗？** 不允许"可能""也许""大概"；不确定就用"数据不足"或"待验证"
- **分析目标达成了吗？** 回头看用户最初的问题，每个问题是否有明确回答
- **数据完整吗？** 应采集的数据是否都采到了；工具调用失败是否已标注
- **建议可执行吗？** "价格建议 $25-35"是；"可以考虑差异化"否

质检不通过 → 补全修正 → 重新质检。质检通过 → 呈现给用户。

## 报告生成

当用户要求生成报告时：
1. 汇总本轮对话中所有分析结果
2. 按报告模板组织内容
3. 生成带样式的 HTML（A4、中文字体、表格样式）
4. 转 PDF 提供下载

报告内容来源：加载 report 工具模板 + 当前 skill 的报告章节模板。
```

- [ ] **Step 2: Create skills/市场调研.md**

Based on `~/.claude/skills/amazon-market-research-7Y/SKILL.md`, simplified:

```markdown
# 市场调研

## 适用场景
用户给出关键词或品类名称，想了解市场规模、趋势、竞争格局、机会点。

## 执行步骤

### 步骤1：解析输入
提取核心关键词（英文）和补充关注点。如用户输入中文，翻译为对应的英文搜索词。

### 步骤2：核心关键词市场数据
调用 `keyword_detail`（amzSite: "US"）
记录：月搜索量、搜索排名、CPC、旺季、竞品数量、首页评论数分布、Top5产品、Top5品牌。
如返回"非热搜关键词"，从相关词中选最接近的重试一次。

向用户展示："正在查询 [关键词] 的市场数据..."

### 步骤3：关键词趋势
调用 `keyword_trend`（amzSite: "US"）
记录 24 个月搜索量/排名/CPC 趋势，判断增长/平稳/下滑，识别旺季淡季。

向用户展示："趋势分析完成，[关键词] 过去 24 个月 [增长/平稳/下滑]"

### 步骤4：拓展词与细分方向
调用 `keyword_extends`（amzSite: "US"）
分类整理：高流量品类词(>5000) / 细分方向词 / 品牌词 / 长尾需求词(500-5000)。

### 步骤5：搜索结果头部产品
调用 `keyword_search_results`（page=1）
提取前 20 名产品，分析价格带分布、品牌集中度、价格空缺带。

### 步骤6：重点产品详情
对月销量 Top5 调用 `product_detail`
补充评分、评论数、上线天数、核心配置。

向用户展示："数据采集完成，共获取 [X] 个产品的详细信息"

## 对话输出规范
- 每步完成后给用户简短进度提示
- 中间结果用表格展示（价格带、品牌份额等）
- 发现机会点时用"机会点"标记，风险用"风险"标记

## 报告章节模板
### 第一章：市场概览
- 核心市场数据表（月搜索量、CPC、竞品数量）
- 趋势判断（增长/平稳/下滑 + 季节性）

### 第二章：关键词机会图谱
- 关键词层级表（核心词/次级词/细分词/长尾词）
- 细分方向识别

### 第三章：市场竞争格局
- 头部品牌格局表
- 价格带分布表
- 头部产品详情表

### 第四章：机会点与进入建议
- 市场机会点表
- 主要风险点表
- 进入策略建议（价格带/关键词/差异化）
```

- [ ] **Step 3: Create skills/竞品分析.md**

Based on `~/.claude/skills/amazon-competitor-research-7Y/SKILL.md`, simplified:

```markdown
# 竞品分析

## 适用场景
用户给出 ASIN、产品链接或竞品名称，想了解竞品对比、用户画像、痛点机会。

## 执行步骤

### 步骤1：解析输入
提取所有 ASIN（去重），从链接中解析 ASIN。如用户给产品名而非 ASIN，先用 `product_search` 搜索获取 ASIN。

向用户展示："已识别 [X] 个竞品产品，准备采集数据..."

### 步骤2：产品基础信息
对所有 ASIN 调用 `product_detail`
表格展示：产品名称、品牌、价格、评分、评论数、月销量、上架天数、BSR排名。

### 步骤3：评论采集
对销量 Top5 的产品调用 `product_reviews`（Positive + Negative 各一次）
从评论中提取：使用场景、购买动机、用户身份、高频卖点、高频痛点。

向用户展示："已完成 [X] 个产品的评论分析，共分析 [Y] 条评论"

### 步骤4：品类特征对比（可选）
如用户关注配置/功能对比，调用 `similar_product_feature`（从产品标题提取品类英文名）
生成核心配置对比表。

### 步骤5：补充数据（按需）
根据用户问题，按需调用：
- `product_traffic_terms`：流量来源分析
- `keyword_detail`：关键词市场数据
- `product_trend`：单品趋势
- `product_variations`：变体策略

向用户展示："数据采集完成，开始分析..."

## 对话输出规范
- 每完成一批数据采集给用户进度提示
- 分析结果用表格展示
- 竞品对比用多列表格
- 痛点和机会用明显标记

## 报告章节模板
### 第一章：样本整理与基础信息
- 所有竞品基础数据表（按月销量降序）

### 第二章：市场竞争格局
- 价格带分布表
- 品牌集中度表

### 第三章：用户画像与使用场景
- 用户类型表（核心需求、典型场景、评论依据）

### 第四章：核心卖点与差评痛点
- 好评高频卖点表
- 差评高频痛点表（含严重程度）

### 第五章：产品配置对比
- 核心配置对比表
- 行业标配 vs 差异化配置

### 第六章：综合结论与机会点
- 核心发现表
- 机会点表（含优先级）
- 风险点表
- 进入建议（价格带、差异化方向、评论目标）
```

- [ ] **Step 4: Create skills/用户模型.md**

Based on `~/.claude/skills/user-model-7Y/SKILL.md`, simplified:

```markdown
# 用户模型

## 适用场景
用户想了解目标用户的真实需求、使用情境、效用结构，或讨论"用户到底要什么"。

## 执行步骤

### 步骤1：情境还原
识别 3-4 个核心微观情境，每个说清楚：
- 具体的约束条件（时间、预算、场景、心理状态）
- 用户此刻被什么驱动
- 这个情境下的核心需求
- 估算该情境占总需求的比例

如果是亚马逊场景，调用 `keyword_extends` 从搜索词反推用户情境。

向用户展示："已识别 [X] 个核心使用情境..."

### 步骤2：效用解构
调用 `product_reviews` 获取真实评论数据（如有具体产品）。
按四层分级输出：
- **底线需求**：低于此标准用户直接退货（来源：差评/退货数据）
- **够用就好**：达标即可，用户不愿多付钱（来源：中评/行业标准）
- **越多越好**：用户真正买单的核心效用（来源：好评/高转化词）
- **惊喜效用**：低成本带来的超预期体验（来源：超预期好评）

### 步骤3：价值演算
- 旧体验评估：现有竞品给用户的体验，最薄弱环节
- 替换成本分析：认知/信任成本、金钱成本、时间成本、心理成本
- 破局点推演：新体验必须做到什么程度才能让用户切换

向用户展示："价值分析完成"

## 对话输出规范
- 情境描述要具体，有场景画面感
- 效用四层分级用清晰标记区分
- 价值演算用公式展示推理过程

## 报告章节模板
### 第一章：用户情境还原
- 核心使用情境表（约束条件、核心需求、占比）

### 第二章：效用解构
- 效用四层分级表（效用描述、判断标准、数据来源）

### 第三章：价值演算
- 旧体验评估
- 替换成本分析
- 破局点推演

### 第四章：落地策略
- 产品方向建议
- 供应链加减法指令
- 初步定位建议
```

- [ ] **Step 5: Create skills/交易模型.md**

Based on `~/.claude/skills/trade-model-7Y/SKILL.md`, simplified:

```markdown
# 交易模型

## 适用场景
用户想优化定价、提升转化率、降低交易成本，或讨论"用户凭什么选我"。

## 执行步骤

### 步骤1：解构交易盘面
- 我们卖给用户的到底是什么效用？（剥离物理产品，指出核心效用）
- 用户实际付出的全部代价（金钱、时间、体力、心理）
- 利益分配扫描（用户/企业/供应链/平台各方得失）

向用户展示："正在分析交易结构..."

### 步骤2：交易成本诊断
如果是亚马逊场景，调用 `product_reviews` 和 `keyword_search_results` 获取数据。
逐项诊断：
- **搜寻与度量成本**：产品是搜寻品/体验品/信任品？用户判断质量的最大障碍？
- **寻价与决策成本**：SKU 是否过多？价格透明度？
- **实施与保障成本**：用户最大的后顾之忧？损失厌恶触发点？

### 步骤3：机制设计与相对价格优化
针对诊断结果，设计降低交易成本的机制：
- 标准化降阻（把体验品搜寻品化）
- 风险逆转（承诺设计，参照损失厌恶 2.5 倍法则）
- 决策简化（减少选择项/默认推荐/价格锚点）
- 相对价格演算

向用户展示："交易模型分析完成"

## 对话输出规范
- 交易成本用红/黄/绿标记严重程度
- 每个诊断结论附带具体数据依据
- 机制设计要给出可执行的具体动作

## 报告章节模板
### 第一章：交易盘面
- 核心效用定义
- 用户全部代价表
- 利益分配扫描

### 第二章：交易成本诊断
- 三类交易成本诊断结果
- 严重程度标记

### 第三章：机制设计
- 标准化降阻方案
- 风险逆转设计
- 决策简化方案
- 相对价格演算

### 第四章：可持续性评估
- 激励相容检查表
- 长期 vs 短期判断
- 落地执行指令
```

- [ ] **Step 6: Create tools/sorftime.md**

```markdown
# Sorftime 工具调用指南

## 可用工具列表

### 关键词类
| 工具名 | 用途 | 关键参数 |
|---|---|---|
| `keyword_detail` | 关键词市场详情 | keyword, amzSite |
| `keyword_trend` | 关键词趋势（24月） | keyword, amzSite |
| `keyword_extends` | 拓展词与细分方向 | keyword, amzSite |
| `keyword_list` | 关键词列表查询 | keyword, amzSite |
| `keyword_search_results` | 搜索结果头部产品 | keyword, amzSite, page |

### 产品类
| 工具名 | 用途 | 关键参数 |
|---|---|---|
| `product_detail` | 产品详情 | asin 或 productId |
| `product_reviews` | 产品评论 | productId, type(Positive/Negative) |
| `product_trend` | 产品销量趋势 | productId |
| `product_traffic_terms` | 产品流量来源 | productId |
| `product_variations` | 产品变体 | productId |
| `product_search` | 产品搜索 | keyword |

### 品类类
| 工具名 | 用途 | 关键参数 |
|---|---|---|
| `category_report` | 品类报告 | categoryId |
| `category_trend` | 品类趋势 | categoryId |
| `category_keywords` | 品类关键词 | categoryId |
| `category_tree` | 品类树 | nodeId |
| `similar_product_feature` | 品类特征分布 | searchName |

## 调用规范
- 所有 amzSite 默认 "US"（美国站），除非用户指定其他站点
- 产品相关工具需要 productId，可从 product_detail 或 keyword_search_results 获取
- 评论分 Positive/Negative 两种类型，通常分开调用
- 工具调用失败时标注"数据获取失败"，基于已有数据继续分析
```

- [ ] **Step 7: Create tools/report.md**

```markdown
# 报告生成规范

## HTML 模板样式

报告生成 HTML 时使用以下样式：
- 页面：A4 尺寸，margin: 20mm
- 字体：PingFang SC, Hiragino Sans GB, STHeiti, sans-serif
- 标题：H1 24px #1a1a1a，H2 18px #2563eb，H3 15px #374151
- 表格：全边框 + 斑马纹（偶数行 #f9fafb），表头 #f3f4f6
- 结论/启示：浅蓝背景色块（#eff6ff + 左边框 #3b82f6）
- 机会点标记：绿色标签
- 风险点标记：红色标签

## PDF 转换

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu \
  --print-to-pdf="[输出路径]" \
  --no-margins --print-to-pdf-no-header \
  "[HTML文件路径]"
```

## 报告整体结构
1. 封面（报告标题 + 日期 + 分析类型）
2. 执行摘要（核心结论 3-5 条）
3. 正文章节（根据 skill 的报告章节模板）
4. 数据来源说明
```

- [ ] **Step 8: Create examples/开场示例.md**

```markdown
# 开场示例

用户首次进入对话时，Agent 的开场话术：

"你好！我是亚马逊品类分析助手。你可以告诉我：

- 一个**关键词**或品类 → 我帮你做市场调研
- 几个**ASIN**或产品链接 → 我帮你做竞品分析
- 想了解**用户需求**和购买动机 → 我帮你做需求分析
- 想优化**定价**或转化率 → 我帮你做交易模型分析

也可以直接描述你的问题，我来判断最合适的分析方向。"
```

- [ ] **Step 9: Commit**

```bash
git add agents/
git commit -m "feat: add agent knowledge files (SOUL.md, 4 skills, tools, examples)"
```

---

### Task 3: Prompt Builder

**Files:**
- Create: `backend/app/prompt_builder.py`
- Create: `backend/tests/test_prompt_builder.py`

- [ ] **Step 1: Write failing tests**

```python
# backend/tests/test_prompt_builder.py
import pytest
from pathlib import Path
from unittest.mock import patch
from app.prompt_builder import PromptBuilder


@pytest.fixture
def builder(tmp_path):
    """Create a PromptBuilder with temp agent directory."""
    agent_dir = tmp_path / "竞品与需求分析"
    agent_dir.mkdir()
    skills_dir = agent_dir / "skills"
    skills_dir.mkdir()

    (agent_dir / "SOUL.md").write_text("# 角色\n你是分析专家。\n\n## 路由\n| 关键词 | market-research |")

    market = skills_dir / "市场调研.md"
    market.write_text("# 市场调研\n\n## 执行步骤\n1. 查关键词\n2. 分析趋势")

    competitor = skills_dir / "竞品分析.md"
    competitor.write_text("# 竞品分析\n\n## 执行步骤\n1. 解析ASIN")

    return PromptBuilder(agent_dir)


def test_load_soul(builder):
    soul = builder.load_soul()
    assert "分析专家" in soul
    assert "路由" in soul


def test_load_skill(builder):
    skill = builder.load_skill("市场调研")
    assert "查关键词" in skill


def test_load_skill_not_found(builder):
    with pytest.raises(FileNotFoundError):
        builder.load_skill("不存在的skill")


def test_build_system_prompt_initial(builder):
    prompt = builder.build_system_prompt()
    assert "分析专家" in prompt
    assert "查关键词" not in prompt  # skill not loaded yet


def test_build_system_prompt_with_skill(builder):
    prompt = builder.build_system_prompt(loaded_skills=["市场调研"])
    assert "分析专家" in prompt
    assert "查关键词" in prompt


def test_build_system_prompt_multiple_skills(builder):
    prompt = builder.build_system_prompt(loaded_skills=["市场调研", "竞品分析"])
    assert "查关键词" in prompt
    assert "解析ASIN" in prompt
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd backend && source .venv/bin/activate
pytest tests/test_prompt_builder.py -v
```

Expected: FAIL — `ModuleNotFoundError: No module named 'app.prompt_builder'`

- [ ] **Step 3: Implement PromptBuilder**

```python
# backend/app/prompt_builder.py
from pathlib import Path


SKILL_NAME_MAP = {
    "market-research": "市场调研",
    "competitor-analysis": "竞品分析",
    "user-model": "用户模型",
    "trade-model": "交易模型",
}


class PromptBuilder:
    def __init__(self, agent_dir: Path):
        self.agent_dir = agent_dir
        self.soul_path = agent_dir / "SOUL.md"
        self.skills_dir = agent_dir / "skills"

    def load_soul(self) -> str:
        return self.soul_path.read_text(encoding="utf-8")

    def load_skill(self, skill_name: str) -> str:
        cn_name = SKILL_NAME_MAP.get(skill_name, skill_name)
        skill_path = self.skills_dir / f"{cn_name}.md"
        if not skill_path.exists():
            raise FileNotFoundError(f"Skill not found: {skill_path}")
        return skill_path.read_text(encoding="utf-8")

    def build_system_prompt(self, loaded_skills: list[str] | None = None) -> str:
        parts = [self.load_soul()]

        if loaded_skills:
            parts.append("\n\n---\n\n# 已加载的分析模块\n")
            for skill_id in loaded_skills:
                try:
                    skill_content = self.load_skill(skill_id)
                    parts.append(f"\n\n{skill_content}")
                except FileNotFoundError:
                    pass

        return "".join(parts)
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_prompt_builder.py -v
```

Expected: All 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/prompt_builder.py backend/tests/test_prompt_builder.py
git commit -m "feat: prompt builder with SOUL.md loading and skill injection"
```

---

### Task 4: Session Manager

**Files:**
- Create: `backend/app/session.py`
- Create: `backend/tests/test_session.py`

- [ ] **Step 1: Write failing tests**

```python
# backend/tests/test_session.py
import pytest
from app.session import SessionManager


@pytest.fixture
def manager():
    return SessionManager()


def test_create_session(manager):
    sid = manager.create_session()
    assert sid is not None
    assert isinstance(sid, str)


def test_get_session_not_found(manager):
    assert manager.get_session("nonexistent") is None


def test_add_and_get_messages(manager):
    sid = manager.create_session()
    manager.add_message(sid, {"role": "user", "content": "hello"})
    manager.add_message(sid, {"role": "assistant", "content": "hi"})
    msgs = manager.get_messages(sid)
    assert len(msgs) == 2
    assert msgs[0]["role"] == "user"
    assert msgs[1]["role"] == "assistant"


def test_get_loaded_skills_default_empty(manager):
    sid = manager.create_session()
    assert manager.get_loaded_skills(sid) == []


def test_add_loaded_skill(manager):
    sid = manager.create_session()
    manager.add_loaded_skill(sid, "market-research")
    assert manager.get_loaded_skills(sid) == ["market-research"]


def test_add_loaded_skill_no_duplicate(manager):
    sid = manager.create_session()
    manager.add_loaded_skill(sid, "market-research")
    manager.add_loaded_skill(sid, "market-research")
    assert manager.get_loaded_skills(sid) == ["market-research"]


def test_trim_history(manager):
    sid = manager.create_session()
    for i in range(100):
        manager.add_message(sid, {"role": "user", "content": f"msg {i}"})
    manager.trim_history(sid, max_messages=20)
    msgs = manager.get_messages(sid)
    assert len(msgs) == 20
    assert msgs[0]["content"] == "msg 80"
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest tests/test_session.py -v
```

Expected: FAIL — `ModuleNotFoundError: No module named 'app.session'`

- [ ] **Step 3: Implement SessionManager**

```python
# backend/app/session.py
import uuid
from dataclasses import dataclass, field


@dataclass
class Session:
    id: str
    messages: list[dict] = field(default_factory=list)
    loaded_skills: list[str] = field(default_factory=list)


class SessionManager:
    def __init__(self):
        self._sessions: dict[str, Session] = {}

    def create_session(self) -> str:
        sid = str(uuid.uuid4())
        self._sessions[sid] = Session(id=sid)
        return sid

    def get_session(self, session_id: str) -> Session | None:
        return self._sessions.get(session_id)

    def add_message(self, session_id: str, message: dict) -> None:
        session = self._sessions.get(session_id)
        if session:
            session.messages.append(message)

    def get_messages(self, session_id: str) -> list[dict]:
        session = self._sessions.get(session_id)
        return list(session.messages) if session else []

    def get_loaded_skills(self, session_id: str) -> list[str]:
        session = self._sessions.get(session_id)
        return list(session.loaded_skills) if session else []

    def add_loaded_skill(self, session_id: str, skill_name: str) -> None:
        session = self._sessions.get(session_id)
        if session and skill_name not in session.loaded_skills:
            session.loaded_skills.append(skill_name)

    def trim_history(self, session_id: str, max_messages: int = 50) -> None:
        session = self._sessions.get(session_id)
        if session and len(session.messages) > max_messages:
            session.messages = session.messages[-max_messages:]
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_session.py -v
```

Expected: All 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/session.py backend/tests/test_session.py
git commit -m "feat: in-memory session manager with history trimming"
```

---

### Task 5: LLM Client

**Files:**
- Create: `backend/app/llm_client.py`
- Create: `backend/tests/test_llm_client.py`

- [ ] **Step 1: Write failing tests**

```python
# backend/tests/test_llm_client.py
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.llm_client import LLMClient


@pytest.fixture
def client():
    return LLMClient(
        api_key="test-key",
        base_url="https://api.test.com/v1",
        model="test-model",
    )


def test_init(client):
    assert client.model == "test-model"


@pytest.mark.asyncio
async def test_chat_stream_yields_text_chunks(client):
    mock_chunk = MagicMock()
    mock_chunk.choices = [MagicMock()]
    mock_chunk.choices[0].delta.content = "hello"
    mock_chunk.choices[0].delta.tool_calls = None
    mock_chunk.choices[0].finish_reason = None

    final_chunk = MagicMock()
    final_chunk.choices = [MagicMock()]
    final_chunk.choices[0].delta.content = None
    final_chunk.choices[0].delta.tool_calls = None
    final_chunk.choices[0].finish_reason = "stop"

    with patch.object(client, "_client") as mock_client:
        mock_stream = AsyncMock()
        mock_stream.__aiter__ = lambda self: self
        mock_stream.__anext__ = AsyncMock(side_effect=[mock_chunk, final_chunk, StopAsyncIteration])
        mock_client.chat.completions.create = AsyncMock(return_value=mock_stream)

        results = []
        async for event in client.chat_stream(messages=[]):
            results.append(event)

    assert len(results) >= 1
    text_events = [e for e in results if e["type"] == "text"]
    assert len(text_events) == 1
    assert text_events[0]["content"] == "hello"
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest tests/test_llm_client.py -v
```

Expected: FAIL — `ModuleNotFoundError: No module named 'app.llm_client'`

- [ ] **Step 3: Implement LLMClient**

```python
# backend/app/llm_client.py
from collections.abc import AsyncGenerator
from openai import AsyncOpenAI


class LLMClient:
    def __init__(self, api_key: str, base_url: str, model: str):
        self.model = model
        self._client = AsyncOpenAI(api_key=api_key, base_url=base_url)

    async def chat_stream(
        self,
        messages: list[dict],
        tools: list[dict] | None = None,
    ) -> AsyncGenerator[dict, None]:
        """Stream chat completion, yielding events.

        Yields:
            {"type": "text", "content": "..."} — text delta
            {"type": "tool_call", "id": "...", "name": "...", "arguments": "..."} — tool call
            {"type": "done"} — stream finished
        """
        kwargs = {
            "model": self.model,
            "messages": messages,
            "stream": True,
        }
        if tools:
            kwargs["tools"] = tools

        stream = await self._client.chat.completions.create(**kwargs)

        tool_calls_acc: dict[int, dict] = {}

        async for chunk in stream:
            choice = chunk.choices[0]
            delta = choice.delta

            # Text content
            if delta.content:
                yield {"type": "text", "content": delta.content}

            # Tool calls (accumulate across chunks)
            if delta.tool_calls:
                for tc in delta.tool_calls:
                    idx = tc.index
                    if idx not in tool_calls_acc:
                        tool_calls_acc[idx] = {
                            "id": tc.id or "",
                            "name": tc.function.name or "",
                            "arguments": "",
                        }
                    if tc.id:
                        tool_calls_acc[idx]["id"] = tc.id
                    if tc.function.name:
                        tool_calls_acc[idx]["name"] = tc.function.name
                    if tc.function.arguments:
                        tool_calls_acc[idx]["arguments"] += tc.function.arguments

            # Stream finished
            if choice.finish_reason == "stop":
                break

            if choice.finish_reason == "tool_calls":
                for tc in sorted(tool_calls_acc.values(), key=lambda x: x["name"]):
                    yield {
                        "type": "tool_call",
                        "id": tc["id"],
                        "name": tc["name"],
                        "arguments": tc["arguments"],
                    }
                break

        yield {"type": "done"}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_llm_client.py -v
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/llm_client.py backend/tests/test_llm_client.py
git commit -m "feat: LLM client with streaming and tool_call parsing"
```

---

### Task 6: Tool Executor (Sorftime MCP Bridge)

**Files:**
- Create: `backend/app/tool_executor.py`
- Create: `backend/tests/test_tool_executor.py`

- [ ] **Step 1: Write failing tests**

```python
# backend/tests/test_tool_executor.py
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.tool_executor import ToolExecutor


@pytest.fixture
def executor():
    return ToolExecutor()


def test_parse_tool_name_with_prefix(executor):
    assert executor.parse_tool_name("mcp__sorftime__keyword_detail") == "keyword_detail"


def test_parse_tool_name_without_prefix(executor):
    assert executor.parse_tool_name("keyword_detail") == "keyword_detail"


def test_is_sorftime_tool(executor):
    assert executor.is_sorftime_tool("mcp__sorftime__keyword_detail") is True
    assert executor.is_sorftime_tool("generate_report") is False


@pytest.mark.asyncio
async def test_execute_tool_with_mock_session(executor):
    mock_session = AsyncMock()
    mock_result = MagicMock()
    mock_result.content = [MagicMock(text='{"searchVolume": 10000}')]
    mock_session.call_tool = AsyncMock(return_value=mock_result)

    executor._session = mock_session
    result = await executor.execute_tool("mcp__sorftime__keyword_detail", {"keyword": "keyboard"})
    assert "searchVolume" in result
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest tests/test_tool_executor.py -v
```

Expected: FAIL

- [ ] **Step 3: Implement ToolExecutor**

```python
# backend/app/tool_executor.py
import json
from mcp import ClientSession


class ToolExecutor:
    def __init__(self, session: ClientSession | None = None):
        self._session = session

    def parse_tool_name(self, raw_name: str) -> str:
        if raw_name.startswith("mcp__sorftime__"):
            return raw_name.removeprefix("mcp__sorftime__")
        return raw_name

    def is_sorftime_tool(self, tool_name: str) -> bool:
        return tool_name.startswith("mcp__sorftime__") or tool_name in {
            "keyword_detail", "keyword_trend", "keyword_extends",
            "keyword_list", "keyword_search_results",
            "product_detail", "product_reviews", "product_trend",
            "product_traffic_terms", "product_variations", "product_search",
            "category_report", "category_trend", "category_keywords",
            "category_tree", "similar_product_feature",
        }

    async def execute_tool(self, tool_name: str, arguments: dict) -> str:
        if not self._session:
            return json.dumps({"error": "MCP session not connected"}, ensure_ascii=False)

        parsed_name = self.parse_tool_name(tool_name)
        result = await self._session.call_tool(parsed_name, arguments)

        parts = []
        for content in result.content:
            if hasattr(content, "text"):
                parts.append(content.text)
        return "\n".join(parts) if parts else json.dumps({"result": "empty"}, ensure_ascii=False)
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_tool_executor.py -v
```

Expected: All 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/tool_executor.py backend/tests/test_tool_executor.py
git commit -m "feat: tool executor with Sorftime MCP bridge"
```

---

### Task 7: Chat API

**Files:**
- Create: `backend/app/chat.py`
- Modify: `backend/app/main.py`
- Create: `backend/tests/test_chat.py`

- [ ] **Step 1: Write failing tests**

```python
# backend/tests/test_chat.py
import pytest


@pytest.mark.asyncio
async def test_chat_missing_session_id(client):
    resp = await client.post("/api/chat", json={"message": "hello"})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_chat_new_session(client):
    resp = await client.post(
        "/api/chat",
        json={"message": "hello", "session_id": None},
    )
    # Will fail because LLM client is not configured, but should accept the request
    assert resp.status_code in (200, 500)


@pytest.mark.asyncio
async def test_chat_with_session_id(client):
    resp = await client.post(
        "/api/chat",
        json={"message": "hello", "session_id": "test-123"},
    )
    assert resp.status_code in (200, 500)
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest tests/test_chat.py -v
```

Expected: FAIL — no `/api/chat` route

- [ ] **Step 3: Implement chat module**

```python
# backend/app/chat.py
import json
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.config import settings
from app.prompt_builder import PromptBuilder
from app.session import SessionManager
from app.llm_client import LLMClient
from app.tool_executor import ToolExecutor

router = APIRouter()

session_manager = SessionManager()
prompt_builder = PromptBuilder(settings.agent_base_path / "竞品与需求分析")
llm_client = LLMClient(
    api_key=settings.minimax_api_key,
    base_url=settings.minimax_base_url,
    model=settings.minimax_model,
)
tool_executor = ToolExecutor()


class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None


@router.post("/api/chat")
async def chat(req: ChatRequest):
    sid = req.session_id or session_manager.create_session()
    if not session_manager.get_session(sid):
        session_manager.create_session_with_id(sid)

    session_manager.add_message(sid, {"role": "user", "content": req.message})

    return StreamingResponse(
        _stream_response(sid, req.message),
        media_type="text/event-stream",
        headers={"X-Session-Id": sid},
    )


async def _stream_response(session_id: str, user_message: str):
    skills = session_manager.get_loaded_skills(session_id)
    system_prompt = prompt_builder.build_system_prompt(loaded_skills=skills)

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(session_manager.get_messages(session_id))

    accumulated_text = ""
    tool_calls_buffer: list[dict] = []

    async for event in llm_client.chat_stream(messages=messages):
        if event["type"] == "text":
            accumulated_text += event["content"]
            yield f"data: {json.dumps({'type': 'text', 'content': event['content']}, ensure_ascii=False)}\n\n"

        elif event["type"] == "tool_call":
            tool_calls_buffer.append(event)
            yield f"data: {json.dumps({'type': 'tool_call', 'name': event['name']}, ensure_ascii=False)}\n\n"

        elif event["type"] == "done":
            if accumulated_text:
                session_manager.add_message(session_id, {
                    "role": "assistant",
                    "content": accumulated_text,
                })

            if tool_calls_buffer:
                for tc in tool_calls_buffer:
                    try:
                        args = json.loads(tc["arguments"]) if tc["arguments"] else {}
                        result = await tool_executor.execute_tool(tc["name"], args)
                        tool_msg = json.dumps({
                            "type": "tool_result",
                            "name": tc["name"],
                            "result": result,
                        }, ensure_ascii=False)
                        yield f"data: {tool_msg}\n\n"

                        session_manager.add_message(session_id, {
                            "role": "tool",
                            "tool_call_id": tc["id"],
                            "content": result,
                        })
                    except Exception as e:
                        error_msg = json.dumps({
                            "type": "error",
                            "message": str(e),
                        }, ensure_ascii=False)
                        yield f"data: {error_msg}\n\n"

            yield f"data: {json.dumps({'type': 'done', 'session_id': session_id}, ensure_ascii=False)}\n\n"
```

- [ ] **Step 4: Update main.py to include chat router**

Add to `backend/app/main.py`:

```python
from app.chat import router as chat_router
app.include_router(chat_router)
```

Full updated `main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from app.chat import router as chat_router

app = FastAPI(title="Amazon Web Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)

frontend_dir = Path(__file__).resolve().parent.parent.parent / "frontend"
if frontend_dir.is_dir():
    app.mount("/static", StaticFiles(directory=str(frontend_dir)), name="static")


@app.get("/health")
async def health():
    return {"status": "ok"}
```

Also add `create_session_with_id` to `session.py`:

```python
def create_session_with_id(self, session_id: str) -> str:
    if session_id not in self._sessions:
        self._sessions[session_id] = Session(id=session_id)
    return session_id
```

- [ ] **Step 5: Run tests**

```bash
pytest tests/test_chat.py tests/test_main.py -v
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/app/chat.py backend/app/main.py backend/app/session.py backend/tests/test_chat.py
git commit -m "feat: chat API with SSE streaming and tool execution"
```

---

### Task 8: Report Generator

**Files:**
- Create: `backend/app/report.py`
- Create: `backend/tests/test_report.py`

- [ ] **Step 1: Write failing tests**

```python
# backend/tests/test_report.py
import pytest
from app.report import ReportGenerator, build_report_html


def test_build_report_html_contains_title():
    html = build_report_html(
        title="测试报告",
        date="2026-04-30",
        sections=[
            {"heading": "市场概览", "content": "<p>测试内容</p>"},
        ],
    )
    assert "测试报告" in html
    assert "市场概览" in html
    assert "测试内容" in html


def test_build_report_html_has_styles():
    html = build_report_html(
        title="测试",
        date="2026-04-30",
        sections=[],
    )
    assert "<style>" in html
    assert "PingFang" in html


@pytest.mark.asyncio
async def test_generate_pdf_no_chrome(tmp_path):
    gen = ReportGenerator()
    html_path = tmp_path / "test.html"
    html_path.write_text("<h1>test</h1>")

    with pytest.raises(FileNotFoundError):
        await gen.html_to_pdf(html_path, tmp_path / "test.pdf", chrome_path="/nonexistent/chrome")
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest tests/test_report.py -v
```

Expected: FAIL

- [ ] **Step 3: Implement ReportGenerator**

```python
# backend/app/report.py
import asyncio
import subprocess
from pathlib import Path


def build_report_html(
    title: str,
    date: str,
    sections: list[dict],
) -> str:
    sections_html = ""
    for s in sections:
        sections_html += f'<h2 class="section-title">{s["heading"]}</h2>\n{s["content"]}\n'

    return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>{title}</title>
<style>
  @page {{ size: A4; margin: 20mm; }}
  body {{
    font-family: "PingFang SC", "Hiragino Sans GB", "STHeiti", sans-serif;
    font-size: 13px;
    line-height: 1.6;
    color: #1a1a1a;
    max-width: 210mm;
    margin: 0 auto;
    padding: 20mm;
  }}
  h1 {{ font-size: 24px; color: #1a1a1a; border-bottom: 2px solid #2563eb; padding-bottom: 8px; }}
  h2 {{ font-size: 18px; color: #2563eb; margin-top: 24px; }}
  h3 {{ font-size: 15px; color: #374151; }}
  table {{ width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }}
  th {{ background: #f3f4f6; text-align: left; padding: 8px; border: 1px solid #e5e7eb; }}
  td {{ padding: 8px; border: 1px solid #e5e7eb; }}
  tr:nth-child(even) td {{ background: #f9fafb; }}
  .insight {{ background: #eff6ff; border-left: 3px solid #3b82f6; padding: 12px; margin: 12px 0; }}
  .opportunity {{ color: #059669; font-weight: 600; }}
  .risk {{ color: #dc2626; font-weight: 600; }}
  .date {{ color: #6b7280; font-size: 12px; }}
</style>
</head>
<body>
<h1>{title}</h1>
<p class="date">{date}</p>
{sections_html}
</body>
</html>"""


class ReportGenerator:
    CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

    async def html_to_pdf(
        self,
        html_path: Path,
        output_path: Path,
        chrome_path: str | None = None,
    ) -> Path:
        chrome = chrome_path or self.CHROME_PATH
        if not Path(chrome).exists():
            raise FileNotFoundError(f"Chrome not found at {chrome}")

        cmd = [
            chrome,
            "--headless",
            "--disable-gpu",
            f"--print-to-pdf={output_path}",
            "--no-margins",
            "--print-to-pdf-no-header",
            str(html_path),
        ]
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        await proc.communicate()

        if not output_path.exists():
            raise RuntimeError(f"PDF generation failed: {output_path}")
        return output_path

    async def generate_report(
        self,
        title: str,
        date: str,
        sections: list[dict],
        output_dir: Path,
    ) -> Path:
        output_dir.mkdir(parents=True, exist_ok=True)

        html_path = output_dir / f"{title}.html"
        pdf_path = output_dir / f"{title}.pdf"

        html_content = build_report_html(title, date, sections)
        html_path.write_text(html_content, encoding="utf-8")

        await self.html_to_pdf(html_path, pdf_path)
        return pdf_path
```

- [ ] **Step 4: Run tests**

```bash
pytest tests/test_report.py -v
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/report.py backend/tests/test_report.py
git commit -m "feat: report generator with HTML template and Chrome PDF conversion"
```

---

### Task 9: Frontend Chat UI

**Files:**
- Create: `frontend/index.html`

- [ ] **Step 1: Create frontend**

A single HTML file with vanilla JS for the chat interface. Connects to `/api/chat` via SSE.

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>亚马逊品类分析</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, "PingFang SC", sans-serif; background: #f5f5f5; height: 100vh; display: flex; }

  #sidebar { width: 280px; background: #1e293b; color: #e2e8f0; padding: 24px 16px; display: flex; flex-direction: column; }
  #sidebar h1 { font-size: 16px; margin-bottom: 24px; color: #fff; }
  .agent-card { background: #334155; border-radius: 8px; padding: 16px; cursor: pointer; transition: background 0.2s; }
  .agent-card:hover { background: #475569; }
  .agent-card h3 { font-size: 14px; color: #fff; margin-bottom: 4px; }
  .agent-card p { font-size: 12px; color: #94a3b8; line-height: 1.4; }
  .agent-card.active { background: #2563eb; }
  .agent-card.active p { color: #bfdbfe; }

  #main { flex: 1; display: flex; flex-direction: column; max-width: 800px; margin: 0 auto; width: 100%; }
  #header { padding: 16px 24px; border-bottom: 1px solid #e2e8f0; background: #fff; }
  #header h2 { font-size: 16px; color: #1e293b; }

  #messages { flex: 1; overflow-y: auto; padding: 24px; }
  .msg { margin-bottom: 16px; max-width: 85%; }
  .msg.user { margin-left: auto; }
  .msg .bubble { padding: 12px 16px; border-radius: 12px; font-size: 14px; line-height: 1.6; white-space: pre-wrap; }
  .msg.user .bubble { background: #2563eb; color: #fff; border-bottom-right-radius: 4px; }
  .msg.assistant .bubble { background: #fff; color: #1e293b; border: 1px solid #e2e8f0; border-bottom-left-radius: 4px; }
  .msg .meta { font-size: 11px; color: #94a3b8; margin-top: 4px; }
  .msg .progress { font-size: 12px; color: #64748b; font-style: italic; padding: 8px 0; }

  #input-area { padding: 16px 24px; border-top: 1px solid #e2e8f0; background: #fff; display: flex; gap: 8px; }
  #input { flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; font-size: 14px; outline: none; resize: none; font-family: inherit; }
  #input:focus { border-color: #2563eb; }
  #send { background: #2563eb; color: #fff; border: none; border-radius: 8px; padding: 10px 20px; font-size: 14px; cursor: pointer; }
  #send:disabled { background: #93c5fd; cursor: not-allowed; }
</style>
</head>
<body>

<div id="sidebar">
  <h1>Amazon Agent</h1>
  <div class="agent-card active">
    <h3>竞品与需求分析</h3>
    <p>市场调研、竞品分析、用户需求、交易模型</p>
  </div>
</div>

<div id="main">
  <div id="header">
    <h2>竞品与需求分析</h2>
  </div>
  <div id="messages"></div>
  <div id="input-area">
    <textarea id="input" rows="1" placeholder="输入关键词、ASIN、或你的问题..." onkeydown="handleKey(event)"></textarea>
    <button id="send" onclick="sendMessage()">发送</button>
  </div>
</div>

<script>
let sessionId = null;

const messagesEl = document.getElementById('messages');
const inputEl = document.getElementById('input');
const sendEl = document.getElementById('send');

function addMessage(role, content) {
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  div.innerHTML = `<div class="bubble">${escapeHtml(content)}</div>`;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return div;
}

function addStreamingMessage() {
  const div = document.createElement('div');
  div.className = 'msg assistant';
  div.innerHTML = '<div class="bubble"></div>';
  messagesEl.appendChild(div);
  return div.querySelector('.bubble');
}

function escapeHtml(text) {
  const el = document.createElement('span');
  el.textContent = text;
  return el.innerHTML;
}

function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

async function sendMessage() {
  const message = inputEl.value.trim();
  if (!message) return;

  inputEl.value = '';
  sendEl.disabled = true;
  addMessage('user', message);

  const bubble = addStreamingMessage();
  let fullText = '';

  try {
    const resp = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, session_id: sessionId }),
    });

    sessionId = resp.headers.get('X-Session-Id') || sessionId;

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = JSON.parse(line.slice(6));

        if (data.type === 'text') {
          fullText += data.content;
          bubble.textContent = fullText;
          messagesEl.scrollTop = messagesEl.scrollHeight;
        } else if (data.type === 'tool_call') {
          fullText += `\n[正在获取数据: ${data.name}]\n`;
          bubble.textContent = fullText;
        } else if (data.type === 'tool_result') {
          // Tool results processed silently
        } else if (data.type === 'done') {
          if (data.session_id) sessionId = data.session_id;
        }
      }
    }
  } catch (err) {
    bubble.textContent = '连接失败，请重试。';
  }

  sendEl.disabled = false;
  inputEl.focus();
}

inputEl.focus();
</script>
</body>
</html>
```

- [ ] **Step 2: Verify frontend loads**

```bash
cd backend && source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Open `http://localhost:8000/static/index.html` — should show the chat UI.

- [ ] **Step 3: Commit**

```bash
git add frontend/
git commit -m "feat: frontend chat UI with SSE streaming"
```

---

### Task 10: MCP Connection Manager

**Files:**
- Create: `backend/app/mcp_connection.py`
- Modify: `backend/app/chat.py`

This task wires the Sorftime MCP client into the backend lifecycle.

- [ ] **Step 1: Create MCP connection manager**

```python
# backend/app/mcp_connection.py
import logging
from contextlib import asynccontextmanager
from mcp import ClientSession
from mcp.client.sse import sse_client
from app.config import settings

logger = logging.getLogger(__name__)

_session: ClientSession | None = None
_tools_cache: list[dict] | None = None


async def connect_sorftime() -> ClientSession | None:
    global _session, _tools_cache

    if not settings.sorftime_mcp_url:
        logger.warning("SORFTIME_MCP_URL not configured, tool execution disabled")
        return None

    try:
        transport = sse_client(settings.sorftime_mcp_url)
        read, write = await transport.__aenter__()
        _session = ClientSession(read, write)
        await _session.__aenter__()
        await _session.initialize()

        tools_result = await _session.list_tools()
        _tools_cache = [
            {
                "type": "function",
                "function": {
                    "name": f"mcp__sorftime__{t.name}",
                    "description": t.description or "",
                    "parameters": t.inputSchema,
                },
            }
            for t in tools_result.tools
        ]
        logger.info(f"Connected to Sorftime MCP, {len(_tools_cache)} tools loaded")
        return _session
    except Exception as e:
        logger.error(f"Failed to connect to Sorftime MCP: {e}")
        return None


def get_session() -> ClientSession | None:
    return _session


def get_tools() -> list[dict]:
    return _tools_cache or []
```

- [ ] **Step 2: Wire into app lifecycle via FastAPI lifespan**

Update `backend/app/main.py`:

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from app.chat import router as chat_router
from app.mcp_connection import connect_sorftime, get_session
from app.tool_executor import ToolExecutor

tool_executor = ToolExecutor()

@asynccontextmanager
async def lifespan(app: FastAPI):
    mcp_session = await connect_sorftime()
    if mcp_session:
        tool_executor._session = mcp_session
    yield

app = FastAPI(title="Amazon Web Agent", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)

frontend_dir = Path(__file__).resolve().parent.parent.parent / "frontend"
if frontend_dir.is_dir():
    app.mount("/static", StaticFiles(directory=str(frontend_dir)), name="static")


@app.get("/health")
async def health():
    return {"status": "ok", "mcp_connected": get_session() is not None}
```

- [ ] **Step 3: Update chat.py to use shared tool_executor and MCP tools**

Update `backend/app/chat.py` — replace the module-level instantiations:

```python
# backend/app/chat.py
import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.config import settings
from app.prompt_builder import PromptBuilder
from app.session import SessionManager
from app.llm_client import LLMClient
from app.mcp_connection import get_tools
from app.main import tool_executor

router = APIRouter()

session_manager = SessionManager()
prompt_builder = PromptBuilder(settings.agent_base_path / "竞品与需求分析")
llm_client = LLMClient(
    api_key=settings.minimax_api_key,
    base_url=settings.minimax_base_url,
    model=settings.minimax_model,
)


class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None


@router.post("/api/chat")
async def chat(req: ChatRequest):
    sid = req.session_id or session_manager.create_session()
    if not session_manager.get_session(sid):
        session_manager.create_session_with_id(sid)

    session_manager.add_message(sid, {"role": "user", "content": req.message})

    return StreamingResponse(
        _stream_response(sid, req.message),
        media_type="text/event-stream",
        headers={"X-Session-Id": sid},
    )


async def _stream_response(session_id: str, user_message: str):
    skills = session_manager.get_loaded_skills(session_id)
    system_prompt = prompt_builder.build_system_prompt(loaded_skills=skills)

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(session_manager.get_messages(session_id))

    tools = get_tools()

    accumulated_text = ""
    tool_calls_buffer: list[dict] = []

    async for event in llm_client.chat_stream(messages=messages, tools=tools or None):
        if event["type"] == "text":
            accumulated_text += event["content"]
            yield f"data: {json.dumps({'type': 'text', 'content': event['content']}, ensure_ascii=False)}\n\n"

        elif event["type"] == "tool_call":
            tool_calls_buffer.append(event)
            yield f"data: {json.dumps({'type': 'tool_call', 'name': event['name']}, ensure_ascii=False)}\n\n"

        elif event["type"] == "done":
            if accumulated_text:
                session_manager.add_message(session_id, {
                    "role": "assistant",
                    "content": accumulated_text,
                })

            if tool_calls_buffer:
                for tc in tool_calls_buffer:
                    try:
                        args = json.loads(tc["arguments"]) if tc["arguments"] else {}
                        result = await tool_executor.execute_tool(tc["name"], args)
                        tool_msg = json.dumps({
                            "type": "tool_result",
                            "name": tc["name"],
                            "result": result[:2000],
                        }, ensure_ascii=False)
                        yield f"data: {tool_msg}\n\n"

                        session_manager.add_message(session_id, {
                            "role": "tool",
                            "tool_call_id": tc["id"],
                            "content": result,
                        })
                    except Exception as e:
                        yield f"data: {json.dumps({'type': 'error', 'message': str(e)}, ensure_ascii=False)}\n\n"

            yield f"data: {json.dumps({'type': 'done', 'session_id': session_id}, ensure_ascii=False)}\n\n"
```

- [ ] **Step 4: Verify all tests still pass**

```bash
pytest tests/ -v
```

- [ ] **Step 5: Commit**

```bash
git add backend/app/mcp_connection.py backend/app/main.py backend/app/chat.py
git commit -m "feat: MCP connection manager with Sorftime integration"
```

---

### Task 11: End-to-End Smoke Test

**Files:**
- Create: `backend/tests/test_e2e.py`

- [ ] **Step 1: Write integration test**

This test verifies the full pipeline without real API calls (mocked LLM + mock MCP).

```python
# backend/tests/test_e2e.py
import pytest
import json
from unittest.mock import AsyncMock, MagicMock, patch
from app.session import SessionManager
from app.prompt_builder import PromptBuilder
from app.llm_client import LLMClient


@pytest.fixture
def pipeline(tmp_path):
    agent_dir = tmp_path / "竞品与需求分析"
    agent_dir.mkdir()
    skills = agent_dir / "skills"
    skills.mkdir()
    (agent_dir / "SOUL.md").write_text("# 角色\n你是分析专家。")
    (skills / "市场调研.md").write_text("# 市场调研\n查关键词")

    builder = PromptBuilder(agent_dir)
    sessions = SessionManager()
    return builder, sessions


@pytest.mark.asyncio
async def test_full_pipeline_text_response(pipeline):
    builder, sessions = pipeline
    sid = sessions.create_session()

    system_prompt = builder.build_system_prompt()
    sessions.add_message(sid, {"role": "user", "content": "帮我分析 keyboard"})

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(sessions.get_messages(sid))

    assert len(messages) == 2
    assert messages[0]["role"] == "system"
    assert "分析专家" in messages[0]["content"]
    assert messages[1]["content"] == "帮我分析 keyboard"


@pytest.mark.asyncio
async def test_full_pipeline_with_skill_loading(pipeline):
    builder, sessions = pipeline
    sid = sessions.create_session()

    sessions.add_message(sid, {"role": "user", "content": "keyboard"})
    sessions.add_loaded_skill(sid, "market-research")

    system_prompt = builder.build_system_prompt(
        loaded_skills=sessions.get_loaded_skills(sid)
    )

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(sessions.get_messages(sid))

    assert "查关键词" in messages[0]["content"]
```

- [ ] **Step 2: Run tests**

```bash
pytest tests/test_e2e.py -v
```

Expected: PASS

- [ ] **Step 3: Run full test suite**

```bash
pytest tests/ -v
```

Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
git add backend/tests/test_e2e.py
git commit -m "test: end-to-end pipeline integration tests"
```

---

### Task 12: Startup Script + README

**Files:**
- Create: `README.md`
- Create: `backend/run.sh`

- [ ] **Step 1: Create run.sh**

```bash
#!/bin/bash
set -e
cd "$(dirname "$0")"

if [ ! -d ".venv" ]; then
    python3.14 -m venv .venv
fi

source .venv/bin/activate
pip install -q -e ".[dev]"

echo "Starting Amazon Web Agent..."
echo "Open http://localhost:8000/static/index.html"
uvicorn app.main:app --reload --port 8000
```

```bash
chmod +x backend/run.sh
```

- [ ] **Step 2: Create README.md**

```markdown
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

- `backend/` — FastAPI 后端
- `agents/` — Agent 知识文件（SOUL.md + skills + tools）
- `frontend/` — 聊天 UI（vanilla HTML/JS）

## 技术栈

- Python 3.14 + FastAPI
- MiniMax M2.7 (OpenAI 兼容协议)
- Sorftime MCP (数据源)
- Chrome headless (PDF 生成)
```

- [ ] **Step 3: Commit**

```bash
git add README.md backend/run.sh
git commit -m "docs: add README and startup script"
```

---

## Self-Review Checklist

### Spec Coverage

| Spec Section | Task |
|---|---|
| 架构：路由 Agent + Skill 模块 | Task 3 (PromptBuilder) |
| SOUL.md 设计 | Task 2 |
| 意图识别 + 路由表 | Task 2 (SOUL.md), Task 3 |
| 渐进式加载 | Task 3 (build_system_prompt with skills) |
| 4 个 Skill 模块 | Task 2 |
| 对话流程 | Task 7 (Chat API) |
| 质检清单 | Task 2 (SOUL.md 内含) |
| Sorftime MCP 桥接 | Task 6, Task 10 |
| 报告生成 (HTML→PDF) | Task 8 |
| Python + FastAPI | Task 1 |
| MiniMax M2.7 | Task 5 |
| SSE 流式响应 | Task 7, Task 9 |
| 会话隔离 | Task 4 |
| 前端 UI | Task 9 |

### Placeholder Scan

No TBD, TODO, or placeholder patterns found.

### Type Consistency

- `PromptBuilder.__init__(agent_dir: Path)` — consistent across Task 3 and Task 7/10
- `LLMClient.__init__(api_key, base_url, model)` — consistent across Task 5 and Task 7
- `ToolExecutor.execute_tool(tool_name: str, arguments: dict) -> str` — consistent across Task 6 and Task 7/10
- `SessionManager` methods — consistent across Task 4 and Task 7
