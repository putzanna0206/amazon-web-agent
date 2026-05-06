import { describe, it, expect } from "vitest";
import { runChatTurn, type TurnEvent } from "./run-chat-turn";
import type { ChatEvent } from "./api";

function fakeStream(events: ChatEvent[]) {
  return async function* () {
    for (const ev of events) yield ev;
  };
}

async function collect(gen: AsyncGenerator<TurnEvent>): Promise<TurnEvent[]> {
  const out: TurnEvent[] = [];
  for await (const ev of gen) out.push(ev);
  return out;
}

const INPUT = { agentId: "a", sessionId: "s", message: "hi" };

describe("runChatTurn / phase 状态机", () => {
  it("起始 emit thinking", async () => {
    const stream = fakeStream([{ type: "done" }]);
    const out = await collect(runChatTurn(INPUT, () => stream()));
    expect(out[0]).toEqual({ type: "phase", phase: "thinking" });
  });

  it("第一个 content 事件触发 streaming phase（在 content 之前）", async () => {
    const stream = fakeStream([
      { type: "content", data: { content: "hello" } },
      { type: "done" },
    ]);
    const out = await collect(runChatTurn(INPUT, () => stream()));
    const phaseIdx = out.findIndex((e) => e.type === "phase" && e.phase === "streaming");
    const contentIdx = out.findIndex((e) => e.type === "content");
    expect(phaseIdx).toBeGreaterThan(-1);
    expect(phaseIdx).toBeLessThan(contentIdx);
  });

  it("streaming phase 只 emit 一次（多 content chunk 不重复）", async () => {
    const stream = fakeStream([
      { type: "content", data: { content: "a" } },
      { type: "content", data: { content: "b" } },
      { type: "content", data: { content: "c" } },
      { type: "done" },
    ]);
    const out = await collect(runChatTurn(INPUT, () => stream()));
    const streamingPhases = out.filter((e) => e.type === "phase" && e.phase === "streaming");
    expect(streamingPhases).toHaveLength(1);
  });

  it("tool_call → calling、tool_result → processing", async () => {
    const stream = fakeStream([
      { type: "tool_call" },
      { type: "tool_result" },
      { type: "done" },
    ]);
    const out = await collect(runChatTurn(INPUT, () => stream()));
    const phases = out.filter((e) => e.type === "phase").map((e) => (e as { phase: string }).phase);
    expect(phases).toEqual(["thinking", "calling", "processing"]);
  });
});

describe("runChatTurn / content 与 file", () => {
  it("逐 chunk emit content（不累积）", async () => {
    const stream = fakeStream([
      { type: "content", data: { content: "ab" } },
      { type: "content", data: { content: "cd" } },
      { type: "done" },
    ]);
    const out = await collect(runChatTurn(INPUT, () => stream()));
    const chunks = out.filter((e) => e.type === "content").map((e) => (e as { chunk: string }).chunk);
    expect(chunks).toEqual(["ab", "cd"]);
  });

  it("file 事件透传 path 和 name", async () => {
    const stream = fakeStream([
      { type: "file", data: { path: "/x/y.pdf", name: "y.pdf" } },
      { type: "done" },
    ]);
    const out = await collect(runChatTurn(INPUT, () => stream()));
    const file = out.find((e) => e.type === "file");
    expect(file).toEqual({ type: "file", path: "/x/y.pdf", name: "y.pdf" });
  });

  it("空 content 事件被跳过（不触发 streaming phase）", async () => {
    const stream = fakeStream([
      { type: "content", data: { content: "" } },
      { type: "done" },
    ]);
    const out = await collect(runChatTurn(INPUT, () => stream()));
    const streamingPhases = out.filter((e) => e.type === "phase" && e.phase === "streaming");
    expect(streamingPhases).toHaveLength(0);
  });
});

describe("runChatTurn / 终止", () => {
  it("done 事件正常 emit done 后停止", async () => {
    const stream = fakeStream([
      { type: "content", data: { content: "x" } },
      { type: "done" },
      // 这条不该被消费
      { type: "content", data: { content: "y" } },
    ]);
    const out = await collect(runChatTurn(INPUT, () => stream()));
    const last = out[out.length - 1];
    expect(last).toEqual({ type: "done" });
    const yChunk = out.find((e) => e.type === "content" && (e as { chunk: string }).chunk === "y");
    expect(yChunk).toBeUndefined();
  });

  it("流自然结束（无 done 事件）也 emit done", async () => {
    const stream = fakeStream([{ type: "content", data: { content: "x" } }]);
    const out = await collect(runChatTurn(INPUT, () => stream()));
    expect(out[out.length - 1]).toEqual({ type: "done" });
  });

  it("流抛错时 emit error，message 透传异常信息", async () => {
    const failing = async function* () {
      yield { type: "content", data: { content: "x" } } as ChatEvent;
      throw new Error("network down");
    };
    const out = await collect(runChatTurn(INPUT, () => failing()));
    const err = out[out.length - 1];
    expect(err).toEqual({ type: "error", message: "network down" });
  });
});

describe("runChatTurn / 综合", () => {
  it("典型一轮：thinking → calling → processing → streaming → content × 2 → done", async () => {
    const stream = fakeStream([
      { type: "tool_call" },
      { type: "tool_result" },
      { type: "content", data: { content: "结果" } },
      { type: "content", data: { content: "完成" } },
      { type: "done" },
    ]);
    const out = await collect(runChatTurn(INPUT, () => stream()));
    const summary = out.map((e) => {
      if (e.type === "phase") return `phase:${e.phase}`;
      if (e.type === "content") return `chunk:${e.chunk}`;
      return e.type;
    });
    expect(summary).toEqual([
      "phase:thinking",
      "phase:calling",
      "phase:processing",
      "phase:streaming",
      "chunk:结果",
      "chunk:完成",
      "done",
    ]);
  });
});
