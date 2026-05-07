"use client";

import React from "react";
import type { SanitizedText } from "./brand-guard";
import { parseChartConfig, ChartBlock } from "./chart-renderer";

export function stripThinkTags(text: string): string {
  return text.replace(/<think[^>]*>[\s\S]*?<\/think>/g, "").trim();
}

/* ─── Parser ─── */

export interface Block {
  type: "heading" | "code" | "table" | "list" | "paragraph";
  text: string;
  level?: number;
  lang?: string;
  items?: string[];
}

export function parseMarkdown(text: string): Block[] {
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

/* ─── Inline renderer ─── */

export function renderInline(text: string) {
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

/* ─── Image helper ─── */

function renderImages(text: string, agentId?: string): React.ReactNode | null {
  const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  let hasImage = false;

  while ((match = imgRegex.exec(text)) !== null) {
    hasImage = true;
    if (match.index > lastIdx) {
      parts.push(<span key={lastIdx}>{text.slice(lastIdx, match.index)}</span>);
    }
    const alt = match[1];
    const filename = match[2];
    const src = agentId
      ? `/api/agents/${agentId}/files/${encodeURIComponent(filename)}`
      : filename;
    parts.push(
      <img
        key={match.index}
        src={src}
        alt={alt}
        style={{ maxWidth: "100%", borderRadius: 8, margin: "8px 0" }}
      />
    );
    lastIdx = match.index + match[0].length;
  }
  if (!hasImage) return null;
  if (lastIdx < text.length) {
    parts.push(<span key={lastIdx}>{text.slice(lastIdx)}</span>);
  }
  return <>{parts}</>;
}

/* ─── Components ─── */

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

export function MarkdownText({ text, streaming, agentId }: { text: SanitizedText; streaming: boolean; agentId?: string }) {
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
          if (block.lang === "chart") {
            const chartConfig = parseChartConfig(block.text);
            if (chartConfig) return <ChartBlock key={i} config={chartConfig} />;
          }
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
        const imgContent = renderImages(block.text, agentId);
        if (imgContent) return <div key={i} className="my-1">{imgContent}</div>;
        return <p key={i} className="my-1">{renderInline(block.text)}</p>;
      })}
      {streaming && <span className="inline-block w-1.5 h-4 bg-gray-800 align-text-bottom animate-pulse ml-0.5" />}
    </>
  );
}
