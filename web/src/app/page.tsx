"use client";

import { useRouter } from "next/navigation";

const CAPABILITIES = [
  {
    icon: "📊",
    title: "市场调研",
    desc: "关键词/品类 → 搜索量、趋势、价格带、品牌格局",
  },
  {
    icon: "🔍",
    title: "竞品分析",
    desc: "ASIN/链接 → 产品对比、评论、痛点",
  },
  {
    icon: "👥",
    title: "用户需求",
    desc: "用户行为/评价 → 使用场景、效用层级、价值演算",
  },
  {
    icon: "💰",
    title: "交易优化",
    desc: "定价/转化/成本 → 交易成本诊断、定价策略",
  },
];

function isLoggedIn() {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("fc_user");
}

export default function LandingPage() {
  const router = useRouter();

  const handleCTA = () => {
    if (isLoggedIn()) {
      router.push("/chat");
    } else {
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--brand-bg)]">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
              style={{ background: "var(--brand-primary)" }}
            >
              A
            </div>
            <span className="font-semibold text-gray-900">AmaWebAgent</span>
          </div>
          <button
            onClick={handleCTA}
            className="text-sm font-medium px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
            style={{ background: "var(--brand-accent)", color: "white" }}
          >
            进入 Agent →
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
            一句话出一份亚马逊调研报告
          </h1>
          <p className="text-lg text-gray-500 mb-10">
            市场 / 竞品 / 用户 / 交易，全程对话即可
          </p>
          <button
            onClick={handleCTA}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white font-medium text-lg transition-opacity hover:opacity-85"
            style={{ background: "var(--brand-accent)" }}
          >
            开始分析 →
          </button>
        </div>
      </section>

      {/* Capability cards */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-2 gap-4">
          {CAPABILITIES.map((c) => (
            <div
              key={c.title}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 transition-colors"
            >
              <div className="text-2xl mb-3">{c.icon}</div>
              <div className="font-semibold text-gray-900 mb-1">{c.title}</div>
              <div className="text-sm text-gray-500 leading-relaxed">{c.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-6 text-center">
        <p className="text-sm text-gray-400">
          本工具免费开放 · 由 Mac Mini 自托管
        </p>
      </footer>
    </div>
  );
}
