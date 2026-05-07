import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { MarkdownText } from "./markdown";
import { trustAsSanitized } from "./brand-guard";

// Mock ResizeObserver for Recharts
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = MockResizeObserver as any;

// Mock getBoundingClientRect
Element.prototype.getBoundingClientRect = () => ({ width: 600, height: 300, top: 0, left: 0, bottom: 300, right: 600, x: 0, y: 0, toJSON: () => ({}) }) as any;

describe("MarkdownText image rendering", () => {
  it("renders markdown image as <img> tag", () => {
    const text = trustAsSanitized("![My Chart](chart.png)");
    const { container } = render(
      <MarkdownText text={text} streaming={false} agentId="agt_123" />
    );
    const img = container.querySelector("img");
    expect(img).toBeTruthy();
    expect(img?.getAttribute("src")).toBe("/api/agents/agt_123/files/chart.png");
    expect(img?.getAttribute("alt")).toBe("My Chart");
  });

  it("renders image with surrounding text", () => {
    const text = trustAsSanitized("Here is the chart:\n\n![Trend](trend.svg)\n\nAbove is the chart.");
    const { container } = render(
      <MarkdownText text={text} streaming={false} agentId="agt_456" />
    );
    const img = container.querySelector("img");
    expect(img).toBeTruthy();
    expect(img?.getAttribute("src")).toBe("/api/agents/agt_456/files/trend.svg");
    expect(container.textContent).toContain("Here is the chart");
    expect(container.textContent).toContain("Above is the chart");
  });

  it("renders multiple images", () => {
    const text = trustAsSanitized("![A](a.png)\n\n![B](b.png)");
    const { container } = render(
      <MarkdownText text={text} streaming={false} agentId="agt_789" />
    );
    const imgs = container.querySelectorAll("img");
    expect(imgs.length).toBe(2);
    expect(imgs[0].getAttribute("src")).toBe("/api/agents/agt_789/files/a.png");
    expect(imgs[1].getAttribute("src")).toBe("/api/agents/agt_789/files/b.png");
  });

  it("still renders chart blocks", () => {
    const chartJson = JSON.stringify({
      type: "bar",
      title: "Test",
      xKey: "name",
      yKey: "value",
      data: [{ name: "A", value: 10 }],
    });
    const text = trustAsSanitized("```chart\n" + chartJson + "\n```");
    const { container } = render(
      <MarkdownText text={text} streaming={false} agentId="agt_123" />
    );
    // Should render chart, not code block
    expect(container.querySelector("pre")).toBeFalsy();
    expect(container.textContent).toContain("Test");
  });
});
