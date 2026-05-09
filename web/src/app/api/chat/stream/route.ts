import { NextRequest } from "next/server";

const FASTCLAW_BASE =
  process.env.FASTCLAW_BASE || "http://localhost:18953";

export async function POST(req: NextRequest) {
	// 优先处理JSON格式（FastClaw v0.34.1的FormData解析有bug）
	const contentType = req.headers.get("content-type") || "";
	let body: BodyInit | undefined;

	// 优先尝试JSON格式
	if (contentType.includes("application/json")) {
		try {
			const jsonData = await req.json();
			body = JSON.stringify(jsonData);
		} catch {
			return new Response(JSON.stringify({ error: "invalid JSON format" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}
	} else if (contentType.includes("multipart/form-data")) {
		// FormData格式有bug，不建议使用
		body = await req.blob() as BodyInit;
	} else {
		return new Response(JSON.stringify({ error: "unsupported content type" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const upstream = await fetch(`${FASTCLAW_BASE}/api/chat/stream`, {
		method: "POST",
		headers: {
			// 转发原始Content-Type
			"Content-Type": contentType || "application/json",
			cookie: req.headers.get("cookie") || "",
		},
		body,
	});

  if (!upstream.ok) {
    return new Response(JSON.stringify({ error: "upstream error" }), {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
