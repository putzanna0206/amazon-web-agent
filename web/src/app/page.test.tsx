import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock next/navigation
const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

// Mock localStorage
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
  });

  it("redirects to /chat on mount", async () => {
    const { default: LandingPage } = await import("./page");
    render(<LandingPage />);
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/chat");
    });
  });

  it("renders no landing page content", async () => {
    const { default: LandingPage } = await import("./page");
    const { container } = render(<LandingPage />);
    expect(container.querySelector(".landing-shell")).toBeNull();
    expect(container.querySelector(".landing-hero")).toBeNull();
    expect(container.textContent ?? "").not.toContain("亚马逊运营智能体");
  });
});
