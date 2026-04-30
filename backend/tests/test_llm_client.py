import pytest
from unittest.mock import AsyncMock, MagicMock, patch


def _make_chunk(content=None, tool_calls=None, finish_reason=None):
    chunk = MagicMock()
    chunk.choices = [MagicMock()]
    chunk.choices[0].delta.content = content
    chunk.choices[0].delta.tool_calls = tool_calls
    chunk.choices[0].finish_reason = finish_reason
    return chunk


def _make_tool_call(index, id=None, name=None, arguments=None):
    tc = MagicMock()
    tc.index = index
    tc.id = id
    tc.function = MagicMock()
    tc.function.name = name
    tc.function.arguments = arguments
    return tc


class AsyncStreamMock:
    def __init__(self, chunks):
        self._chunks = chunks

    def __aiter__(self):
        self._iter = iter(self._chunks)
        return self

    async def __anext__(self):
        try:
            return next(self._iter)
        except StopIteration:
            raise StopAsyncIteration


@pytest.fixture
def client():
    from app.llm_client import LLMClient
    return LLMClient(api_key="test-key", base_url="https://api.test.com/v1", model="test-model")


def test_init(client):
    assert client.model == "test-model"


async def test_chat_stream_text_only(client):
    chunks = [
        _make_chunk(content="hello"),
        _make_chunk(content=" world"),
        _make_chunk(finish_reason="stop"),
    ]

    with patch.object(client, "_client") as mock_client:
        mock_client.chat.completions.create = AsyncMock(
            return_value=AsyncStreamMock(chunks)
        )

        results = []
        async for event in client.chat_stream(messages=[]):
            results.append(event)

    text_events = [e for e in results if e["type"] == "text"]
    assert len(text_events) == 2
    assert text_events[0]["content"] == "hello"
    assert text_events[1]["content"] == " world"
    assert results[-1]["type"] == "done"


async def test_chat_stream_tool_call(client):
    tc_chunk = _make_chunk(
        tool_calls=[_make_tool_call(0, id="call_1", name="keyword_detail", arguments='{"keyword": "keyboard"}')],
        finish_reason="tool_calls",
    )

    with patch.object(client, "_client") as mock_client:
        mock_client.chat.completions.create = AsyncMock(
            return_value=AsyncStreamMock([tc_chunk])
        )

        results = []
        async for event in client.chat_stream(messages=[], tools=[{"type": "function", "function": {"name": "test"}}]):
            results.append(event)

    tool_events = [e for e in results if e["type"] == "tool_call"]
    assert len(tool_events) == 1
    assert tool_events[0]["name"] == "keyword_detail"
    assert tool_events[0]["id"] == "call_1"
    assert results[-1]["type"] == "done"


async def test_chat_stream_tool_call_accumulated(client):
    tc1 = _make_chunk(
        tool_calls=[_make_tool_call(0, id="call_1", name="keyword_detail", arguments='{"key')],
    )
    tc2 = _make_chunk(
        tool_calls=[_make_tool_call(0, arguments='word": "keyboard"}')],
        finish_reason="tool_calls",
    )

    with patch.object(client, "_client") as mock_client:
        mock_client.chat.completions.create = AsyncMock(
            return_value=AsyncStreamMock([tc1, tc2])
        )

        results = []
        async for event in client.chat_stream(messages=[]):
            results.append(event)

    tool_events = [e for e in results if e["type"] == "tool_call"]
    assert len(tool_events) == 1
    assert tool_events[0]["arguments"] == '{"keyword": "keyboard"}'
    assert results[-1]["type"] == "done"


async def test_chat_stream_done_always_emitted(client):
    chunks = [_make_chunk(finish_reason="stop")]

    with patch.object(client, "_client") as mock_client:
        mock_client.chat.completions.create = AsyncMock(
            return_value=AsyncStreamMock(chunks)
        )

        results = []
        async for event in client.chat_stream(messages=[]):
            results.append(event)

    assert results[-1]["type"] == "done"
