const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

export async function login(username: string, password: string) {
  const res = await fetch(`${API_BASE}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login: username, password }),
    credentials: "include",
  });
  if (!res.ok) throw new Error("登录失败");
  return res.json();
}

export async function getAgents() {
  const res = await fetch(`${API_BASE}/api/agents`, { credentials: "include" });
  if (!res.ok) throw new Error("获取 Agent 列表失败");
  return res.json();
}

export async function getSessions(agentId: string) {
  const res = await fetch(
    `${API_BASE}/api/chat/sessions?agentId=${encodeURIComponent(agentId)}`,
    { credentials: "include" }
  );
  if (!res.ok) throw new Error("获取会话列表失败");
  return res.json();
}

export async function deleteSession(agentId: string, sessionId: string) {
  const res = await fetch(
    `${API_BASE}/api/chat/sessions/${sessionId}?agentId=${agentId}`,
    { method: "DELETE", credentials: "include" }
  );
  if (!res.ok) throw new Error("删除会话失败");
}

export async function renameSession(
  agentId: string,
  sessionId: string,
  title: string
) {
  const res = await fetch(`${API_BASE}/api/chat/sessions/${sessionId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ agentId, title }),
  });
  if (!res.ok) throw new Error("重命名会话失败");
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatEvent {
  type: "content" | "tool_call" | "tool_result" | "done";
  data?: Record<string, string>;
}

export async function* streamChat(
  agentId: string,
  sessionId: string,
  message: string
): AsyncGenerator<ChatEvent> {
  const res = await fetch(`${API_BASE}/api/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ agentId, sessionId, message }),
  });
  if (!res.ok) throw new Error("发送消息失败");

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const jsonStr = trimmed.slice(5).trim();
      if (!jsonStr) continue;
      try {
        const event: ChatEvent = JSON.parse(jsonStr);
        yield event;
      } catch {
        // skip malformed
      }
    }
  }
}
