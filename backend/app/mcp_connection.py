import logging
from mcp import ClientSession
from mcp.client.sse import sse_client
from app.config import settings

logger = logging.getLogger(__name__)

_session: ClientSession | None = None
_tools_cache: list[dict] | None = None


async def connect_sorftime() -> ClientSession | None:
    global _session, _tools_cache

    if not settings.sorftime_mcp_url:
        logger.warning("SORFTIME_MCP_URL not configured, tool execution disabled")
        return None

    try:
        transport_context = sse_client(settings.sorftime_mcp_url)
        read, write = await transport_context.__aenter__()

        _session = ClientSession(read, write)
        await _session.__aenter__()
        await _session.initialize()

        tools_result = await _session.list_tools()
        _tools_cache = [
            {
                "type": "function",
                "function": {
                    "name": f"mcp__sorftime__{t.name}",
                    "description": t.description or "",
                    "parameters": t.inputSchema,
                },
            }
            for t in tools_result.tools
        ]
        logger.info(f"Connected to Sorftime MCP, {len(_tools_cache)} tools loaded")
        return _session
    except Exception as e:
        logger.error(f"Failed to connect to Sorftime MCP: {e}")
        return None


def get_session() -> ClientSession | None:
    return _session


def get_tools() -> list[dict]:
    return _tools_cache or []
