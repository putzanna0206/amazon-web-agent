// runChatTurn：一轮对话的副作用管线。
// 把 SSE 事件流（streamChat）翻译成 UI 友好的 TurnEvent 流，并维护 phase 状态机。
// UI 只需 `for await` + 调 sessionStore 方法，不再懂 SSE 协议或 phase 推进规则。

import { streamChat as defaultStreamChat, type ChatEvent } from "./api";

export type StreamPhase = "thinking" | "calling" | "processing" | "streaming";

export type TurnEvent =
  | { type: "phase"; phase: StreamPhase }
  | { type: "content"; chunk: string }
  | { type: "file"; path: string; name: string }
  | { type: "error"; message: string }
  | { type: "done" };

export type StreamChatFn = (
  agentId: string,
  sessionId: string,
  message: string,
  files?: File[]
) => AsyncGenerator<ChatEvent>;

export async function* runChatTurn(
  input: { agentId: string; sessionId: string; message: string; files?: File[] },
  streamFn: StreamChatFn = defaultStreamChat
): AsyncGenerator<TurnEvent> {
  yield { type: "phase", phase: "thinking" };
  let sawContent = false;

  try {
    for await (const ev of streamFn(input.agentId, input.sessionId, input.message)) {
      if (ev.type === "content" && ev.data?.content) {
        if (!sawContent) {
          sawContent = true;
          yield { type: "phase", phase: "streaming" };
        }
        yield { type: "content", chunk: ev.data.content };
      } else if (ev.type === "file" && ev.data) {
        yield { type: "file", path: ev.data.path, name: ev.data.name };
      } else if (ev.type === "tool_call") {
        yield { type: "phase", phase: "calling" };
      } else if (ev.type === "tool_result") {
        yield { type: "phase", phase: "processing" };
      } else if (ev.type === "done") {
        yield { type: "done" };
        return;
      }
    }
    yield { type: "done" };
  } catch (e) {
    yield { type: "error", message: e instanceof Error ? e.message : "请求失败" };
  }
}
