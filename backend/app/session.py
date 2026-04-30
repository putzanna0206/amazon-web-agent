import uuid
from dataclasses import dataclass, field


@dataclass
class Session:
    id: str
    messages: list[dict] = field(default_factory=list)
    loaded_skills: list[str] = field(default_factory=list)


class SessionManager:
    def __init__(self):
        self._sessions: dict[str, Session] = {}

    def create_session(self) -> str:
        sid = str(uuid.uuid4())
        self._sessions[sid] = Session(id=sid)
        return sid

    def get_session(self, session_id: str) -> Session | None:
        return self._sessions.get(session_id)

    def add_message(self, session_id: str, message: dict) -> None:
        session = self._sessions.get(session_id)
        if session:
            session.messages.append(message)

    def get_messages(self, session_id: str) -> list[dict]:
        session = self._sessions.get(session_id)
        return list(session.messages) if session else []

    def get_loaded_skills(self, session_id: str) -> list[str]:
        session = self._sessions.get(session_id)
        return list(session.loaded_skills) if session else []

    def add_loaded_skill(self, session_id: str, skill_name: str) -> None:
        session = self._sessions.get(session_id)
        if session and skill_name not in session.loaded_skills:
            session.loaded_skills.append(skill_name)

    def trim_history(self, session_id: str, max_messages: int = 50) -> None:
        session = self._sessions.get(session_id)
        if session and len(session.messages) > max_messages:
            session.messages = session.messages[-max_messages:]

    def create_session_with_id(self, session_id: str) -> str:
        if session_id not in self._sessions:
            self._sessions[session_id] = Session(id=session_id)
        return session_id
