"use client";

import { useState } from "react";

export default function RawLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`用户名: ${username}, 密码: ${password}`);
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#f9fafb"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "400px",
        padding: "32px",
        backgroundColor: "white",
        borderRadius: "12px",
        boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
        border: "1px solid #e5e7eb"
      }}>
        <h1 style={{
          textAlign: "center",
          marginBottom: "24px",
          fontSize: "20px",
          fontWeight: "600",
          color: "#111827"
        }}>
          测试登录页面 (无AuthProvider)
        </h1>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <input
              type="text"
              placeholder="用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px"
              }}
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px"
              }}
              required
            />
          </div>
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "8px 16px",
              backgroundColor: "#4f46e5",
              color: "white",
              fontSize: "14px",
              fontWeight: "500",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer"
            }}
          >
            登录
          </button>
        </form>
        <p style={{
          textAlign: "center",
          marginTop: "16px",
          fontSize: "12px",
          color: "#6b7280"
        }}>
          如果能看到这个页面,说明是AuthProvider的问题
        </p>
      </div>
    </div>
  );
}
