import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.config import settings
from app.prompt_builder import PromptBuilder
from app.session import SessionManager
from app.llm_client import LLMClient

router = APIRouter()

session_manager = SessionManager()
prompt_builder = PromptBuilder(settings.agent_base_path / "竞品与需求分析")
llm_client = LLMClient(
    api_key=settings.minimax_api_key,
    base_url=settings.minimax_base_url,
    model=settings.minimax_model,
)

# Will be set by main.py lifespan
tool_executor = None


class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None


@router.post("/api/chat")
async def chat(req: ChatRequest):
    sid = req.session_id or session_manager.create_session()
    if not session_manager.get_session(sid):
        session_manager.create_session_with_id(sid)

    session_manager.add_message(sid, {"role": "user", "content": req.message})

    return StreamingResponse(
        _stream_response(sid, req.message),
        media_type="text/event-stream",
        headers={"X-Session-Id": sid},
    )


async def _stream_response(session_id: str, user_message: str):
    skills = session_manager.get_loaded_skills(session_id)
    system_prompt = prompt_builder.build_system_prompt(loaded_skills=skills)

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(session_manager.get_messages(session_id))

    # Get tools from MCP if available
    tools = None

    accumulated_text = ""
    tool_calls_buffer: list[dict] = []

    async for event in llm_client.chat_stream(messages=messages, tools=tools):
        if event["type"] == "text":
            accumulated_text += event["content"]
            yield f"data: {json.dumps({'type': 'text', 'content': event['content']}, ensure_ascii=False)}\n\n"

        elif event["type"] == "tool_call":
            tool_calls_buffer.append(event)
            yield f"data: {json.dumps({'type': 'tool_call', 'name': event['name']}, ensure_ascii=False)}\n\n"

        elif event["type"] == "done":
            if accumulated_text:
                session_manager.add_message(session_id, {
                    "role": "assistant",
                    "content": accumulated_text,
                })

            if tool_calls_buffer and tool_executor:
                for tc in tool_calls_buffer:
                    try:
                        args = json.loads(tc["arguments"]) if tc["arguments"] else {}
                        result = await tool_executor.execute_tool(tc["name"], args)
                        tool_msg = json.dumps({
                            "type": "tool_result",
                            "name": tc["name"],
                            "result": result[:2000],
                        }, ensure_ascii=False)
                        yield f"data: {tool_msg}\n\n"

                        session_manager.add_message(session_id, {
                            "role": "tool",
                            "tool_call_id": tc["id"],
                            "content": result,
                        })
                    except Exception as e:
                        yield f"data: {json.dumps({'type': 'error', 'message': str(e)}, ensure_ascii=False)}\n\n"

            yield f"data: {json.dumps({'type': 'done', 'session_id': session_id}, ensure_ascii=False)}\n\n"
