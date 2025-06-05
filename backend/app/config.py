import os
try:
    # Try to import from pydantic_settings (newer approach)
    from pydantic_settings import BaseSettings
except ImportError:
    try:
        # Fall back to pydantic if pydantic_settings is not available
        from pydantic import BaseSettings
    except ImportError:
        raise ImportError("Neither 'pydantic_settings' nor 'pydantic' is installed. Please install one of them.")
        # As a fallback, define a dummy BaseSettings to avoid further errors
        class BaseSettings:
            pass
from dotenv import load_dotenv
from typing import List

# Load environment variables from .env file
load_dotenv()


class Settings(BaseSettings): # type: ignore
    # API settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Todo List Xtreme"
    
    # CORS settings
    @property
    def CORS_ORIGINS(self) -> List[str]:
        origins = os.getenv("CORS_ORIGINS", "http://localhost:3000")
        return origins.split(",")
    
    # Database settings
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "todolist")
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_SERVER}:{POSTGRES_PORT}/{POSTGRES_DB}"
    )
    
    # JWT settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretkey")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # S3 settings for photo storage
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")
    AWS_S3_BUCKET: str = os.getenv("AWS_S3_BUCKET", "todo-list-xtreme")
    
    # Google OAuth settings
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/auth/google/callback"
    FRONTEND_URL: str = "http://localhost:3000"


settings = Settings()
