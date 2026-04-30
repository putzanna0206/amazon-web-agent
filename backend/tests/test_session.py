import pytest
from app.session import SessionManager


@pytest.fixture
def manager():
    return SessionManager()


def test_create_session(manager):
    sid = manager.create_session()
    assert sid is not None
    assert isinstance(sid, str)


def test_get_session_not_found(manager):
    assert manager.get_session("nonexistent") is None


def test_add_and_get_messages(manager):
    sid = manager.create_session()
    manager.add_message(sid, {"role": "user", "content": "hello"})
    manager.add_message(sid, {"role": "assistant", "content": "hi"})
    msgs = manager.get_messages(sid)
    assert len(msgs) == 2
    assert msgs[0]["role"] == "user"
    assert msgs[1]["role"] == "assistant"


def test_get_loaded_skills_default_empty(manager):
    sid = manager.create_session()
    assert manager.get_loaded_skills(sid) == []


def test_add_loaded_skill(manager):
    sid = manager.create_session()
    manager.add_loaded_skill(sid, "market-research")
    assert manager.get_loaded_skills(sid) == ["market-research"]


def test_add_loaded_skill_no_duplicate(manager):
    sid = manager.create_session()
    manager.add_loaded_skill(sid, "market-research")
    manager.add_loaded_skill(sid, "market-research")
    assert manager.get_loaded_skills(sid) == ["market-research"]


def test_trim_history(manager):
    sid = manager.create_session()
    for i in range(100):
        manager.add_message(sid, {"role": "user", "content": f"msg {i}"})
    manager.trim_history(sid, max_messages=20)
    msgs = manager.get_messages(sid)
    assert len(msgs) == 20
    assert msgs[0]["content"] == "msg 80"


def test_create_session_with_id(manager):
    sid = manager.create_session_with_id("custom-id")
    assert sid == "custom-id"
    assert manager.get_session("custom-id") is not None

    # Calling again with same id should not create duplicate
    sid2 = manager.create_session_with_id("custom-id")
    assert sid2 == "custom-id"
