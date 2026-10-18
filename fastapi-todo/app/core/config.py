from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "FastAPI Todo"
    database_url: str  # required: app refuses to start without it
    cors_origins: List[str] = ["http://localhost:5173"]  # React dev server

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
