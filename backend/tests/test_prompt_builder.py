import pytest
from pathlib import Path
from app.prompt_builder import PromptBuilder


@pytest.fixture
def builder(tmp_path):
    agent_dir = tmp_path / "竞品与需求分析"
    agent_dir.mkdir()
    skills_dir = agent_dir / "skills"
    skills_dir.mkdir()

    (agent_dir / "SOUL.md").write_text("# 角色\n你是分析专家。\n\n## 路由\n| 关键词 | market-research |")

    market = skills_dir / "市场调研.md"
    market.write_text("# 市场调研\n\n## 执行步骤\n1. 查关键词\n2. 分析趋势")

    competitor = skills_dir / "竞品分析.md"
    competitor.write_text("# 竞品分析\n\n## 执行步骤\n1. 解析ASIN")

    return PromptBuilder(agent_dir)


def test_load_soul(builder):
    soul = builder.load_soul()
    assert "分析专家" in soul
    assert "路由" in soul


def test_load_skill(builder):
    skill = builder.load_skill("市场调研")
    assert "查关键词" in skill


def test_load_skill_not_found(builder):
    with pytest.raises(FileNotFoundError):
        builder.load_skill("不存在的skill")


def test_build_system_prompt_initial(builder):
    prompt = builder.build_system_prompt()
    assert "分析专家" in prompt
    assert "查关键词" not in prompt


def test_build_system_prompt_with_skill(builder):
    prompt = builder.build_system_prompt(loaded_skills=["市场调研"])
    assert "分析专家" in prompt
    assert "查关键词" in prompt


def test_build_system_prompt_multiple_skills(builder):
    prompt = builder.build_system_prompt(loaded_skills=["市场调研", "竞品分析"])
    assert "查关键词" in prompt
    assert "解析ASIN" in prompt
