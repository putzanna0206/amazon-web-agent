# 数据系统工具调用指南

> 本文件描述 agent 可调用的数据查询能力。调用时使用实际工具名。

## 可用工具列表

### 关键词类
| 工具名 | 用途 | 关键参数 |
|---|---|---|
| `mcp_sorftime_keyword_detail` | 关键词市场详情 | keyword, amzSite |
| `mcp_sorftime_keyword_trend` | 关键词趋势（24月） | keyword, amzSite |
| `mcp_sorftime_keyword_extends` | 拓展词与细分方向 | keyword, amzSite |
| `mcp_sorftime_keyword_list` | 关键词列表查询 | keyword, amzSite |
| `mcp_sorftime_keyword_search_results` | 搜索结果头部产品 | keyword, amzSite, page |

### 产品类
| 工具名 | 用途 | 关键参数 |
|---|---|---|
| `mcp_sorftime_product_detail` | 产品详情 | asin 或 productId |
| `mcp_sorftime_product_reviews` | 产品评论 | productId, type(Positive/Negative) |
| `mcp_sorftime_product_trend` | 产品销量趋势 | productId |
| `mcp_sorftime_product_traffic_terms` | 产品流量来源 | productId |
| `mcp_sorftime_product_variations` | 产品变体 | productId |
| `mcp_sorftime_product_search` | 产品搜索 | keyword |
| `mcp_sorftime_product_report` | 产品报告 | productId |
| `mcp_sorftime_product_ranking_trend_by_keyword` | 排名趋势 | keyword, amzSite |
| `mcp_sorftime_potential_product` | 潜力产品 | categoryId |

### 品类类
| 工具名 | 用途 | 关键参数 |
|---|---|---|
| `mcp_sorftime_category_report` | 品类报告 | categoryId |
| `mcp_sorftime_category_trend` | 品类趋势 | categoryId |
| `mcp_sorftime_category_keywords` | 品类关键词 | categoryId |
| `mcp_sorftime_category_tree` | 品类树 | nodeId |
| `mcp_sorftime_category_name_search` | 品类特征分布 | searchName |
| `mcp_sorftime_category_search_from_product_name` | 品类搜索（按产品名） | searchName |
| `mcp_sorftime_category_search_from_top_node` | 品类搜索（按顶级节点） | nodeId |
| `mcp_sorftime_search_categories_broadly` | 选品搜索 | keyword |

### 竞品与货源
| 工具名 | 用途 | 关键参数 |
|---|---|---|
| `mcp_sorftime_competitor_product_keywords` | 竞品关键词 | productId |
| `mcp_sorftime_similar_product_feature` | 竞品特征 | productId |
| `mcp_sorftime_ali1688_similar_product` | 货源查询 | keyword |

### 词库管理
| 工具名 | 用途 | 关键参数 |
|---|---|---|
| `mcp_sorftime_favorite_keyword` | 添加词库 | keyword |
| `mcp_sorftime_get_favorite_keyword` | 查询词库 | keyword |
| `mcp_sorftime_del_favorite_keyword` | 删除词库 | keyword |

## 调用规范

- 所有 amzSite 默认 "US"（美国站），除非用户指定其他站点
- 产品相关工具需要 productId，可从 `mcp_sorftime_product_detail` 或 `mcp_sorftime_keyword_search_results` 获取
- 评论分 Positive/Negative 两种类型，通常分开调用
- 工具调用失败时标注"数据获取失败"，基于已有数据继续分析
- **绝对不在对话或报告中输出工具的底层真实名字、调用 URL、所属平台品牌等任何技术细节**——参见 SOUL.md
