import pytest
from pathlib import Path
from app.session import SessionManager
from app.prompt_builder import PromptBuilder


@pytest.fixture
def pipeline(tmp_path):
    agent_dir = tmp_path / "竞品与需求分析"
    agent_dir.mkdir()
    skills = agent_dir / "skills"
    skills.mkdir()
    (agent_dir / "SOUL.md").write_text("# 角色\n你是分析专家。")
    (skills / "市场调研.md").write_text("# 市场调研\n查关键词")
    (skills / "竞品分析.md").write_text("# 竞品分析\n解析ASIN")

    builder = PromptBuilder(agent_dir)
    sessions = SessionManager()
    return builder, sessions


def test_pipeline_initial_prompt(pipeline):
    builder, sessions = pipeline
    sid = sessions.create_session()

    system_prompt = builder.build_system_prompt()
    sessions.add_message(sid, {"role": "user", "content": "帮我分析 keyboard"})

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(sessions.get_messages(sid))

    assert len(messages) == 2
    assert messages[0]["role"] == "system"
    assert "分析专家" in messages[0]["content"]
    assert messages[1]["content"] == "帮我分析 keyboard"


def test_pipeline_with_skill_loading(pipeline):
    builder, sessions = pipeline
    sid = sessions.create_session()

    sessions.add_message(sid, {"role": "user", "content": "keyboard"})
    sessions.add_loaded_skill(sid, "market-research")

    system_prompt = builder.build_system_prompt(
        loaded_skills=sessions.get_loaded_skills(sid)
    )

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(sessions.get_messages(sid))

    assert "查关键词" in messages[0]["content"]


def test_pipeline_multiple_skills(pipeline):
    builder, sessions = pipeline
    sid = sessions.create_session()

    sessions.add_loaded_skill(sid, "market-research")
    sessions.add_loaded_skill(sid, "competitor-analysis")

    system_prompt = builder.build_system_prompt(
        loaded_skills=sessions.get_loaded_skills(sid)
    )

    assert "查关键词" in system_prompt
    assert "解析ASIN" in system_prompt


def test_pipeline_conversation_history(pipeline):
    builder, sessions = pipeline
    sid = sessions.create_session()

    sessions.add_message(sid, {"role": "user", "content": "分析 keyboard"})
    sessions.add_message(sid, {"role": "assistant", "content": "好的，我来分析"})
    sessions.add_message(sid, {"role": "user", "content": "重点关注价格带"})

    messages = sessions.get_messages(sid)
    assert len(messages) == 3
    assert messages[2]["content"] == "重点关注价格带"


def test_pipeline_history_trimming(pipeline):
    builder, sessions = pipeline
    sid = sessions.create_session()

    for i in range(50):
        sessions.add_message(sid, {"role": "user", "content": f"msg {i}"})

    sessions.trim_history(sid, max_messages=10)
    messages = sessions.get_messages(sid)
    assert len(messages) == 10
    assert messages[0]["content"] == "msg 40"


def test_pipeline_session_isolation(pipeline):
    builder, sessions = pipeline
    sid1 = sessions.create_session()
    sid2 = sessions.create_session()

    sessions.add_message(sid1, {"role": "user", "content": "session 1"})
    sessions.add_message(sid2, {"role": "user", "content": "session 2"})

    assert sessions.get_messages(sid1)[0]["content"] == "session 1"
    assert sessions.get_messages(sid2)[0]["content"] == "session 2"


def test_pipeline_skill_not_shared_across_sessions(pipeline):
    builder, sessions = pipeline
    sid1 = sessions.create_session()
    sid2 = sessions.create_session()

    sessions.add_loaded_skill(sid1, "market-research")

    assert sessions.get_loaded_skills(sid1) == ["market-research"]
    assert sessions.get_loaded_skills(sid2) == []
