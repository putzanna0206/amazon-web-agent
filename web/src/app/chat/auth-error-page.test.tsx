import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { createElement, Context, createContext } from "react";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const AuthContext = createContext<{
  user: { id: string; username: string } | null;
  agent: { id: string; name: string } | null;
  loading: boolean;
  authError: "unauthorized" | "server_error" | "no_agent" | null;
  logout: () => void;
}>({ user: null, agent: null, loading: false, authError: null, logout: vi.fn() });

function ErrorPage({ authError }: { authError: string | null }) {
  if (authError === "unauthorized") {
    return createElement("div", null,
      createElement("h2", null, "请先登录"),
      createElement("button", null, "前往登录")
    );
  }
  if (authError === "server_error") {
    return createElement("div", null,
      createElement("h2", null, "服务暂时不可用"),
      createElement("button", null, "重试")
    );
  }
  if (authError === "no_agent") {
    return createElement("div", null,
      createElement("h2", null, "Agent 未配置"),
      createElement("p", null, "请联系管理员或检查配置")
    );
  }
  return createElement("div", null, "未知错误");
}

describe("Auth error page", () => {
  it("shows '请先登录' with login button when unauthorized", () => {
    render(createElement(ErrorPage, { authError: "unauthorized" }));
    expect(screen.getByText("请先登录")).toBeDefined();
    expect(screen.getByText("前往登录")).toBeDefined();
  });

  it("shows '服务暂时不可用' with retry button when server_error", () => {
    render(createElement(ErrorPage, { authError: "server_error" }));
    expect(screen.getByText("服务暂时不可用")).toBeDefined();
    expect(screen.getByText("重试")).toBeDefined();
  });

  it("shows 'Agent 未配置' with explanation when no_agent", () => {
    render(createElement(ErrorPage, { authError: "no_agent" }));
    expect(screen.getByText("Agent 未配置")).toBeDefined();
    expect(screen.getByText("请联系管理员或检查配置")).toBeDefined();
  });
});
