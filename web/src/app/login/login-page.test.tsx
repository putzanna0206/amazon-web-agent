import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const store: Record<string, string> = {};
vi.stubGlobal("localStorage", {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
});

vi.mock("@/lib/auth", () => ({
  useAuth: () => ({ user: null, agent: null, loading: false, authError: null, login: vi.fn(), logout: vi.fn() }),
}));

describe("Login page UI", () => {
  beforeEach(() => {
    cleanup();
  });

  it("renders username and password labels", async () => {
    const { default: LoginPage } = await import("./page");
    render(<LoginPage />);
    expect(screen.getByLabelText("用户名")).toBeDefined();
    expect(screen.getByLabelText("密码")).toBeDefined();
  });

  it("login button font size is at least 16px", async () => {
    const { default: LoginPage } = await import("./page");
    render(<LoginPage />);
    const btn = screen.getByRole("button", { name: /登录/ });
    expect(parseInt(btn.style.fontSize)).toBeGreaterThanOrEqual(16);
  });

  it("input font size is at least 16px", async () => {
    const { default: LoginPage } = await import("./page");
    render(<LoginPage />);
    const inputs = screen.getAllByRole("textbox");
    for (const input of inputs) {
      expect(parseInt(input.style.fontSize)).toBeGreaterThanOrEqual(16);
    }
  });
});
