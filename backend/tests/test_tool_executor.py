import pytest
from unittest.mock import AsyncMock, MagicMock
from app.tool_executor import ToolExecutor


@pytest.fixture
def executor():
    return ToolExecutor()


def test_parse_tool_name_with_prefix(executor):
    assert executor.parse_tool_name("mcp__sorftime__keyword_detail") == "keyword_detail"


def test_parse_tool_name_without_prefix(executor):
    assert executor.parse_tool_name("keyword_detail") == "keyword_detail"


def test_is_sorftime_tool(executor):
    assert executor.is_sorftime_tool("mcp__sorftime__keyword_detail") is True
    assert executor.is_sorftime_tool("keyword_detail") is True
    assert executor.is_sorftime_tool("product_reviews") is True
    assert executor.is_sorftime_tool("generate_report") is False


@pytest.mark.asyncio
async def test_execute_tool_no_session(executor):
    result = await executor.execute_tool("keyword_detail", {"keyword": "keyboard"})
    assert "error" in result


@pytest.mark.asyncio
async def test_execute_tool_with_mock_session(executor):
    mock_session = AsyncMock()
    mock_result = MagicMock()
    mock_result.content = [MagicMock(text='{"searchVolume": 10000}')]
    mock_session.call_tool = AsyncMock(return_value=mock_result)

    executor._session = mock_session
    result = await executor.execute_tool("mcp__sorftime__keyword_detail", {"keyword": "keyboard"})
    assert "searchVolume" in result
    mock_session.call_tool.assert_called_once_with("keyword_detail", {"keyword": "keyboard"})
