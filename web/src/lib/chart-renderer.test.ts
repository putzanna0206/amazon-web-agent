import { describe, it, expect } from "vitest";
import { parseChartConfig } from "./chart-renderer";

describe("parseChartConfig", () => {
  it("parses a valid bar chart config", () => {
    const json = JSON.stringify({
      type: "bar",
      title: "Sales",
      xKey: "category",
      yKey: "sales",
      data: [
        { category: "电子", sales: 12000 },
        { category: "家居", sales: 8500 },
      ],
    });
    const result = parseChartConfig(json);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("bar");
    expect(result!.title).toBe("Sales");
    expect(result!.data).toHaveLength(2);
  });

  it("returns null for invalid JSON", () => {
    expect(parseChartConfig("not json")).toBeNull();
  });

  it("returns null when type is missing", () => {
    expect(parseChartConfig(JSON.stringify({ data: [] }))).toBeNull();
  });

  it("returns null for unknown type", () => {
    expect(parseChartConfig(JSON.stringify({ type: "scatter", data: [] }))).toBeNull();
  });

  it("returns null when data is not an array", () => {
    expect(parseChartConfig(JSON.stringify({ type: "bar", data: "oops" }))).toBeNull();
  });

  it("parses a line chart config", () => {
    const json = JSON.stringify({
      type: "line",
      xKey: "month",
      yKey: "revenue",
      data: [{ month: "1月", revenue: 100 }, { month: "2月", revenue: 150 }],
    });
    const result = parseChartConfig(json);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("line");
  });

  it("parses a pie chart config", () => {
    const json = JSON.stringify({
      type: "pie",
      nameKey: "category",
      valueKey: "share",
      data: [
        { category: "电子", share: 40 },
        { category: "家居", share: 30 },
      ],
    });
    const result = parseChartConfig(json);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("pie");
    if (result!.type === "pie") {
      expect(result!.nameKey).toBe("category");
      expect(result!.valueKey).toBe("share");
      expect(result!.donut).toBeFalsy();
    }
  });

  it("parses a donut chart config", () => {
    const json = JSON.stringify({
      type: "pie",
      nameKey: "category",
      valueKey: "share",
      donut: true,
      data: [{ category: "A", share: 50 }],
    });
    const result = parseChartConfig(json);
    expect(result).not.toBeNull();
    if (result!.type === "pie") {
      expect(result!.donut).toBe(true);
    }
  });

  it("parses a radar chart config", () => {
    const json = JSON.stringify({
      type: "radar",
      nameKey: "product",
      valueKey: "score",
      radarKeys: ["price", "quality", "service"],
      data: [
        { product: "A", price: 80, quality: 90, service: 70 },
        { product: "B", price: 60, quality: 85, service: 95 },
      ],
    });
    const result = parseChartConfig(json);
    expect(result).not.toBeNull();
    if (result!.type === "radar") {
      expect(result!.radarKeys).toEqual(["price", "quality", "service"]);
    }
  });
});
