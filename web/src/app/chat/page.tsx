"use client";

import React from "react";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { type ChatMessage } from "@/lib/api";
import { useRouter } from "next/navigation";
import { apply as applyBrandGuard } from "@/lib/brand-guard";
import { useSessions } from "@/lib/session-store";
import { runChatTurn, type StreamPhase } from "@/lib/run-chat-turn";
import { MarkdownText, stripThinkTags } from "@/lib/markdown";
import { DataReferencePanel } from "@/components/data-reference-panel";

const PHASE_LABEL: Record<StreamPhase, string> = {
  thinking: "思考中...",
  calling: "调用数据系统...",
  processing: "整理结果...",
  streaming: "",
};

const QUICK_CARDS = [
  { label: "市场调研", desc: "选择调研模版，输出详细报告", text: "帮我分析「bluetooth speaker」这个市场：搜索量、价格带、头部品牌、机会点" },
  { label: "竞品分析", desc: "选择调研模版，输出详细报告", text: "帮我对比分析这些竞品：「B0D1QFXM7K, B0BZJTGRZG」" },
  { label: "用户需求", desc: "选择调研模版，输出详细报告", text: "帮我从用户角度分析「electric toothbrush」的需求：使用场景、痛点、效用层级" },
  { label: "选品评估", desc: "选择调研模版，输出详细报告", text: "帮我评估「bluetooth speaker」值不值得做：市场规模、竞争、利润空间、风险" },
];

const SKILL_PROMPTS = [
  { key: "market", label: "市场调研",
    template: `帮我分析「输入关键词」这个市场：搜索量、价格带、头部品牌、机会点`,
    placeholder: "输入关键词，如 bluetooth speaker" },
  { key: "comp", label: "竞品分析",
    template: `帮我对比分析这些竞品：「输入ASIN」`,
    placeholder: "输入ASIN，如 B0D1QFXM7K" },
  { key: "user", label: "用户需求",
    template: `帮我从用户角度分析「输入关键词」的需求：使用场景、痛点、效用层级`,
    placeholder: "输入关键词，如 electric toothbrush" },
  { key: "evaluate", label: "选品评估",
    template: `帮我评估「输入关键词或ASIN」值不值得做：市场规模、竞争、利润空间、风险`,
    placeholder: "输入关键词或ASIN" },
];

export default function ChatPage() {
  const { user, agent, loading, logout } = useAuth();
  const router = useRouter();
  const store = useSessions();
  const { sessions, activeId, activeSession } = store;
  const [input, setInput] = useState("");
  const [streamingIds, setStreamingIds] = useState<Set<string>>(new Set());
  const [phaseMap, setPhaseMap] = useState<Map<string, StreamPhase>>(new Map());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [refPanelOpen, setRefPanelOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessions, activeId]);

  const messages = activeSession?.messages || [];
  const streaming = streamingIds.has(activeId);
  const phase = phaseMap.get(activeId);

  const setPhase = useCallback((sid: string, p: StreamPhase | null) => {
    setPhaseMap((prev) => {
      const next = new Map(prev);
      if (p === null) next.delete(sid);
      else next.set(sid, p);
      return next;
    });
  }, []);

  const newChat = useCallback(() => {
    store.create();
    setInput("");
  }, [store]);

  const switchSession = useCallback((id: string) => {
    store.setActive(id);
    setInput("");
  }, [store]);

  const removeSession = useCallback((id: string) => {
    store.remove(id);
  }, [store]);

  const sendMessage = useCallback(
    async (text?: string) => {
      const msg = (text || input).trim();
      if (!msg || !agent || !activeId) return;
      if (streamingIds.has(activeId)) return;
      setInput("");
      setStreamingIds((prev) => new Set(prev).add(activeId));

      const sid = activeId;
      store.appendMessages(sid, [
        { role: "user", content: msg },
        { role: "assistant", content: "" },
      ]);

      let fullContent = "";
      const files: { path: string; name: string }[] = [];

      try {
        for await (const ev of runChatTurn({ agentId: agent.id, sessionId: sid, message: msg })) {
          if (ev.type === "phase") {
            setPhase(sid, ev.phase);
          } else if (ev.type === "content") {
            fullContent += ev.chunk;
            store.patchLastMessage(sid, {
              content: fullContent,
              files: files.length > 0 ? [...files] : undefined,
            });
          } else if (ev.type === "file") {
            files.push({ path: ev.path, name: ev.name });
            store.patchLastMessage(sid, { content: fullContent, files: [...files] });
          } else if (ev.type === "error") {
            store.patchLastMessage(sid, { content: "请求失败，请重试。" });
          } else if (ev.type === "done") {
            break;
          }
        }
      } finally {
        setStreamingIds((prev) => {
          const next = new Set(prev);
          next.delete(sid);
          return next;
        });
        setPhase(sid, null);
      }
    },
    [input, streamingIds, agent, activeId, setPhase, store]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--color-text-muted)", fontSize: 14 }}>加载中...</div>
      </div>
    );
  }
  if (!user || !agent) return null;

  return (
    <div style={{ height: "100vh", display: "flex" }}>
      {sidebarOpen && (
        <aside className="chat-sidebar" style={{ width: 260, flexShrink: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: 16 }}>
            <button onClick={newChat} className="new-chat-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              新建分析
            </button>
          </div>

          <div style={{ padding: "0 16px 8px" }}>
            <div className="side-label">分析方向 · 输出详细报告</div>
            {SKILL_PROMPTS.map((s, i) => (
              <div
                key={s.key}
                className={`side-link${i === 0 ? " active" : ""}`}
                onClick={() => {
                  const keyword = prompt(s.placeholder ?? "请输入关键词或ASIN");
                  if (!keyword?.trim()) return;
                  const filled = s.template.replace(/输入关键词或ASIN|输入关键词|输入ASIN/g, keyword.trim());
                  setInput(filled);
                  requestAnimationFrame(() => textareaRef.current?.focus());
                }}
              >
                <span className="mini-dot"></span>{s.label}
              </div>
            ))}
          </div>

          <div style={{ padding: "0 16px 8px" }}>
            <div className="side-label">最近任务</div>
          </div>
          <div style={{ flex: 1, overflow: "auto", padding: "0 8px" }}>
            {sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => switchSession(s.id)}
                className={`session-item${s.id === activeId ? " active" : ""}`}
              >
                <span className="mini-dot"></span>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); removeSession(s.id); }}
                  style={{ opacity: "0", flexShrink: 0, border: "none", background: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: 2 }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.color = "#ef4444"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = "0"; e.currentTarget.style.color = "var(--color-text-muted)"; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
            ))}
          </div>

          <div style={{ padding: 12, borderTop: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{user.username}</span>
            <button
              onClick={() => { logout(); router.push("/login"); }}
              style={{ fontSize: 12, color: "var(--color-text-muted)", border: "none", background: "none", cursor: "pointer" }}
            >
              退出
            </button>
          </div>
        </aside>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100%" }}>
        {/* Top bar */}
        <div style={{ height: 44, display: "flex", alignItems: "center", padding: "0 16px", borderBottom: "1px solid var(--color-border)", flexShrink: 0 }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ padding: 6, borderRadius: 8, border: "none", background: "none", cursor: "pointer", marginRight: 12, color: "var(--color-text)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-sidebar-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 24, height: 24, display: "grid", placeItems: "center", borderRadius: 6, background: "var(--brand-primary)", color: "white", fontSize: 11, fontWeight: 700, fontFamily: "ui-monospace, monospace" }}>AW</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>AmaWebAgent</span>
          </div>
          <button
            onClick={() => setRefPanelOpen(!refPanelOpen)}
            title={refPanelOpen ? "隐藏数据参考" : "显示数据参考"}
            style={{ marginLeft: "auto", padding: 6, borderRadius: 8, border: "none", background: refPanelOpen ? "var(--color-sidebar-hover)" : "none", cursor: "pointer", color: "var(--color-text)", fontSize: 12 }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-sidebar-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = refPanelOpen ? "var(--color-sidebar-hover)" : "none"; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" /></svg>
          </button>
        </div>

        {messages.length === 0 ? (
          /* Empty state */
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px 80px" }}>
            <div style={{ marginBottom: 6, display: "inline-flex", alignItems: "center", gap: 8, height: 28, padding: "0 10px", border: "1px solid var(--color-border)", borderRadius: 999, background: "white", fontSize: 12, fontFamily: "ui-monospace, monospace", color: "var(--color-text-secondary)" }}>
              <span className="mini-dot" style={{ width: 6, height: 6, background: "var(--brand-accent)" }}></span>
              ready for analysis
            </div>
            <h1 style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 8 }}>把一个真实运营问题交给 Agent</h1>
            <p style={{ color: "var(--color-text-secondary)", fontSize: 15, marginBottom: 28, textAlign: "center", maxWidth: 520 }}>
              从一个自然语言问题开始，输入关键词、品类、ASIN 或直接写一个完整问题。
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, width: "100%", maxWidth: 560, marginBottom: 24 }}>
              {QUICK_CARDS.map((q) => (
                <button key={q.label} className="quick-card" onClick={() => setInput(q.text)}>
                  <div className="card-label">{q.label}</div>
                  <div className="card-desc">{q.desc}</div>
                </button>
              ))}
            </div>
            <div style={{ width: "100%", maxWidth: 560 }}>
              <div className="composer">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="输入关键词、ASIN 或运营问题..."
                  disabled={streaming}
                />
                <div className="composer-bar">
                  <span className="composer-hint">Enter 发送 · Shift Enter 换行</span>
                  <button className="send-btn" onClick={() => sendMessage()} disabled={streaming || !input.trim()}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Message view */
          <>
            <div style={{ flex: 1, overflowY: "auto" }}>
              <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 24px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  {messages.map((msg, i) => (
                    <MessageBubble
                      key={`${activeId}-${i}`}
                      msg={msg}
                      agentId={agent.id}
                      streaming={streaming && i === messages.length - 1}
                      phase={streaming && i === messages.length - 1 ? phase : undefined}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>
            <div style={{ flexShrink: 0, borderTop: "1px solid var(--color-border)", padding: "12px 16px" }}>
              <div style={{ maxWidth: 720, margin: "0 auto" }}>
                <div className="composer">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="输入消息..."
                    disabled={streaming}
                  />
                  <div className="composer-bar">
                    <span className="composer-hint">Enter 发送 · Shift Enter 换行</span>
                    <button className="send-btn" onClick={() => sendMessage()} disabled={streaming || !input.trim()}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <DataReferencePanel visible={refPanelOpen} onSelectCommand={(text) => { setInput(text); requestAnimationFrame(() => textareaRef.current?.focus()); }} />
    </div>
  );
}

function MessageBubble({ msg, agentId, streaming, phase }: { msg: ChatMessage; agentId: string; streaming: boolean; phase?: StreamPhase }) {
  if (msg.role === "user") {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div style={{ maxWidth: "85%", background: "var(--color-user-bubble)", borderRadius: 16, padding: "10px 16px", fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
          {msg.content}
        </div>
      </div>
    );
  }

  const display = applyBrandGuard(stripThinkTags(msg.content));
  if (!display && streaming) {
    const label = (phase && PHASE_LABEL[phase]) || PHASE_LABEL.thinking;
    return (
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(79,70,229,0.08)", display: "grid", placeItems: "center", flexShrink: 0, marginTop: 2 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--brand-accent)" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
        </div>
        <div style={{ fontSize: 14, color: "var(--color-text-muted)", animation: "pulse 2s ease-in-out infinite" }}>{label}</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(79,70,229,0.08)", display: "grid", placeItems: "center", flexShrink: 0, marginTop: 2 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--brand-accent)" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
      </div>
      <div style={{ flex: 1, fontSize: 14, lineHeight: 1.6, overflow: "hidden" }}>
        <MarkdownText text={display} streaming={streaming} />
        {msg.files && msg.files.length > 0 && (
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            {msg.files.map((f) => (
              <a
                key={f.path}
                href={`/api/agents/${agentId}/files/${encodeURIComponent(f.path)}`}
                download={f.name}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px", background: "rgba(79,70,229,0.06)", borderRadius: 12, fontSize: 13, fontWeight: 500, color: "var(--brand-accent)", textDecoration: "none" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <polyline points="9 15 12 18 15 15" />
                </svg>
                {f.name}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
