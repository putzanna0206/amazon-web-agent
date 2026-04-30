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
