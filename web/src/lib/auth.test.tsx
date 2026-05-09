import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { createElement } from "react";
import { AuthProvider, useAuth } from "./auth";

const store: Record<string, string> = {};

function mockFetch(status: number, body: Record<string, unknown>) {
  return vi.fn().mockResolvedValue({
    ok: status < 400,
    status,
    json: () => Promise.resolve(body),
  });
}

describe("AuthProvider authError", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; },
    });
  });

  it("sets authError to 'unauthorized' when getAgents returns 401", async () => {
    vi.stubGlobal("fetch", mockFetch(401, { ok: false, error: "unauthorized" }));
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => createElement(AuthProvider, null, children),
    });

    await act(() => new Promise((r) => setTimeout(r, 50)));

    expect(result.current.authError).toBe("unauthorized");
    expect(result.current.user).toBeNull();
  });

  it("sets authError to 'server_error' when getAgents returns 500", async () => {
    vi.stubGlobal("fetch", mockFetch(500, { ok: false }));
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => createElement(AuthProvider, null, children),
    });

    await act(() => new Promise((r) => setTimeout(r, 50)));

    expect(result.current.authError).toBe("server_error");
    expect(result.current.user).toBeNull();
  });

  it("sets authError to null when getAgents succeeds", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch(200, { agents: [{ id: "a1", name: "test", config: {} }] })
    );
    localStorage.setItem("fc_user", JSON.stringify({ user: { id: "u1", username: "test", email: "t@t.com", role: "user" }, agent: { id: "a1", name: "test" } }));
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => createElement(AuthProvider, null, children),
    });

    await act(() => new Promise((r) => setTimeout(r, 50)));

    expect(result.current.authError).toBeNull();
    expect(result.current.user).not.toBeNull();
  });

  it("sets authError to 'no_agent' when getAgents succeeds but agents is empty", async () => {
    vi.stubGlobal("fetch", mockFetch(200, { agents: [] }));
    localStorage.setItem("fc_user", JSON.stringify({ user: { id: "u1", username: "test", email: "t@t.com", role: "user" }, agent: null }));
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => createElement(AuthProvider, null, children),
    });

    await act(() => new Promise((r) => setTimeout(r, 50)));

    expect(result.current.authError).toBe("no_agent");
  });
});
