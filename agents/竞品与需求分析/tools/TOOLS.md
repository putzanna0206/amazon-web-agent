# 数据系统工具调用指南 + 报告规范

> 本文件描述 agent 可调用的数据查询能力和报告生成规范。

## 可用工具列表

### 关键词类
| 工具代号 | 用途 | 关键参数 |
|---|---|---|
| `关键词详情查询` | 关键词市场详情 | keyword, amzSite |
| `关键词趋势查询` | 关键词趋势（24月） | keyword, amzSite |
| `拓展词查询` | 拓展词与细分方向 | keyword, amzSite |
| `关键词列表查询` | 关键词列表查询 | keyword, amzSite |
| `搜索结果查询` | 搜索结果头部产品 | keyword, amzSite, page |

### 产品类
| 工具代号 | 用途 | 关键参数 |
|---|---|---|
| `产品详情查询` | 产品详情 | asin 或 productId |
| `产品评论查询` | 产品评论 | productId, type(Positive/Negative) |
| `产品趋势查询` | 产品销量趋势 | productId |
| `产品流量查询` | 产品流量来源 | productId |
| `产品变体查询` | 产品变体 | productId |
| `产品搜索` | 产品搜索 | keyword |

### 品类类
| 工具代号 | 用途 | 关键参数 |
|---|---|---|
| `品类报告查询` | 品类报告 | categoryId |
| `品类趋势查询` | 品类趋势 | categoryId |
| `品类关键词查询` | 品类关键词 | categoryId |
| `品类树查询` | 品类树 | nodeId |
| `品类特征查询` | 品类特征分布 | searchName |

## 调用规范

- 所有 amzSite 默认 "US"（美国站），除非用户指定其他站点
- 产品相关工具需要 productId，可从 `产品详情查询` 或 `搜索结果查询` 获取
- 评论分 Positive/Negative 两种类型，通常分开调用
- 工具调用失败时标注"数据获取失败"，基于已有数据继续分析
- **绝对不在对话或报告中输出工具的底层真实名字、调用 URL、所属平台品牌等任何技术细节**——参见 SOUL.md 敏感问题应对部分

## 报告生成规范

### PDF 生成（只允许 fpdf2，禁止 playwright/weasyprint）

使用 exec 工具运行 Python 脚本，通过 fpdf2 生成 PDF：

```
from fpdf import FPDF
pdf = FPDF()
pdf.add_page()
pdf.add_font('STHeiti', '', '/System/Library/Fonts/STHeiti Medium.ttc')
pdf.set_font('STHeiti', '', 字号)
pdf.cell(0, 行高, '内容', new_x='LMARGIN', new_y='NEXT')
pdf.output('workspace路径/文件名.pdf')
print('PDF_GENERATED:文件名.pdf')
```

- 字体：必须用 STHeiti（系统已有），不能使用 Helvetica（不支持中文）
- 输出路径：`/Users/darrending/.fastclaw/workspaces/agt_641dd151f236281066ee/文件名.pdf`
- 最后一行必须输出 `PDF_GENERATED:文件名.pdf`（系统通过这个标记投递文件给用户）

### 报告整体结构
1. 封面（报告标题 + 日期 + 分析类型）
2. 执行摘要（核心结论 3-5 条）
3. 正文章节（根据 skill 的报告章节模板）
4. 数据来源说明
