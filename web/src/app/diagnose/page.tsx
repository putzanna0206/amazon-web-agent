"use client";

import { useEffect, useState } from "react";

export default function DiagnosePage() {
  const [info, setInfo] = useState({
    jsWorking: false,
    reactWorking: false,
    localStorageWorking: false,
    stylesWorking: false,
  });

  useEffect(() => {
    setInfo({
      jsWorking: true,
      reactWorking: true,
      localStorageWorking: (() => {
        try {
          localStorage.setItem("test", "test");
          localStorage.removeItem("test");
          return true;
        } catch {
          return false;
        }
      })(),
      stylesWorking: true, // If we see color, styles work
    });
  }, []);

  return (
    <div style={{
      padding: "20px",
      fontFamily: "system-ui, sans-serif",
      backgroundColor: "#f0f9ff",
      minHeight: "100vh"
    }}>
      <h1 style={{ color: "#0369a1", fontSize: "24px", marginBottom: "20px" }}>
        🔍 诊断页面
      </h1>

      <div style={{
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "8px",
        marginBottom: "20px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }}>
        <h2 style={{ fontSize: "18px", marginBottom: "15px" }}>系统状态检查</h2>
        <ul style={{ listStyle: "none", padding: 0 }}>
          <li style={{ marginBottom: "10px", fontSize: "16px" }}>
            {info.jsWorking ? "✅" : "❌"} JavaScript正在运行
          </li>
          <li style={{ marginBottom: "10px", fontSize: "16px" }}>
            {info.reactWorking ? "✅" : "❌"} React正在运行
          </li>
          <li style={{ marginBottom: "10px", fontSize: "16px" }}>
            {info.localStorageWorking ? "✅" : "❌"} LocalStorage可用
          </li>
          <li style={{ marginBottom: "10px", fontSize: "16px" }}>
            {info.stylesWorking ? "✅" : "❌"} CSS样式正在应用
          </li>
        </ul>
      </div>

      <div style={{
        backgroundColor: "#fef3c7",
        padding: "15px",
        borderRadius: "8px",
        marginBottom: "20px",
        border: "1px solid #f59e0b"
      }}>
        <h3 style={{ marginTop: 0, color: "#92400e" }}>📝 测试说明</h3>
        <p style={{ marginBottom: "10px" }}>
          如果你能看到蓝色的背景和黄色的提示框,说明基本的HTML/CSS/JavaScript都正常工作。
        </p>
        <p style={{ marginBottom: 0 }}>
          如果登录页面是空白的,可能是:
        </p>
        <ul style={{ marginBottom: 0 }}>
          <li>CSS文件加载失败</li>
          <li>JavaScript执行出错</li>
          <li>React组件渲染问题</li>
          <li>AuthProvider初始化问题</li>
        </ul>
      </div>

      <div style={{
        backgroundColor: "#dcfce7",
        padding: "15px",
        borderRadius: "8px",
        border: "1px solid #22c55e"
      }}>
        <h3 style={{ marginTop: 0, color: "#15803d" }}>🧪 测试建议</h3>
        <ol style={{ marginBottom: 0, paddingLeft: "20px" }}>
          <li>检查浏览器控制台是否有错误</li>
          <li>尝试访问 <a href="/login-raw" style={{ color: "#0369a1" }}>/login-raw</a> (无AuthProvider版本)</li>
          <li>尝试访问 <a href="/test-simple" style={{ color: "#0369a1" }}>/test-simple</a> (最简单版本)</li>
          <li>清除浏览器缓存后重试</li>
        </ol>
      </div>
    </div>
  );
}
