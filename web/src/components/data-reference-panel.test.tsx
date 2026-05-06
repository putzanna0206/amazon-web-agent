import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { DataReferencePanel } from "./data-reference-panel";

describe("DataReferencePanel", () => {
  afterEach(cleanup);

  it("renders section titles when visible", () => {
    render(<DataReferencePanel visible={true} />);

    expect(screen.getByText("选择指令开始搜索")).toBeInTheDocument();
    expect(screen.getByText("关键词查询")).toBeInTheDocument();
    expect(screen.getByText("市场调研")).toBeInTheDocument();
  });

  it("expands section and shows command items on click", async () => {
    render(<DataReferencePanel visible={true} />);

    expect(screen.queryByText(/月搜索量/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByText("关键词查询"));

    expect(screen.getByText(/月搜索量/)).toBeInTheDocument();
  });

  it("shows quick query examples by default (defaultOpen)", () => {
    render(<DataReferencePanel visible={true} />);

    expect(screen.getByText(/\[输入关键词\].*搜索量/)).toBeInTheDocument();
  });

  it("renders nothing when not visible", () => {
    render(<DataReferencePanel visible={false} />);

    expect(screen.queryByText("选择指令开始搜索")).not.toBeInTheDocument();
  });

  it("expands skill commands on click", async () => {
    render(<DataReferencePanel visible={true} />);

    expect(screen.queryByText(/\[输入关键词\].*市场/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByText("市场调研"));

    expect(screen.getByText(/\[输入关键词\].*市场/)).toBeInTheDocument();
  });

  it("calls onSelectCommand when command item is clicked", async () => {
    const onSelect = vi.fn();
    render(<DataReferencePanel visible={true} onSelectCommand={onSelect} />);

    const quickItem = screen.getByText(/\[输入关键词\].*搜索量/);
    await userEvent.click(quickItem);
    expect(onSelect).toHaveBeenCalled();
  });
});
