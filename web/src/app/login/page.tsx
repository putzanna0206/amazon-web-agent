"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      router.push("/chat");
    } catch {
      setError("用户名或密码错误");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f9fafb" }}>
      <div className="w-full max-w-sm p-8 bg-white rounded-xl shadow-sm border border-gray-200" style={{ width: "100%", maxWidth: "400px", padding: "32px", backgroundColor: "white", borderRadius: "12px", boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)", border: "1px solid #e5e7eb" }}>
        <div className="flex items-center justify-center gap-2 mb-6" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "24px" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ background: "var(--brand-primary)", width: "32px", height: "32px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "14px", fontWeight: "bold", backgroundColor: "#1e293b" }}>
            A
          </div>
          <h1 className="text-xl font-semibold text-gray-900" style={{ fontSize: "20px", fontWeight: "600", color: "#111827" }}>
            AmaWebAgent
          </h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label htmlFor="username" style={{ display: "block", fontSize: 16, fontWeight: 500, marginBottom: 6, color: "#374151" }}>用户名</label>
            <input
              id="username"
              type="text"
              placeholder="请输入用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "16px", outline: "none" }}
              required
            />
          </div>
          <div>
            <label htmlFor="password" style={{ display: "block", fontSize: 16, fontWeight: 500, marginBottom: 6, color: "#374151" }}>密码</label>
            <input
              id="password"
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "16px", outline: "none" }}
              required
            />
          </div>
          {error && (
            <div style={{ padding: "10px 14px", background: "#fef2f2", borderRadius: 8, fontSize: 16, color: "#dc2626", textAlign: "center" }}>{error}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: "12px 16px", backgroundColor: "#4f46e5", color: "white", fontSize: "16px", fontWeight: "600", border: "none", borderRadius: "8px", cursor: "pointer", opacity: loading ? 0.5 : 1, transition: "opacity 0.15s" }}
          >
            {loading ? "登录中..." : "登录"}
          </button>
        </form>
      </div>
    </div>
  );
}
