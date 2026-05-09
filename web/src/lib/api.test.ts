import { describe, it, expect, vi, beforeEach } from "vitest";

describe("api error classification", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("getAgents throws with status 401 for unauthorized", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401 }));
    const { getAgents } = await import("./api");
    try {
      await getAgents();
      expect.fail("should have thrown");
    } catch (e: unknown) {
      expect(e).toBeInstanceOf(Error);
      expect((e as Error & { status?: number }).status).toBe(401);
    }
  });

  it("getAgents throws with status 500 for server error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    const { getAgents } = await import("./api");
    try {
      await getAgents();
      expect.fail("should have thrown");
    } catch (e: unknown) {
      expect(e).toBeInstanceOf(Error);
      expect((e as Error & { status?: number }).status).toBe(500);
    }
  });
});
