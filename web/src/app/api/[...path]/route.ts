import { NextRequest } from "next/server";

const FASTCLAW_BASE =
  process.env.FASTCLAW_BASE || "http://localhost:18953";

async function proxy(req: NextRequest, method: string) {
  const path = req.nextUrl.pathname.replace(/^\/api\/?/, "");
  const search = req.nextUrl.search;
  const target = `${FASTCLAW_BASE}/api/${path}${search}`;

  // Copy all headers except Content-Length which will be recalculated
  const headers: Record<string, string> = {
    cookie: req.headers.get("cookie") || "",
  };

  // Preserve Content-Type if present
  const contentType = req.headers.get("Content-Type");
  if (contentType) {
    headers["Content-Type"] = contentType;
  }

  // Get the request body using blob() to preserve FormData
  const body = method !== "GET" && method !== "HEAD"
    ? await req.blob()
    : undefined;

  const upstream = await fetch(target, { method, headers, body });

  const ct = upstream.headers.get("Content-Type") || "";

  // Block upstream HTML responses — they indicate the request fell through
  // to FastClaw's admin UI (e.g. /api/nonexistent), which would leak
  // branded HTML through our proxy.
  if (ct.includes("text/html")) {
    return new Response("Not Found", { status: 404 });
  }

  const resHeaders = new Headers();
  if (ct) resHeaders.set("Content-Type", ct);

  // Forward Set-Cookie headers from FastClaw
  const setCookie = upstream.headers.get("Set-Cookie");
  if (setCookie) {
    resHeaders.set("Set-Cookie", setCookie);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: resHeaders,
  });
}

export async function GET(req: NextRequest) {
  return proxy(req, "GET");
}
export async function POST(req: NextRequest) {
  return proxy(req, "POST");
}
export async function PUT(req: NextRequest) {
  return proxy(req, "PUT");
}
export async function DELETE(req: NextRequest) {
  return proxy(req, "DELETE");
}
