from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    minimax_api_key: str = ""
    minimax_base_url: str = "https://api.minimax.chat/v1"
    minimax_model: str = "MiniMax-M2.7"
    sorftime_mcp_url: str = ""
    agent_data_dir: str = "../../agents"

    model_config = {"env_file": ".env", "extra": "ignore"}

    @property
    def agent_base_path(self) -> Path:
        return Path(self.agent_data_dir)


settings = Settings()
