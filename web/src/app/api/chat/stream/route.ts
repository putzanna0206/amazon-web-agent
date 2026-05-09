import { NextRequest } from "next/server";

const FASTCLAW_BASE =
  process.env.FASTCLAW_BASE || "http://localhost:18953";

export async function POST(req: NextRequest) {
	// 支持FormData请求（前端发送方式）
	const contentType = req.headers.get("content-type") || "";
	let body: BodyInit | undefined;

	if (contentType.includes("multipart/form-data")) {
		// 前端发送FormData
		body = await req.blob() as BodyInit;
	} else {
		// 其他情况尝试JSON
		try {
			const jsonData = await req.json();
			body = JSON.stringify(jsonData);
		} catch {
			return new Response(JSON.stringify({ error: "invalid request format" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}
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
