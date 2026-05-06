import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { DataReferencePanel } from "./data-reference-panel";

describe("DataReferencePanel", () => {
  afterEach(cleanup);

  it("renders data categories and example queries when visible", () => {
    render(<DataReferencePanel visible={true} />);

    expect(screen.getByText("关键词类")).toBeInTheDocument();
    expect(screen.getByText(/月搜索量/)).toBeInTheDocument();
    expect(screen.getByText(/CPC/)).toBeInTheDocument();
    expect(screen.getByText(/24 个月搜索趋势/)).toBeInTheDocument();
    expect(screen.getByText(/产品详情/)).toBeInTheDocument();
    expect(screen.getByText(/用户评论/)).toBeInTheDocument();
    expect(screen.getByText(/品类报告/)).toBeInTheDocument();
    expect(screen.getByText("快速查询示例")).toBeInTheDocument();
    expect(screen.getByText(/搜索量多少/)).toBeInTheDocument();
    expect(screen.getByText(/价格带分布/)).toBeInTheDocument();
  });

  it("hides content when not visible", () => {
    render(<DataReferencePanel visible={false} />);

    expect(screen.queryByText("关键词类")).not.toBeInTheDocument();
  });
});
