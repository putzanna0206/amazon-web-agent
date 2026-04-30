from pathlib import Path


SKILL_NAME_MAP = {
    "market-research": "市场调研",
    "competitor-analysis": "竞品分析",
    "user-model": "用户模型",
    "trade-model": "交易模型",
}


class PromptBuilder:
    def __init__(self, agent_dir: Path):
        self.agent_dir = agent_dir
        self.soul_path = agent_dir / "SOUL.md"
        self.skills_dir = agent_dir / "skills"

    def load_soul(self) -> str:
        return self.soul_path.read_text(encoding="utf-8")

    def load_skill(self, skill_name: str) -> str:
        cn_name = SKILL_NAME_MAP.get(skill_name, skill_name)
        skill_path = self.skills_dir / f"{cn_name}.md"
        if not skill_path.exists():
            raise FileNotFoundError(f"Skill not found: {skill_path}")
        return skill_path.read_text(encoding="utf-8")

    def build_system_prompt(self, loaded_skills: list[str] | None = None) -> str:
        parts = [self.load_soul()]

        if loaded_skills:
            parts.append("\n\n---\n\n# 已加载的分析模块\n")
            for skill_id in loaded_skills:
                try:
                    skill_content = self.load_skill(skill_id)
                    parts.append(f"\n\n{skill_content}")
                except FileNotFoundError:
                    pass

        return "".join(parts)
