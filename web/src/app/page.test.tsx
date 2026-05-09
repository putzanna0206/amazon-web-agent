import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const store: Record<string, string> = {};
vi.stubGlobal("localStorage", {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => Object.keys(store).forEach((k) => delete store[k]),
});

describe("Root page", () => {
  beforeEach(() => {
    pushMock.mockClear();
    localStorage.clear();
    cleanup();
  });

  it("redirects to /chat on mount", async () => {
    const { default: RootPage } = await import("./page");
    render(<RootPage />);
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/chat");
    });
  });

  it("shows spinner during redirect, not blank", async () => {
    const { default: RootPage } = await import("./page");
    render(<RootPage />);
    expect(screen.getByText("正在跳转...")).toBeDefined();
  });
});
