import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { MarkdownText } from "/Users/7aoyi/amazon-web-agent/web/src/lib/markdown";
import { apply, trustAsSanitized } from "/Users/7aoyi/amazon-web-agent/web/src/lib/brand-guard";

class MockResizeObserver { observe() {} unobserve() {} disconnect() {} }
global.ResizeObserver = MockResizeObserver as any;
Element.prototype.getBoundingClientRect = () => ({ width: 600, height: 300, top: 0, left: 0, bottom: 300, right: 600, x: 0, y: 0, toJSON: () => ({}) }) as any;

describe("E2E: Agent image output", () => {
  it("brand-guard does NOT corrupt ![alt](file.png)", () => {
    const raw = "已生成图表：\n\n![Ergonomic Mouse Price Distribution](ergonomic_mouse_price_distribution.png)\n\n以上就是分析结果。";
    const sanitized = apply(raw);
    console.log("After brand-guard:", JSON.stringify(sanitized));
    expect(sanitized).toContain("![Ergonomic Mouse Price Distribution](ergonomic_mouse_price_distribution.png)");
  });

  it("full pipeline: raw Agent text → brand-guard → MarkdownText → renders <img>", () => {
    // This is exactly what happens in the chat page
    const rawAgentText = "\n\n已生成图表：\n\n![Ergonomic Mouse Price Distribution](ergonomic_mouse_price_distribution.png)\n\n**图表说明：**\n- **左图**：各价格区间产品数量分布\n- **右图**：各价格区间销量占比";
    
    // Step 1: brand-guard
    const sanitized = apply(rawAgentText);
    
    // Step 2: MarkdownText renders it
    const { container } = render(
      <MarkdownText text={sanitized} streaming={false} agentId="agt_26223160cd1acbfc5020" />
    );
    
    // Step 3: Check if img tag is rendered
    const img = container.querySelector("img");
    console.log("Container HTML:", container.innerHTML.slice(0, 500));
    console.log("Img element:", img?.outerHTML);
    
    expect(img).toBeTruthy();
    expect(img?.getAttribute("src")).toBe("/api/agents/agt_26223160cd1acbfc5020/files/ergonomic_mouse_price_distribution.png");
    expect(img?.getAttribute("alt")).toBe("Ergonomic Mouse Price Distribution");
  });

  it("the real case from foldable_keyboard session", () => {
    const raw = "图表已生成！\n\n![Foldable Keyboard 搜索量趋势图](foldable_keyboard_trend.png)\n\n**图表说明：**\n- 绿色柱：搜索量 ≥ 50,000（高需求）";
    const sanitized = apply(raw);
    const { container } = render(
      <MarkdownText text={sanitized} streaming={false} agentId="agt_26223160cd1acbfc5020" />
    );
    const img = container.querySelector("img");
    expect(img).toBeTruthy();
    expect(img?.getAttribute("src")).toBe("/api/agents/agt_26223160cd1acbfc5020/files/foldable_keyboard_trend.png");
  });
});
