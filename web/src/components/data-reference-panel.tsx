"use client";

const DATA_CATEGORIES = [
  {
    title: "关键词类",
    items: ["月搜索量、搜索排名", "CPC（广告点击成本）", "24 个月搜索趋势", "拓展词 / 相关词", "搜索结果头部产品"],
  },
  {
    title: "产品类",
    items: ["产品详情（价格/评分/销量）", "用户评论（好评/差评）", "产品销量趋势", "流量来源关键词", "产品变体"],
  },
  {
    title: "品类类",
    items: ["品类报告（Top 产品/品牌）", "品类趋势", "品类关键词"],
  },
];

const EXAMPLES = [
  { label: "bluetooth speaker 搜索量多少", keyword: "搜索量" },
  { label: "B0D1QFXM7K 这个产品怎么样", keyword: "怎么样" },
  { label: "foldable keyboard 价格带分布", keyword: "价格带" },
  { label: "electric toothbrush 差评痛点", keyword: "差评" },
];

interface DataReferencePanelProps {
  visible: boolean;
  onToggle?: () => void;
}

export function DataReferencePanel({ visible }: DataReferencePanelProps) {
  return (
    <aside
      style={{
        width: visible ? 220 : 0,
        flexShrink: 0,
        overflow: "hidden",
        transition: "width 0.2s ease",
        borderLeft: visible ? "1px solid var(--color-border)" : "none",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {visible && (
        <>
          <div style={{ padding: "16px 14px", flexShrink: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", padding: "4px 0", display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
              可查询数据
            </div>
          </div>

          <div style={{ flex: 1, overflow: "auto", padding: "0 14px 16px" }}>
            {DATA_CATEGORIES.map((cat) => (
              <div key={cat.title} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", marginBottom: 4 }}>{cat.title}</div>
                {cat.items.map((item) => (
                  <div key={item} style={{ fontSize: 12, color: "var(--color-text-secondary)", lineHeight: "20px", paddingLeft: 6 }}>
                    · {item}
                  </div>
                ))}
              </div>
            ))}

            <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 10, marginTop: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", marginBottom: 6 }}>快速查询示例</div>
              {EXAMPLES.map((ex) => (
                <div
                  key={ex.label}
                  style={{
                    fontSize: 11,
                    color: "var(--brand-accent)",
                    lineHeight: "18px",
                    cursor: "default",
                    marginBottom: 2,
                  }}
                >
                  {ex.label}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </aside>
  );
}
