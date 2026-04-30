from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from app.chat import router as chat_router
from app import chat as chat_module
from app.mcp_connection import connect_sorftime, get_session
from app.tool_executor import ToolExecutor

tool_executor = ToolExecutor()


@asynccontextmanager
async def lifespan(app: FastAPI):
    mcp_session = await connect_sorftime()
    if mcp_session:
        tool_executor._session = mcp_session
    chat_module.tool_executor = tool_executor
    yield

app = FastAPI(title="Amazon Web Agent", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)

frontend_dir = Path(__file__).resolve().parent.parent.parent / "frontend"
if frontend_dir.is_dir():
    app.mount("/static", StaticFiles(directory=str(frontend_dir)), name="static")


@app.get("/health")
async def health():
    return {"status": "ok", "mcp_connected": get_session() is not None}
