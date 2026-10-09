from functools import lru_cache
from pathlib import Path
from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    app_name: str = "Student Presentation Voting"
    environment: str = "development"
    database_url: str = "sqlite:///./data/voting.db"
    secret_key: str = "development-only-change-me-32-characters"
    public_base_url: str = "http://localhost:8080"
    allowed_origins: str = "http://localhost:5173,http://localhost:8080"
    allowed_hosts: str = "localhost,127.0.0.1"
    admin_username: str | None = None
    admin_password: str | None = None
    token_lifetime_hours: int = 6
    auth_lifetime_hours: int = 12
    default_voting_duration: int = 60
    upload_max_bytes: int = 5_000_000
    asset_dir: str = "./data/assets"
    cleanup_interval_minutes: int = 15
    secure_cookies: bool = False

    @field_validator("secret_key")
    @classmethod
    def validate_secret(cls, value: str, info):
        if len(value) < 32:
            raise ValueError("SECRET_KEY must contain at least 32 characters")
        return value

    @model_validator(mode="after")
    def production_secrets(self):
        if self.environment.lower() == "production" and self.secret_key == "development-only-change-me-32-characters":
            raise ValueError("Production requires an explicit random SECRET_KEY")
        return self

    @property
    def origins(self) -> list[str]:
        return [x.strip() for x in self.allowed_origins.split(",") if x.strip()]

    @property
    def hosts(self) -> list[str]:
        return [x.strip() for x in self.allowed_hosts.split(",") if x.strip()]

    def ensure_paths(self) -> None:
        Path(self.asset_dir).mkdir(parents=True, exist_ok=True)
        if self.database_url.startswith("sqlite:///"):
            Path(self.database_url.removeprefix("sqlite:///")).parent.mkdir(parents=True, exist_ok=True)


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.ensure_paths()
    return settings

