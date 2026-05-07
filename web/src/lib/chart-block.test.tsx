import { describe, it, expect, vi, beforeAll } from "vitest";
import { render } from "@testing-library/react";
import { ChartBlock } from "./chart-renderer";
import type { ChartConfig } from "./chart-renderer";

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

const barConfig: ChartConfig = {
  type: "bar",
  title: "Top 品类",
  xKey: "category",
  yKey: "sales",
  data: [
    { category: "电子", sales: 12000 },
    { category: "家居", sales: 8500 },
  ],
};

const lineConfig: ChartConfig = {
  type: "line",
  xKey: "month",
  yKey: "revenue",
  data: [
    { month: "1月", revenue: 100 },
    { month: "2月", revenue: 150 },
  ],
};

const pieConfig: ChartConfig = {
  type: "pie",
  nameKey: "category",
  valueKey: "share",
  data: [
    { category: "电子", share: 40 },
    { category: "家居", share: 30 },
    { category: "服装", share: 30 },
  ],
};

const donutConfig: ChartConfig = {
  ...pieConfig,
  donut: true,
};

const radarConfig: ChartConfig = {
  type: "radar",
  nameKey: "product",
  valueKey: "score",
  radarKeys: ["price", "quality", "service"],
  data: [
    { product: "A", price: 80, quality: 90, service: 70 },
  ],
};

describe("ChartBlock", () => {
  it("renders bar chart with title", () => {
    const { container } = render(<ChartBlock config={barConfig} />);
    expect(container.querySelector("svg")).toBeTruthy();
    // Bar charts render <path> elements with rect-like shapes
    expect(container.querySelectorAll("svg path").length).toBeGreaterThan(0);
    expect(container.textContent).toContain("Top 品类");
  });

  it("renders line chart", () => {
    const { container } = render(<ChartBlock config={lineConfig} />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("renders pie chart", () => {
    const { container } = render(<ChartBlock config={pieConfig} />);
    expect(container.querySelector("svg")).toBeTruthy();
    // Pie charts render <path> sectors
    expect(container.querySelectorAll("svg path").length).toBeGreaterThan(0);
  });

  it("renders donut chart", () => {
    const { container } = render(<ChartBlock config={donutConfig} />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("renders radar chart", () => {
    const { container } = render(<ChartBlock config={radarConfig} />);
    expect(container.querySelector("svg")).toBeTruthy();
    // Radar charts render PolarGrid lines via <path>
    expect(container.querySelectorAll("svg path").length).toBeGreaterThan(0);
  });
});
