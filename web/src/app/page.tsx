"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { streamChat, ChatMessage } from "@/lib/api";
import { useRouter } from "next/navigation";

interface LocalSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
}

const STORAGE_KEY = "fc_sessions";

function loadSessions(): LocalSession[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveSessions(sessions: LocalSession[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

function genId() {
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const EXAMPLE_PROMPTS = [
  { label: "市场调研", text: "帮我分析 bluetooth speaker 这个品类的市场概况" },
  { label: "竞品对比", text: "对比分析这几款产品: B0D1QFXM7K, B0BZJTGRZG, B0CKQLY8LS" },
  { label: "关键词分析", text: "查一下 portable power station 的搜索量和趋势" },
  { label: "用户痛点", text: "分析 electric toothbrush 品类用户的差评痛点" },
];

export default function ChatPage() {
  const { user, agent, loading, logout } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<LocalSession[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [input, setInput] = useState("");
  const [streamingIds, setStreamingIds] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  // Load sessions from localStorage on mount
  useEffect(() => {
    const stored = loadSessions();
    setSessions(stored);
    if (stored.length > 0) {
      setActiveId(stored[0].id);
    }
  }, []);

  // Create initial session if none exist
  useEffect(() => {
    if (sessions.length > 0 || !agent) return;
    const id = genId();
    const session: LocalSession = { id, title: "新对话", messages: [], createdAt: Date.now() };
    setSessions([session]);
    setActiveId(id);
    saveSessions([session]);
  }, [agent, sessions.length]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessions, activeId]);

  const activeSession = sessions.find((s) => s.id === activeId);
  const messages = activeSession?.messages || [];
  const streaming = streamingIds.has(activeId);

  const updateSession = useCallback((id: string, patch: Partial<LocalSession>) => {
    setSessions((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, ...patch } : s));
      saveSessions(updated);
      return updated;
    });
  }, []);

  const newChat = useCallback(() => {
    const id = genId();
    const session: LocalSession = { id, title: "新对话", messages: [], createdAt: Date.now() };
    setSessions((prev) => {
      const updated = [session, ...prev];
      saveSessions(updated);
      return updated;
    });
    setActiveId(id);
    setInput("");
  }, []);

  const switchSession = useCallback((id: string) => {
    setActiveId(id);
    setInput("");
  }, []);

  const removeSession = useCallback(
    (id: string) => {
      setSessions((prev) => {
        const updated = prev.filter((s) => s.id !== id);
        saveSessions(updated);
        if (id === activeId && updated.length > 0) {
          setActiveId(updated[0].id);
        } else if (updated.length === 0) {
          // Will trigger the useEffect to create a new one
        }
        return updated;
      });
    },
    [activeId]
  );

  const sendMessage = useCallback(
    async (text?: string) => {
      const msg = (text || input).trim();
      if (!msg || !agent || !activeId) return;
      if (streamingIds.has(activeId)) return;
      setInput("");
      setStreamingIds((prev) => new Set(prev).add(activeId));

      const sid = activeId;
      const userMsg: ChatMessage = { role: "user", content: msg };
      const asstMsg: ChatMessage = { role: "assistant", content: "" };

      setSessions((prev) => {
        const updated = prev.map((s) =>
          s.id === sid
            ? {
                ...s,
                title: s.messages.length === 0 ? msg.slice(0, 30) : s.title,
                messages: [...s.messages, userMsg, asstMsg],
              }
            : s
        );
        saveSessions(updated);
        return updated;
      });

      try {
        let fullContent = "";
        for await (const event of streamChat(agent.id, sid, msg)) {
          if (event.type === "content" && event.data?.content) {
            fullContent += event.data.content;
            const content = fullContent;
            setSessions((prev) => {
              const updated = prev.map((s) => {
                if (s.id !== sid) return s;
                const msgs = [...s.messages];
                msgs[msgs.length - 1] = { role: "assistant", content };
                return { ...s, messages: msgs };
              });
              saveSessions(updated);
              return updated;
            });
          } else if (event.type === "done") {
            break;
          }
        }
      } catch {
        setSessions((prev) => {
          const updated = prev.map((s) => {
            if (s.id !== sid) return s;
            const msgs = [...s.messages];
            msgs[msgs.length - 1] = { role: "assistant", content: "请求失败，请重试。" };
            return { ...s, messages: msgs };
          });
          saveSessions(updated);
          return updated;
        });
      } finally {
        setStreamingIds((prev) => {
          const next = new Set(prev);
          next.delete(sid);
          return next;
        });
      }
    },
    [input, streamingIds, agent, activeId]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-gray-400 text-sm">加载中...</div>
      </div>
    );
  }
  if (!user || !agent) return null;

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      {sidebarOpen && (
        <aside className="w-[260px] flex-shrink-0 bg-gray-50 flex flex-col border-r border-gray-200">
          <div className="p-3">
            <button
              onClick={newChat}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-sm transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              新对话
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2">
            {sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => switchSession(s.id)}
                className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm cursor-pointer mb-0.5 transition-colors ${
                  s.id === activeId ? "bg-gray-200" : "hover:bg-gray-100"
                }`}
              >
                <span className="truncate flex-1 text-gray-700">{s.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSession(s.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity shrink-0"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{user.username}</span>
              <button
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                退出
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Top bar */}
        <div className="h-12 flex items-center px-4 border-b border-gray-200 shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-gray-100 mr-3"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span className="text-sm font-medium text-gray-700 truncate">{agent.name}</span>
        </div>

        {messages.length === 0 ? (
          /* ── Empty state: centered welcome + input ── */
          <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
            <h1 className="text-2xl font-semibold text-gray-800 mb-2">竞品与需求分析</h1>
            <p className="text-gray-400 text-sm mb-8">亚马逊品类分析助手，输入关键词、ASIN 或问题开始</p>
            <div className="grid grid-cols-2 gap-3 w-full max-w-lg mb-8">
              {EXAMPLE_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setInput(p.text)}
                  className="text-left px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors bg-white"
                >
                  <div className="text-xs font-medium text-blue-600 mb-1">{p.label}</div>
                  <div className="text-sm text-gray-500 line-clamp-2">{p.text}</div>
                </button>
              ))}
            </div>
            <div className="w-full max-w-lg relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入消息..."
                disabled={streaming}
                rows={1}
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 disabled:bg-gray-50 max-h-[200px] bg-white"
              />
              <button
                onClick={() => sendMessage()}
                disabled={streaming || !input.trim()}
                className="absolute right-3 bottom-3 p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          /* ── Chat state: messages scroll + input at bottom ── */
          <>
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-[720px] mx-auto px-6 py-6">
                <div className="space-y-6">
                  {messages.map((msg, i) => (
                    <MessageBubble
                      key={`${activeId}-${i}`}
                      msg={msg}
                      streaming={streaming && i === messages.length - 1}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>
            <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-3">
              <div className="max-w-[720px] mx-auto relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="输入消息..."
                  disabled={streaming}
                  rows={1}
                  className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 disabled:bg-gray-50 max-h-[200px] bg-white"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={streaming || !input.trim()}
                  className="absolute right-3 bottom-3 p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── MessageBubble ─── */
function MessageBubble({ msg, streaming }: { msg: ChatMessage; streaming: boolean }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] bg-gray-100 rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap text-gray-800">
          {msg.content}
        </div>
      </div>
    );
  }

  const display = sanitize(stripThinkTags(msg.content));
  if (!display && streaming) {
    return (
      <div className="flex gap-3 items-start">
        <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>
        <div className="text-sm text-gray-400 animate-pulse">思考中...</div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 items-start">
      <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      </div>
      <div className="flex-1 text-sm leading-relaxed text-gray-800 overflow-hidden">
        <MarkdownText text={display} streaming={streaming} />
      </div>
    </div>
  );
}

/* ─── Markdown ─── */
const FILTERED_WORDS: [RegExp, string][] = [
  // Brand names first (most specific)
  [/Sorftime/gi, "我们的数据系统"],
  // Composite tool prefixes (must come before individual matches)
  [/分析系统_我们的数据系统_\w+/g, "数据查询"],
  [/mcp_sorftime_\w+/g, "数据查询"],
  [/mcp_\w+/g, "数据查询"],
  // MCP architecture terms
  [/MCP\s*(Server|工具|工具集|平台|协议)?/gi, "分析系统"],
  // Individual tool names
  [/product_search/gi, "产品搜索"],
  [/product_detail/gi, "产品详情"],
  [/product_reviews/gi, "评论采集"],
  [/product_trend/gi, "产品趋势"],
  [/product_variations/gi, "变体分析"],
  [/product_traffic_terms/gi, "流量分析"],
  [/product_ranking_trend_by_keyword/gi, "排名趋势"],
  [/product_report/gi, "产品报告"],
  [/potential_product/gi, "潜力产品"],
  [/keyword_detail/gi, "关键词详情"],
  [/keyword_trend/gi, "关键词趋势"],
  [/keyword_extends/gi, "延伸词"],
  [/keyword_list/gi, "关键词列表"],
  [/keyword_search_results/gi, "搜索结果"],
  [/category_report/gi, "类目报告"],
  [/category_trend/gi, "类目趋势"],
  [/category_tree/gi, "类目结构"],
  [/category_name_search/gi, "类目搜索"],
  [/category_keywords/gi, "类目关键词"],
  [/category_search_from_\w+/gi, "类目搜索"],
  [/search_categories_broadly/gi, "选品搜索"],
  [/competitor_product_keywords/gi, "竞品关键词"],
  [/ali1688_similar_product/gi, "货源查询"],
  [/similar_product_feature/gi, "竞品特征"],
  [/walmart_\w+/gi, "沃尔玛数据"],
  [/tiktok_\w+/gi, "TikTok数据"],
  [/favorite_keyword\w*/gi, "词库管理"],
  [/get_favorite_keyword\w*/gi, "词库查询"],
  // Internal module names
  [/market[_-]research/gi, "市场调研"],
  [/competitor[_-]analysis/gi, "竞品分析"],
  [/user[_-]model/gi, "用户分析"],
  [/trade[_-]model/gi, "交易分析"],
  [/分析系统集/g, "分析系统"],
];

function sanitize(text: string): string {
  let result = text;
  for (const [pattern, replacement] of FILTERED_WORDS) {
    result = result.replace(pattern, replacement);
  }
  // Remove lines that are pure tool lists or expose architecture
  result = result.replace(/^.*`数据查询`\s*\|.*$/gm, "");
  result = result.replace(/^.*Skill\s*(名称|脚本|层|技能|文件路径).*/gm, "");
  result = result.replace(/^.*(Skill|Tool)\s*(名称|脚本|层|技能|函数).*/gim, "");
  // Remove any remaining code-backtick lines with underscore names
  result = result.replace(/`\w+_\w+`/g, "`数据查询`");
  result = result.replace(/\n{3,}/g, "\n\n");
  return result.trim();
}

function stripThinkTags(text: string): string {
  return text.replace(/<think[^>]*>[\s\S]*?<\/think>/g, "").trim();
}

function MarkdownText({ text, streaming }: { text: string; streaming: boolean }) {
  if (!text) return null;
  const blocks = parseMarkdown(text);
  return (
    <>
      {blocks.map((block, i) => {
        if (block.type === "heading") {
          const cls = block.level === 2 ? "text-base font-semibold mt-4 mb-2 text-gray-900" : "font-semibold mt-3 mb-1 text-gray-900";
          if (block.level === 2) return <h2 key={i} className={cls}>{renderInline(block.text)}</h2>;
          return <h3 key={i} className={cls}>{renderInline(block.text)}</h3>;
        }
        if (block.type === "code") {
          return (
            <div key={i} className="my-2 rounded-lg bg-gray-900 text-gray-100 p-4 text-xs font-mono overflow-x-auto">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-500">{block.lang || "code"}</span>
                <button onClick={() => navigator.clipboard.writeText(block.text)} className="text-gray-500 hover:text-gray-300 text-xs">
                  复制
                </button>
              </div>
              <pre className="whitespace-pre-wrap">{block.text}</pre>
            </div>
          );
        }
        if (block.type === "table") {
          return <MarkdownTable key={i} raw={block.text} />;
        }
        if (block.type === "list") {
          return (
            <ul key={i} className="space-y-1 my-1">
              {(block.items || []).map((item, j) => (
                <li key={j} className="flex gap-2">
                  <span className="text-gray-400 mt-0.5">•</span>
                  <span>{renderInline(item)}</span>
                </li>
              ))}
            </ul>
          );
        }
        return <p key={i} className="my-1">{renderInline(block.text)}</p>;
      })}
      {streaming && <span className="inline-block w-1.5 h-4 bg-gray-800 align-text-bottom animate-pulse ml-0.5" />}
    </>
  );
}

function MarkdownTable({ raw }: { raw: string }) {
  const rows = raw.trim().split("\n").filter((l) => l.trim());
  if (rows.length < 2) return <pre className="text-xs">{raw}</pre>;
  const parseRow = (row: string) => row.split("|").map((c) => c.trim()).filter(Boolean);
  const headers = parseRow(rows[0]);
  const dataRows = rows.slice(2).map(parseRow);
  return (
    <div className="my-2 overflow-x-auto">
      <table className="markdown-table">
        <thead>
          <tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {dataRows.map((row, i) => (
            <tr key={i}>{row.map((cell, j) => <td key={j}>{renderInline(cell)}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Parser ─── */
interface Block {
  type: "heading" | "code" | "table" | "list" | "paragraph";
  text: string;
  level?: number;
  lang?: string;
  items?: string[];
}

function parseMarkdown(text: string): Block[] {
  const blocks: Block[] = [];
  const lines = text.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const hm = line.match(/^(#{1,4})\s+/);
    if (hm) { blocks.push({ type: "heading", level: hm[1].length, text: line.slice(hm[0].length) }); i++; continue; }
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const cl: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) { cl.push(lines[i]); i++; }
      i++;
      blocks.push({ type: "code", text: cl.join("\n"), lang });
      continue;
    }
    if (line.startsWith("|")) {
      const tl: string[] = [];
      while (i < lines.length && lines[i].startsWith("|")) { tl.push(lines[i]); i++; }
      blocks.push({ type: "table", text: tl.join("\n") });
      continue;
    }
    if (line.match(/^[-*]\s/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^[-*]\s/)) { items.push(lines[i].replace(/^[-*]\s/, "")); i++; }
      blocks.push({ type: "list", text: "", items });
      continue;
    }
    if (!line.trim()) { i++; continue; }
    const pl: string[] = [];
    while (i < lines.length && lines[i].trim() && !lines[i].startsWith("#") && !lines[i].startsWith("```") && !lines[i].startsWith("|") && !lines[i].match(/^[-*]\s/)) {
      pl.push(lines[i]); i++;
    }
    blocks.push({ type: "paragraph", text: pl.join("\n") });
  }
  return blocks;
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
    const cp = part.split(/(`[^`]+`)/g);
    return cp.map((c, j) => {
      if (c.startsWith("`") && c.endsWith("`")) return <code key={`${i}-${j}`} className="bg-gray-100 text-red-600 px-1 py-0.5 rounded text-xs">{c.slice(1, -1)}</code>;
      return <span key={`${i}-${j}`}>{c}</span>;
    });
  });
}
