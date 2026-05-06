import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { DataReferencePanel } from "./data-reference-panel";

describe("DataReferencePanel", () => {
  afterEach(cleanup);

  it("renders section titles when visible", () => {
    render(<DataReferencePanel visible={true} />);

    expect(screen.getByText("数据与指令参考")).toBeInTheDocument();
    expect(screen.getByText("关键词类")).toBeInTheDocument();
    expect(screen.getByText("产品类")).toBeInTheDocument();
    expect(screen.getByText("品类类")).toBeInTheDocument();
    expect(screen.getByText("市场调研")).toBeInTheDocument();
    expect(screen.getByText("竞品分析")).toBeInTheDocument();
    expect(screen.getByText("用户需求")).toBeInTheDocument();
    expect(screen.getByText("选品评估")).toBeInTheDocument();
  });

  it("expands section and shows items on click", async () => {
    render(<DataReferencePanel visible={true} />);

    expect(screen.queryByText(/月搜索量/)).not.toBeInTheDocument();

    const keywordBtn = screen.getByText("关键词类");
    await userEvent.click(keywordBtn);

    expect(screen.getByText(/月搜索量/)).toBeInTheDocument();
    expect(screen.getByText(/24 个月搜索趋势/)).toBeInTheDocument();
  });

  it("shows quick query examples by default (defaultOpen)", () => {
    render(<DataReferencePanel visible={true} />);

    expect(screen.getByText(/bluetooth speaker.*搜索量/)).toBeInTheDocument();
  });

  it("renders nothing when not visible", () => {
    render(<DataReferencePanel visible={false} />);

    expect(screen.queryByText("数据与指令参考")).not.toBeInTheDocument();
  });

  it("expands skill commands on click", async () => {
    render(<DataReferencePanel visible={true} />);

    expect(screen.queryByText(/bluetooth speaker.*市场/)).not.toBeInTheDocument();

    const marketBtn = screen.getByText("市场调研");
    await userEvent.click(marketBtn);

    expect(screen.getByText(/bluetooth speaker.*市场/)).toBeInTheDocument();
  });
});
