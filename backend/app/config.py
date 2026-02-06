from functools import lru_cache
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    database_url: str = "postgresql+psycopg2://ent_user:ent_password@localhost:5432/ent_db"
    jwt_secret: str = "changeme"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 8
    cors_origins: str = "http://localhost:5173,http://localhost:5174"
    default_admin_email: str = "admin@example.com"
    default_admin_password: str = "ChangeMe123!"

    @field_validator("cors_origins")
    @classmethod
    def _normalize_origins(cls, value: str) -> str:
        return ",".join([origin.strip() for origin in value.split(",") if origin.strip()])

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()
