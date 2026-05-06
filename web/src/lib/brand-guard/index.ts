// brand-guard：品牌防御的第三层（兜底层）。
// 文档：PROJECT.md《三、品牌保护系统 / 第三层：兜底层》。
//
// Seam 契约：任何要渲染给最终用户的 LLM 文本，必须先经 apply()，拿到 SanitizedText，
// 才能流入展示层。SanitizedText 是 branded type，TS 编译期阻止跳过本 Module。

import { RULE_GROUPS, LINE_RULES, allRules, type RuleGroupName } from "./rules";

declare const sanitizedTag: unique symbol;
export type SanitizedText = string & { readonly [sanitizedTag]: true };

export interface RuleHit {
  group: RuleGroupName | "lineRules";
  id: string;
  count: number;
}

function applyRules(text: string, track: false): string;
function applyRules(text: string, track: true): { output: string; hits: RuleHit[] };
function applyRules(text: string, track: boolean): string | { output: string; hits: RuleHit[] } {
  let result = text;
  const hits: RuleHit[] = [];

  for (const [groupName, rules] of Object.entries(RULE_GROUPS) as [RuleGroupName, readonly (readonly [RegExp, string, string])[]][]) {
    for (const [pattern, replacement, id] of rules) {
      if (track) {
        const matches = result.match(pattern);
        if (matches) hits.push({ group: groupName, id, count: matches.length });
      }
      result = result.replace(pattern, replacement);
    }
  }
  for (const [pattern, replacement, id] of LINE_RULES) {
    if (track) {
      const matches = result.match(pattern);
      if (matches) hits.push({ group: "lineRules", id, count: matches.length });
    }
    result = result.replace(pattern, replacement);
  }
  result = result.trim();

  return track ? { output: result, hits } : result;
}

export function apply(text: string): SanitizedText {
  return applyRules(text, false) as SanitizedText;
}

export function applyVerbose(text: string): { output: SanitizedText; hits: RuleHit[] } {
  const { output, hits } = applyRules(text, true);
  return { output: output as SanitizedText, hits };
}

// Escape hatch：当文本 *本来就* 不需要净化（如纯用户输入），仍想让它通过 SanitizedText 边界时使用。
// 调用方需自行确认安全。命名故意刺眼，code review 时显眼。
export function trustAsSanitized(text: string): SanitizedText {
  return text as SanitizedText;
}

export const ruleCount = allRules().length + LINE_RULES.length;
