from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
  app_name: str = "FastAPI Todo"
  database_url: str = # TODO: Use My NEON DB Postgress sql using env
  
  model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")