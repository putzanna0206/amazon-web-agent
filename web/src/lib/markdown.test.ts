import { describe, it, expect } from "vitest";
import { parseMarkdown, stripThinkTags } from "./markdown";
import type { Block } from "./markdown";

describe("stripThinkTags", () => {
  it("removes think tags", () => {
    expect(stripThinkTags("hello<think>推理</think>world")).toBe("helloworld");
  });

  it("handles multi-line content", () => {
    expect(stripThinkTags("a<think>l1\nl2</think>b")).toBe("ab");
  });

  it("returns text unchanged when no think tags", () => {
    expect(stripThinkTags("plain text")).toBe("plain text");
  });

  it("handles empty think tags", () => {
    expect(stripThinkTags("before<think></think>after")).toBe("beforeafter");
  });
});

describe("parseMarkdown", () => {
  it("parses headings with levels", () => {
    const blocks = parseMarkdown("## H2\n### H3\n#### H4");
    expect(blocks).toEqual([
      { type: "heading", text: "H2", level: 2 },
      { type: "heading", text: "H3", level: 3 },
      { type: "heading", text: "H4", level: 4 },
    ]);
  });

  it("parses fenced code blocks with language", () => {
    const blocks = parseMarkdown("```js\nconsole.log(1)\nconsole.log(2)\n```");
    expect(blocks).toEqual([
      { type: "code", text: "console.log(1)\nconsole.log(2)", lang: "js" },
    ]);
  });

  it("parses code blocks without language", () => {
    const blocks = parseMarkdown("```\ncode\n```");
    expect(blocks).toEqual([{ type: "code", text: "code", lang: "" }]);
  });

  it("parses pipe tables", () => {
    const md = "| A | B |\n|---|---|\n| 1 | 2 |\n| 3 | 4 |";
    const blocks = parseMarkdown(md);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe("table");
    expect(blocks[0].text).toContain("A | B");
  });

  it("parses unordered lists", () => {
    const blocks = parseMarkdown("- item1\n- item2\n- item3");
    expect(blocks).toEqual([
      { type: "list", text: "", items: ["item1", "item2", "item3"] },
    ]);
  });

  it("parses asterisk lists", () => {
    const blocks = parseMarkdown("* one\n* two");
    expect(blocks).toEqual([
      { type: "list", text: "", items: ["one", "two"] },
    ]);
  });

  it("parses paragraphs", () => {
    const blocks = parseMarkdown("hello world\nsecond line");
    expect(blocks).toEqual([
      { type: "paragraph", text: "hello world\nsecond line" },
    ]);
  });

  it("skips blank lines", () => {
    const blocks = parseMarkdown("para1\n\npara2");
    expect(blocks).toEqual([
      { type: "paragraph", text: "para1" },
      { type: "paragraph", text: "para2" },
    ]);
  });

  it("handles mixed content in order", () => {
    const md = "## Title\n\nSome text\n\n- item1\n- item2\n\n```\ncode\n```";
    const blocks = parseMarkdown(md);
    const types = blocks.map((b) => b.type);
    expect(types).toEqual(["heading", "paragraph", "list", "code"]);
  });

  it("returns empty array for empty string", () => {
    expect(parseMarkdown("")).toEqual([]);
  });

  it("returns empty array for whitespace only", () => {
    expect(parseMarkdown("   \n  \n")).toEqual([]);
  });

  it("handles paragraph followed by heading", () => {
    const blocks = parseMarkdown("text\n## Heading");
    expect(blocks).toEqual([
      { type: "paragraph", text: "text" },
      { type: "heading", text: "Heading", level: 2 },
    ]);
  });
});
