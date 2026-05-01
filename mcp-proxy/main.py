"""MCP Streamable HTTP proxy — injects Accept header and normalizes SSE responses."""

import asyncio
import json
import httpx
from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import StreamingResponse, Response
from starlette.routing import Route

SORFTIME_URL = "https://mcp.sorftime.com"
LISTEN_PORT = 18954


async def _read_sse_json(resp: httpx.Response) -> bytes:
    """Read first SSE event and extract the JSON data payload."""
    buffer = ""
    async for chunk in resp.aiter_text():
        buffer += chunk
        for line in buffer.split("\n"):
            line = line.strip()
            if line.startswith("data: "):
                return line[6:].encode()
    return b""


async def proxy(request: Request) -> Response:
    url = f"{SORFTIME_URL}{request.url.path}"
    if request.url.query:
        url += f"?{request.url.query}"

    headers = dict(request.headers)
    headers["accept"] = "application/json, text/event-stream"
    headers.pop("host", None)
    headers.pop("content-length", None)

    body = await request.body()
    client = request.app.state.httpx_client
    upstream = client.build_request(
        method=request.method, url=url, headers=headers, content=body,
    )
    resp = await client.send(upstream, stream=True)

    content_type = resp.headers.get("content-type", "")

    # SSE response — extract JSON from first event
    if "text/event-stream" in content_type:
        # Peek at body to decide: single response or stream
        chunks: list[bytes] = []
        collected_text = ""
        async for chunk in resp.aiter_raw():
            chunks.append(chunk)
            collected_text += chunk.decode(errors="replace")
            # Check if we have a complete SSE event
            if "\n\n" in collected_text:
                break

        await resp.aclose()

        # Single event with data — return as JSON
        for line in collected_text.split("\n"):
            line = line.strip()
            if line.startswith("data: "):
                data = line[6:]
                # Validate it's JSON
                try:
                    json.loads(data)
                    return Response(
                        content=data.encode(),
                        status_code=200,
                        headers={"content-type": "application/json"},
                    )
                except json.JSONDecodeError:
                    pass

        # If we couldn't parse, stream what we have
        async def combined():
            for c in chunks:
                yield c

        return StreamingResponse(
            combined(),
            status_code=resp.status_code,
            headers={"content-type": content_type},
        )

    # JSON response — pass through
    body_bytes = await resp.aread()
    return Response(
        content=body_bytes,
        status_code=resp.status_code,
        headers={"content-type": content_type},
    )


app = Starlette(
    routes=[Route("/{path:path}", proxy, methods=["GET", "POST", "DELETE"])],
    on_startup=[
        lambda: setattr(
            app.state,
            "httpx_client",
            httpx.AsyncClient(timeout=httpx.Timeout(120.0, connect=10.0)),
        )
    ],
    on_shutdown=[
        lambda: asyncio.ensure_future(app.state.httpx_client.aclose()),
    ],
)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=LISTEN_PORT)
