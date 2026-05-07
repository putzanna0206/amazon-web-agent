// 品牌兜底规则集。
// 每条 = [pattern, replacement, ruleId]。ruleId 用于 applyVerbose 报告命中。
// 规则按"语义类别"分组导出，与 PROJECT.md《品牌保护系统》文档对齐。

export type Rule = readonly [pattern: RegExp, replacement: string, id: string];

const dataSourceBrand: readonly Rule[] = [
  [/Sorftime/gi, "我们的数据系统", "dataSourceBrand.exact"],
  [/S[\s\-_·.]*o[\s\-_·.]*r[\s\-_·.]*f[\s\-_·.]*t[\s\-_·.]*i[\s\-_·.]*m[\s\-_·.]*e/gi, "我们的数据系统", "dataSourceBrand.split"],
];

const agentRuntimeBrand: readonly Rule[] = [
  [/FastClaw/gi, "Agent 平台", "agentRuntimeBrand.exact"],
  [/F[\s\-_·.]*a[\s\-_·.]*s[\s\-_·.]*t[\s\-_·.]*c[\s\-_·.]*l[\s\-_·.]*a[\s\-_·.]*w/gi, "Agent 平台", "agentRuntimeBrand.split"],
];

const modelNames: readonly Rule[] = [
  [/MiniMax[\s\-_]*M?2?\.?7?/gi, "模型", "modelNames.minimaxFull"],
  [/MiniMax/gi, "模型", "modelNames.minimax"],
  [/minimax/gi, "模型", "modelNames.minimaxLower"],
  [/M2\.7\s*(HighSpeed)?/gi, "模型", "modelNames.minimaxAlias"],
  [/zhipu[\s\-_]*glm/gi, "模型", "modelNames.zhipuGlm"],
  [/glm[\s\-_]*[0-9.]+/gi, "模型", "modelNames.glmVersioned"],
  [/\bGLM\b/g, "模型", "modelNames.glm"],
  [/\bAnthropic\b/gi, "模型厂商", "modelNames.anthropic"],
  [/\bClaude\s+(Opus|Sonnet|Haiku)?[\s0-9.]*/gi, "模型", "modelNames.claude"],
  [/\bOpenAI\b/gi, "模型厂商", "modelNames.openai"],
  [/\bGPT[\s\-]*[0-9.]*/gi, "模型", "modelNames.gpt"],
  [/\bGemini\b/gi, "模型", "modelNames.gemini"],
];

const competitorTools: readonly Rule[] = [
  [/Helium\s*10/gi, "其他同类工具", "competitorTools.helium10"],
  [/Jungle\s*Scout/gi, "其他同类工具", "competitorTools.jungleScout"],
  [/Sellics/gi, "其他同类工具", "competitorTools.sellics"],
  [/Viral\s*Launch/gi, "其他同类工具", "competitorTools.viralLaunch"],
];

const protocolKeywords: readonly Rule[] = [
  [/分析系统_我们的数据系统_\w+/g, "数据查询", "protocolKeywords.scrambledPrefix"],
  [/mcp_sorftime_\w+/gi, "数据查询", "protocolKeywords.mcpSorftime"],
  [/mcp_\w+/gi, "数据查询", "protocolKeywords.mcpAny"],
  [/\bMCP\s*(Server|Client|工具|工具集|平台|协议|server|client)?/gi, "分析系统", "protocolKeywords.mcpWord"],
  [/Model\s*Context\s*Protocol/gi, "分析系统", "protocolKeywords.mcpFull"],
];

const toolRealNames: readonly Rule[] = [
  [/walmart_\w+/gi, "沃尔玛数据", "toolRealNames.walmartAny"],
  [/tiktok_\w+/gi, "TikTok数据", "toolRealNames.tiktokAny"],
  [/product_search/gi, "产品搜索", "toolRealNames.productSearch"],
  [/product_detail/gi, "产品详情", "toolRealNames.productDetail"],
  [/product_reviews/gi, "评论采集", "toolRealNames.productReviews"],
  [/product_trend/gi, "产品趋势", "toolRealNames.productTrend"],
  [/product_variations/gi, "变体分析", "toolRealNames.productVariations"],
  [/product_traffic_terms/gi, "流量分析", "toolRealNames.productTraffic"],
  [/product_ranking_trend_by_keyword/gi, "排名趋势", "toolRealNames.productRanking"],
  [/product_report/gi, "产品报告", "toolRealNames.productReport"],
  [/potential_product/gi, "潜力产品", "toolRealNames.potentialProduct"],
  [/keyword_detail/gi, "关键词详情", "toolRealNames.keywordDetail"],
  [/keyword_trend/gi, "关键词趋势", "toolRealNames.keywordTrend"],
  [/keyword_extends/gi, "延伸词", "toolRealNames.keywordExtends"],
  [/keyword_list/gi, "关键词列表", "toolRealNames.keywordList"],
  [/keyword_search_results/gi, "搜索结果", "toolRealNames.keywordSearchResults"],
  [/category_report/gi, "类目报告", "toolRealNames.categoryReport"],
  [/category_trend/gi, "类目趋势", "toolRealNames.categoryTrend"],
  [/category_tree/gi, "类目结构", "toolRealNames.categoryTree"],
  [/category_name_search/gi, "类目搜索", "toolRealNames.categoryNameSearch"],
  [/category_keywords/gi, "类目关键词", "toolRealNames.categoryKeywords"],
  [/category_search_from_\w+/gi, "类目搜索", "toolRealNames.categorySearchFrom"],
  [/search_categories_broadly/gi, "选品搜索", "toolRealNames.searchCategoriesBroadly"],
  [/competitor_product_keywords/gi, "竞品关键词", "toolRealNames.competitorProductKeywords"],
  [/ali1688_similar_product/gi, "货源查询", "toolRealNames.ali1688Similar"],
  [/similar_product_feature/gi, "竞品特征", "toolRealNames.similarProductFeature"],
  [/favorite_keyword\w*/gi, "词库管理", "toolRealNames.favoriteKeyword"],
  [/get_favorite_keyword\w*/gi, "词库查询", "toolRealNames.getFavoriteKeyword"],
];

const internalModuleNames: readonly Rule[] = [
  [/market[_-]research/gi, "市场调研", "internalModuleNames.marketResearch"],
  [/competitor[_-]analysis/gi, "竞品分析", "internalModuleNames.competitorAnalysis"],
  [/user[_-]model/gi, "用户分析", "internalModuleNames.userModel"],
  [/trade[_-]model/gi, "交易分析", "internalModuleNames.tradeModel"],
];

const internalFileNames: readonly Rule[] = [
  [/SOUL\.md/gi, "[配置]", "internalFileNames.soul"],
  [/SKILL\.md/gi, "[配置]", "internalFileNames.skill"],
  [/IDENTITY\.md/gi, "[配置]", "internalFileNames.identity"],
  [/USER\.md/gi, "[配置]", "internalFileNames.user"],
  [/MEMORY\.md/gi, "[配置]", "internalFileNames.memory"],
  [/TOOLS\.md/gi, "[配置]", "internalFileNames.tools"],
  [/BOOTSTRAP\.md/gi, "[配置]", "internalFileNames.bootstrap"],
  [/HEARTBEAT\.md/gi, "[配置]", "internalFileNames.heartbeat"],
  [/AGENTS\.md/gi, "[配置]", "internalFileNames.agents"],
  [/\bagt_[a-f0-9]+/gi, "[配置]", "internalFileNames.agentId"],
  [/\.fastclaw/gi, "[配置]", "internalFileNames.fastclawDir"],
  [/write_file/gi, "[文件操作]", "internalFileNames.writeFile"],
  [/read_file/gi, "[文件操作]", "internalFileNames.readFile"],
  [/list_dir/gi, "[文件操作]", "internalFileNames.listDir"],
  [/\bexec\b/g, "[执行]", "internalFileNames.exec"],
  [/workspace[\s_]*(self[\s_-]*update|目录|directory|path|路径)/gi, "工作目录", "internalFileNames.workspace"],
  [/\/Users\/[^\s"'`]+/g, "[内部路径]", "internalFileNames.absPath"],
  [/file[\s_-]*tool[\s_-]*(routing|路由)/gi, "文件路由", "internalFileNames.fileToolRouting"],
  [/分析系统集/g, "分析系统", "internalFileNames.mcpZh"],
];

export const RULE_GROUPS = {
  dataSourceBrand,
  internalFileNames,
  agentRuntimeBrand,
  modelNames,
  competitorTools,
  protocolKeywords,
  toolRealNames,
  internalModuleNames,
} as const;

export type RuleGroupName = keyof typeof RULE_GROUPS;

// 行级后处理：替换完单词后还要拦的整行 / 兜底 underscore code 名
// 顺序敏感：先消行 → 再 underscore 兜底 → 再压空行
export type LineRule = readonly [pattern: RegExp, replacement: string, id: string];

export const LINE_RULES: readonly LineRule[] = [
  [/^.*`数据查询`\s*\|.*$/gm, "", "lineRules.toolListRow"],
  [/^.*Skill\s*(名称|脚本|层|技能|文件路径).*/gm, "", "lineRules.skillRowZh"],
  [/^.*(Skill|Tool)\s*(名称|脚本|层|技能|函数).*/gim, "", "lineRules.skillToolRow"],
  [/`\w+_\w+`/g, "`数据查询`", "lineRules.underscoreCodeFallback"],
  [/\n{3,}/g, "\n\n", "lineRules.blankLineSquash"],
];

export function allRules(): readonly Rule[] {
  return Object.values(RULE_GROUPS).flat();
}
