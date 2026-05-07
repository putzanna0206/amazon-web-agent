import { describe, it, expect } from "vitest";
import { apply, applyVerbose } from "./index";

describe("brand-guard / dataSourceBrand", () => {
  it("替换大小写变体的 Sorftime", () => {
    expect(apply("基于 Sorftime 数据")).toContain("我们的数据系统");
    expect(apply("基于 SORFTIME 数据")).toContain("我们的数据系统");
    expect(apply("数据来自 sorftime")).toContain("我们的数据系统");
  });

  it("拦截拆字攻击：S o r f t i m e / S-o-r-f-t-i-m-e", () => {
    expect(apply("S o r f t i m e")).toBe("我们的数据系统");
    expect(apply("S-o-r-f-t-i-m-e")).toBe("我们的数据系统");
    expect(apply("S.o.r.f.t.i.m.e")).toBe("我们的数据系统");
  });

  it("exact 规则在 split 之前能命中", () => {
    const { hits } = applyVerbose("使用 Sorftime 数据");
    const ids = hits.map((h) => h.id);
    expect(ids).toContain("dataSourceBrand.exact");
    expect(ids).not.toContain("dataSourceBrand.split");
  });
});

describe("brand-guard / agentRuntimeBrand", () => {
  it("替换 FastClaw 大小写变体", () => {
    expect(apply("运行在 FastClaw 上")).toContain("Agent 平台");
    expect(apply("fastclaw daemon")).toContain("Agent 平台");
  });

  it("拦截 FastClaw 拆字", () => {
    expect(apply("F a s t c l a w")).toBe("Agent 平台");
  });

  it("FastClaw exact 规则能命中", () => {
    const { hits } = applyVerbose("运行在 FastClaw 上");
    const ids = hits.map((h) => h.id);
    expect(ids).toContain("agentRuntimeBrand.exact");
  });
});

describe("brand-guard / modelNames", () => {
  it("替换 MiniMax / M2.7 系列", () => {
    expect(apply("使用 MiniMax M2.7")).toContain("模型");
    expect(apply("基于 minimax")).toContain("模型");
  });

  it("替换 Claude / GPT / Gemini", () => {
    expect(apply("Claude Sonnet 4.5")).toContain("模型");
    expect(apply("GPT-4")).toContain("模型");
    expect(apply("Gemini")).toContain("模型");
  });

  it("替换厂商名 Anthropic / OpenAI", () => {
    expect(apply("Anthropic 出品")).toContain("模型厂商");
    expect(apply("OpenAI 模型")).toContain("模型厂商");
  });

  it("替换 zhipu-glm / GLM", () => {
    expect(apply("zhipu-glm-4.5")).toContain("模型");
    expect(apply("使用 GLM")).toContain("模型");
  });
});

describe("brand-guard / competitorTools", () => {
  it("替换同类电商分析工具品牌", () => {
    expect(apply("不如 Helium 10")).toContain("其他同类工具");
    expect(apply("对比 Jungle Scout")).toContain("其他同类工具");
    expect(apply("类似 Sellics")).toContain("其他同类工具");
    expect(apply("Viral Launch 也行")).toContain("其他同类工具");
  });
});

describe("brand-guard / protocolKeywords", () => {
  it("替换 MCP 协议关键词", () => {
    // 注意：mcp_sorftime_xxx 在 dataSourceBrand 先把 Sorftime 替换后，前缀 mcp_ 因 \w 不匹配中文而漏掉
    // 这是既有 sanitize 的真实行为，记录在 rules.ts 顺序敏感性
    expect(apply("调用 mcp_unknown_tool")).toContain("数据查询");
    expect(apply("MCP Server")).toContain("分析系统");
    expect(apply("Model Context Protocol")).toContain("分析系统");
  });
});

describe("brand-guard / toolRealNames", () => {
  it("替换 Sorftime 工具真名", () => {
    expect(apply("调用 keyword_detail")).toContain("关键词详情");
    expect(apply("调用 product_search")).toContain("产品搜索");
    expect(apply("调用 product_reviews")).toContain("评论采集");
    expect(apply("调用 category_report")).toContain("类目报告");
  });

  it("替换 walmart_* / tiktok_* 通配", () => {
    expect(apply("walmart_search")).toContain("沃尔玛数据");
    expect(apply("tiktok_author")).toContain("TikTok数据");
    expect(apply("walmart_keyword_detail")).toContain("沃尔玛数据");
  });
});

describe("brand-guard / internalModuleNames", () => {
  it("替换 runtime 路径里的英文 skill 目录名", () => {
    expect(apply("/skills/market-research/SKILL.md")).toContain("市场调研");
    expect(apply("competitor_analysis")).toContain("竞品分析");
    expect(apply("user-model")).toContain("用户分析");
    expect(apply("trade_model")).toContain("交易分析");
  });
});

describe("brand-guard / internalFileNames", () => {
  it("替换 bootstrap 配置文件名", () => {
    expect(apply("写入 SOUL.md")).toContain("[配置]");
    expect(apply("加载 SKILL.md")).toContain("[配置]");
    expect(apply("agt_641dd151f236281066ee")).toContain("[配置]");
    expect(apply("路径 ~/.fastclaw/agents/")).toContain("[配置]");
  });

  it("替换文件操作工具名", () => {
    expect(apply("调用 write_file")).toContain("[文件操作]");
    expect(apply("使用 list_dir")).toContain("[文件操作]");
  });

  it("替换绝对路径", () => {
    expect(apply("路径 /Users/foo/bar/baz.md")).toContain("[内部路径]");
  });
});

describe("brand-guard / lineRules", () => {
  it("把 `xxx_yyy` 这种下划线代码兜底为 `数据查询`", () => {
    // 走完前面的 group 还能漏掉 → 这条兜底
    expect(apply("调用 `some_unknown_tool`")).toContain("`数据查询`");
  });

  it("压缩 3+ 连续空行为 2 行", () => {
    expect(apply("行1\n\n\n\n行2")).toBe("行1\n\n行2");
  });
});

describe("brand-guard / 综合", () => {
  it("一段含多条违规的 LLM 输出，全部被替换", () => {
    const input = "我们使用 Sorftime 的 keyword_detail 工具，跑在 FastClaw 上，模型是 MiniMax M2.7。";
    const out = apply(input);
    expect(out).not.toMatch(/Sorftime/i);
    expect(out).not.toMatch(/FastClaw/i);
    expect(out).not.toMatch(/MiniMax/i);
    expect(out).not.toMatch(/keyword_detail/);
  });

  it("不包含违规词的文本应保持原样（trim 后）", () => {
    const clean = "这是一段正常的市场分析报告，不含任何品牌名。";
    expect(apply(clean)).toBe(clean);
  });
});

describe("brand-guard / applyVerbose", () => {
  it("返回命中规则的清单和次数", () => {
    const { output, hits } = applyVerbose("使用 Sorftime 和 FastClaw");
    expect(output).toContain("我们的数据系统");
    expect(output).toContain("Agent 平台");

    const ids = hits.map((h) => h.id);
    expect(ids).toContain("dataSourceBrand.exact");
    expect(ids).toContain("agentRuntimeBrand.exact");
  });

  it("无命中时 hits 为空数组", () => {
    const { hits } = applyVerbose("纯净文本");
    expect(hits).toEqual([]);
  });
});
