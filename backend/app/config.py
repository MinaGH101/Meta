from functools import lru_cache
from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Meta Holding API"
    environment: str = "development"
    # Internal FastAPI prefix. The public /api prefix is provided by the reverse proxy.
    api_prefix: str = "/v1"
    public_prefix: str = "/api"
    # SQLAdmin stays mounted internally at /admin so reverse proxies that strip
    # /api continue to work. Browsers should always use /api/admin.
    admin_internal_url: str = "/admin"
    admin_public_url: str = "/api/admin"
    # Kept for backwards-compatible environment files; no longer used for
    # constructing admin URLs because an empty/incorrect prefix caused routes
    # to escape to /admin on the public site.
    admin_public_prefix: str = ""
    database_url: str = "postgresql+psycopg://meta:meta@postgres:5432/meta"
    secret_key: str = Field(default="change-this-in-production-minimum-32-characters")
    access_token_minutes: int = 30
    refresh_token_days: int = 14
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    media_root: Path = Path("/app/media")
    media_url: str = "/media"
    max_upload_mb: int = 20
    admin_email: str = "admin@example.com"
    admin_phone: str = ""
    admin_password: str = "ChangeMe123!"
    admin_name: str = "مدیر متا"
    seed_initial_data: bool = True
    frontend_public_url: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
