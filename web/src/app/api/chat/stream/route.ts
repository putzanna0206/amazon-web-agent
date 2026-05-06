import { NextRequest } from "next/server";

const FASTCLAW_BASE =
  process.env.FASTCLAW_BASE || "http://localhost:18953";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const upstream = await fetch(`${FASTCLAW_BASE}/api/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: req.headers.get("cookie") || "",
    },
    body: JSON.stringify(body),
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
