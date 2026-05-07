"use client";

import React from "react";
import {
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";

export type ChartType = "bar" | "line" | "pie" | "radar";

const COLORS = ["#4f46e5", "#06b6d4", "#f59e0b", "#ef4444", "#10b981", "#8b5cf6", "#f97316", "#6366f1"];

export interface BarLineConfig {
  type: "bar" | "line";
  title?: string;
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string | string[];
}

export interface PieConfig {
  type: "pie";
  title?: string;
  data: Record<string, unknown>[];
  nameKey: string;
  valueKey: string;
  donut?: boolean;
}

export interface RadarConfig {
  type: "radar";
  title?: string;
  data: Record<string, unknown>[];
  nameKey: string;
  valueKey: string | string[];
  radarKeys: string[];
}

export type ChartConfig = BarLineConfig | PieConfig | RadarConfig;

const VALID_TYPES: ChartType[] = ["bar", "line", "pie", "radar"];

export function parseChartConfig(text: string): ChartConfig | null {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;

  const obj = raw as Record<string, unknown>;
  if (typeof obj.type !== "string" || !VALID_TYPES.includes(obj.type as ChartType)) return null;
  if (!Array.isArray(obj.data)) return null;

  const type = obj.type as ChartType;
  const title = typeof obj.title === "string" ? obj.title : undefined;

  if (type === "bar" || type === "line") {
    if (typeof obj.xKey !== "string" || typeof obj.yKey === "undefined") return null;
    return { type, title, data: obj.data as Record<string, unknown>[], xKey: obj.xKey, yKey: obj.yKey as string | string[] };
  }

  if (type === "pie") {
    if (typeof obj.nameKey !== "string" || typeof obj.valueKey !== "string") return null;
    return { type, title, data: obj.data as Record<string, unknown>[], nameKey: obj.nameKey, valueKey: obj.valueKey, donut: obj.donut === true };
  }

  if (type === "radar") {
    if (typeof obj.nameKey !== "string" || !Array.isArray(obj.radarKeys)) return null;
    return { type, title, data: obj.data as Record<string, unknown>[], nameKey: obj.nameKey, valueKey: obj.valueKey as string | string[], radarKeys: obj.radarKeys as string[] };
  }

  return null;
}

/* ─── Renderers ─── */

function BarChartBlock({ config }: { config: BarLineConfig }) {
  const yKeys = Array.isArray(config.yKey) ? config.yKey : [config.yKey];
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={config.data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={config.xKey} tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        {yKeys.map((k, i) => (
          <Bar key={k} dataKey={k} fill={COLORS[i % COLORS.length]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

function LineChartBlock({ config }: { config: BarLineConfig }) {
  const yKeys = Array.isArray(config.yKey) ? config.yKey : [config.yKey];
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={config.data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={config.xKey} tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        {yKeys.map((k, i) => (
          <Line key={k} type="monotone" dataKey={k} stroke={COLORS[i % COLORS.length]} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

function PieChartBlock({ config }: { config: PieConfig }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={config.data}
          dataKey={config.valueKey}
          nameKey={config.nameKey}
          cx="50%"
          cy="50%"
          outerRadius={config.donut ? 80 : 120}
          innerRadius={config.donut ? 50 : 0}
          label
        >
          {config.data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

function RadarChartBlock({ config }: { config: RadarConfig }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={config.data}>
        <PolarGrid />
        <PolarAngleAxis dataKey={config.nameKey} tick={{ fontSize: 12 }} />
        {config.radarKeys.map((k, i) => (
          <Radar key={k} name={k} dataKey={k} stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.2} />
        ))}
        <Legend />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function ChartBlock({ config }: { config: ChartConfig }) {
  return (
    <div className="my-3 rounded-lg border border-gray-200 bg-white p-4">
      {config.title && <h4 className="text-sm font-semibold text-gray-800 mb-2">{config.title}</h4>}
      {config.type === "bar" && <BarChartBlock config={config} />}
      {config.type === "line" && <LineChartBlock config={config} />}
      {config.type === "pie" && <PieChartBlock config={config} />}
      {config.type === "radar" && <RadarChartBlock config={config} />}
    </div>
  );
}
