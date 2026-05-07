import { describe, it, expect, vi, beforeAll } from "vitest";
import { render } from "@testing-library/react";
import { MarkdownText } from "./markdown";

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.getBoundingClientRect = vi.fn().mockReturnValue({
    width: 600, height: 300, top: 0, left: 0, bottom: 300, right: 600,
  });
});

describe("MarkdownText chart integration", () => {
  const barChartMd = "```chart\n" + JSON.stringify({
    type: "bar",
    xKey: "category",
    yKey: "sales",
    data: [{ category: "电子", sales: 12000 }],
  }) + "\n```";

  it("renders chart block from ```chart code fence", () => {
    const { container } = render(
      <MarkdownText text={barChartMd as any} streaming={false} />
    );
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("falls back to code block for invalid chart JSON", () => {
    const badMd = "```chart\nnot valid json\n```";
    const { container } = render(
      <MarkdownText text={badMd as any} streaming={false} />
    );
    // Should show a code block, not an SVG
    expect(container.querySelector("svg")).toBeNull();
    expect(container.querySelector("pre")).toBeTruthy();
  });

  it("renders chart alongside other markdown content", () => {
    const md = "## 销售报告\n" + barChartMd + "\n以上为分析结果。";
    const { container } = render(
      <MarkdownText text={md as any} streaming={false} />
    );
    expect(container.querySelector("svg")).toBeTruthy();
    expect(container.textContent).toContain("销售报告");
    expect(container.textContent).toContain("分析结果");
  });
});
