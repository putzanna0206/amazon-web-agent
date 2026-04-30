import json
from mcp import ClientSession


class ToolExecutor:
    def __init__(self, session: ClientSession | None = None):
        self._session = session

    def parse_tool_name(self, raw_name: str) -> str:
        if raw_name.startswith("mcp__sorftime__"):
            return raw_name.removeprefix("mcp__sorftime__")
        return raw_name

    def is_sorftime_tool(self, tool_name: str) -> bool:
        return tool_name.startswith("mcp__sorftime__") or tool_name in {
            "keyword_detail", "keyword_trend", "keyword_extends",
            "keyword_list", "keyword_search_results",
            "product_detail", "product_reviews", "product_trend",
            "product_traffic_terms", "product_variations", "product_search",
            "category_report", "category_trend", "category_keywords",
            "category_tree", "similar_product_feature",
        }

    async def execute_tool(self, tool_name: str, arguments: dict) -> str:
        if not self._session:
            return json.dumps({"error": "MCP session not connected"}, ensure_ascii=False)

        parsed_name = self.parse_tool_name(tool_name)
        result = await self._session.call_tool(parsed_name, arguments)

        parts = []
        for content in result.content:
            if hasattr(content, "text"):
                parts.append(content.text)
        return "\n".join(parts) if parts else json.dumps({"result": "empty"}, ensure_ascii=False)
