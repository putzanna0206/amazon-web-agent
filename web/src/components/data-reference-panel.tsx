"use client";

import { useState } from "react";

interface DataReferencePanelProps {
  visible: boolean;
  onToggle?: () => void;
  onSelectCommand?: (text: string) => void;
}

interface Section {
  title: string;
  items: string[];
}

const DATA_SECTIONS: Section[] = [
  {
    title: "关键词类",
    items: ["月搜索量、搜索排名", "CPC（广告点击成本）", "24 个月搜索趋势", "拓展词 / 相关词", "搜索结果头部产品"],
  },
  {
    title: "产品类",
    items: ["产品详情（价格/评分/销量/BSR）", "用户评论（好评/差评关键词）", "产品销量趋势", "流量来源关键词", "产品变体（颜色/规格）"],
  },
  {
    title: "品类类",
    items: ["品类报告（Top 产品/品牌）", "品类趋势", "品类关键词", "品类结构（子类目树）"],
  },
];

const SKILL_COMMANDS: { skill: string; commands: string[] }[] = [
  {
    skill: "市场调研",
    commands: [
      "分析「bluetooth speaker」市场：搜索量、价格带、品牌格局",
      "「wireless earbuds」搜索趋势怎么样",
      "「yoga mat」头部产品价格带分布",
      "「protein powder」拓展词和细分方向",
      "「air fryer」品类整体报告",
    ],
  },
  {
    skill: "竞品分析",
    commands: [
      "对比分析竞品「B0D1QFXM7K, B0BZJTGRZG」",
      "「B0CKQLY8LS」的差评痛点",
      "「B0D1QFXM7K」流量来源关键词",
      "「B0CKQLY8LS」变体策略分析",
      "「B0D1QFXM7K」销量趋势",
    ],
  },
  {
    skill: "用户需求",
    commands: [
      "分析「electric toothbrush」用户需求：场景、痛点、效用层级",
      "「baby monitor」用户最常抱怨什么",
      "「air fryer」买家使用场景和购买动机",
      "「robot vacuum」用户核心需求和价值演算",
    ],
  },
  {
    skill: "选品评估",
    commands: [
      "评估「bluetooth speaker」值不值得做",
      "「B0D1QFXM7K」这个产品的市场还有机会吗",
      "「portable power station」进入难度",
      "「foldable keyboard」竞争壁垒和差异化机会",
    ],
  },
];

const QUICK_EXAMPLES = [
  "「bluetooth speaker」搜索量多少",
  "「B0D1QFXM7K」产品详情",
  "「foldable keyboard」价格带分布",
  "「electric toothbrush」差评痛点",
  "「protein powder」CPC 多少",
  "「yoga mat」搜索趋势",
  "「robot vacuum」拓展词",
  "「B0CKQLY8LS」BSR 排名",
];

function CollapsibleSection({ title, items, defaultOpen, onItemClick }: { title: string; items: string[]; defaultOpen?: boolean; onItemClick?: (item: string) => void }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div style={{ marginBottom: 10 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", gap: 6, width: "100%",
          background: "none", border: "none", cursor: "pointer", padding: "4px 0",
          fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)",
          textAlign: "left" as const,
        }}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s", flexShrink: 0 }}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
        {title}
        <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--color-text-muted)" }}>{items.length}</span>
      </button>
      {open && (
        <div style={{ paddingLeft: 16, marginTop: 2 }}>
          {items.map((item) => (
            <div
              key={item}
              onClick={onItemClick ? () => onItemClick(item) : undefined}
              style={{
                fontSize: 11,
                color: onItemClick ? "var(--brand-accent)" : "var(--color-text-secondary)",
                lineHeight: "18px",
                cursor: onItemClick ? "pointer" : "default",
                borderRadius: onItemClick ? 4 : 0,
                padding: onItemClick ? "2px 4px" : 0,
                margin: onItemClick ? "1px -4px" : 0,
              }}
              onMouseEnter={(e) => { if (onItemClick) e.currentTarget.style.background = "rgba(79,70,229,0.06)"; }}
              onMouseLeave={(e) => { if (onItemClick) e.currentTarget.style.background = "none"; }}
            >
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function DataReferencePanel({ visible, onSelectCommand }: DataReferencePanelProps) {
  if (!visible) return null;

  return (
    <aside
      style={{
        width: 240,
        flexShrink: 0,
        borderLeft: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "14px 14px 8px", flexShrink: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text)" }}>
          数据与指令参考
        </div>
        <div style={{ fontSize: 10, color: "var(--color-text-muted)", marginTop: 2 }}>
          点击展开查看详细指令
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "0 14px 16px" }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: "var(--color-text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
          可查询数据
        </div>
        {DATA_SECTIONS.map((sec) => (
          <CollapsibleSection key={sec.title} title={sec.title} items={sec.items} />
        ))}

        <div style={{ borderTop: "1px solid var(--color-border)", marginTop: 8, paddingTop: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--color-text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
            分析模版指令
          </div>
          {SKILL_COMMANDS.map((sc) => (
            <CollapsibleSection key={sc.skill} title={sc.skill} items={sc.commands} onItemClick={onSelectCommand} />
          ))}
        </div>

        <div style={{ borderTop: "1px solid var(--color-border)", marginTop: 8, paddingTop: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--color-text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
            快速查询
          </div>
          <CollapsibleSection title="快速查询示例" items={QUICK_EXAMPLES} defaultOpen={true} onItemClick={onSelectCommand} />
        </div>
      </div>
    </aside>
  );
}
