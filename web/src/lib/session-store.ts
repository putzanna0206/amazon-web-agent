"use client";

import { useState, useEffect, useCallback } from "react";
import type { ChatMessage } from "./api";

// 本地会话 Module。
// 收齐三条 invariant：
// 1. 任何修改自动 localStorage 同步（调用方再也忘不了 saveSessions）
// 2. 首条 user 消息进入空 session 时，自动设 title 为前 30 字
// 3. 列表为空时自动建一条新会话

export interface LocalSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
}

const STORAGE_KEY_PREFIX = "fc_sessions_";
const DEFAULT_TITLE = "新对话";
const TITLE_MAX = 30;

function storageKey(userId: string) {
  return STORAGE_KEY_PREFIX + userId;
}

function loadFromStorage(userId: string): LocalSession[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(storageKey(userId)) || "[]");
  } catch {
    return [];
  }
}

function saveToStorage(userId: string, sessions: LocalSession[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(userId), JSON.stringify(sessions));
}

function genId() {
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function newSession(): LocalSession {
  return { id: genId(), title: DEFAULT_TITLE, messages: [], createdAt: Date.now() };
}

export interface UseSessionsResult {
  sessions: LocalSession[];
  activeId: string;
  activeSession: LocalSession | undefined;
  setActive: (id: string) => void;
  create: () => string;
  remove: (id: string) => void;
  appendMessages: (id: string, msgs: ChatMessage[]) => void;
  patchLastMessage: (id: string, patch: Partial<ChatMessage>) => void;
  rename: (id: string, title: string) => void;
}

export function useSessions(userId: string): UseSessionsResult {
  const [sessions, setSessions] = useState<LocalSession[]>([]);
  const [activeId, setActiveId] = useState("");
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount. Mount-only — localStorage 仅 client 可访问，
  // 必须 effect 阶段才能读。这是 set-state-in-effect 规则的合理用例。
  useEffect(() => {
    if (!userId) return;
    const stored = loadFromStorage(userId);
    const list = stored.length > 0 ? stored : [newSession()];
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSessions(list);
    setActiveId(list[0].id);
    setHydrated(true);
  }, [userId]);

  // Persist on every change. Skip until hydrated to avoid wiping storage with the initial [].
  useEffect(() => {
    if (!hydrated) return;
    saveToStorage(userId, sessions);
  }, [sessions, hydrated, userId]);

  const create = useCallback(() => {
    const fresh = newSession();
    setSessions((prev) => [fresh, ...prev]);
    setActiveId(fresh.id);
    return fresh.id;
  }, []);

  const remove = useCallback((id: string) => {
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      if (updated.length === 0) {
        const fresh = newSession();
        setActiveId(fresh.id);
        return [fresh];
      }
      if (id === activeId) {
        setActiveId(updated[0].id);
      }
      return updated;
    });
  }, [activeId]);

  const appendMessages = useCallback((id: string, msgs: ChatMessage[]) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const wasEmpty = s.messages.length === 0;
        const firstUser = msgs.find((m) => m.role === "user");
        const title =
          wasEmpty && s.title === DEFAULT_TITLE && firstUser
            ? firstUser.content.slice(0, TITLE_MAX)
            : s.title;
        return { ...s, title, messages: [...s.messages, ...msgs] };
      })
    );
  }, []);

  const patchLastMessage = useCallback((id: string, patch: Partial<ChatMessage>) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        if (s.messages.length === 0) return s;
        const msgs = [...s.messages];
        msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], ...patch };
        return { ...s, messages: msgs };
      })
    );
  }, []);

  const rename = useCallback((id: string, title: string) => {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, title } : s)));
  }, []);

  const setActive = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const activeSession = sessions.find((s) => s.id === activeId);

  return {
    sessions,
    activeId,
    activeSession,
    setActive,
    create,
    remove,
    appendMessages,
    patchLastMessage,
    rename,
  };
}
