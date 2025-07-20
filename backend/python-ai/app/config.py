
try:
    from pydantic_settings import BaseSettings
except ImportError:
    from pydantic import BaseSettings


class Settings(BaseSettings):
    """应用配置"""
    
    # 基础配置
    app_name: str = "DooTask AI Python Service"
    app_version: str = "1.0.0"
    
    # 服务端口
    python_ai_service_port: int = 8001

    # 数据库配置
    postgres_host: str = "127.0.0.1"
    postgres_port: int = 5432
    postgres_db: str = "dootask_ai"
    postgres_user: str = "dootask"
    postgres_password: str = "dootask123"
    postgres_sslmode: str = "disable"

    # Redis 配置
    redis_host: str = "127.0.0.1"
    redis_port: int = 6379
    redis_db: int = 0

    # 开发环境配置
    log_level: str = "info"
    enable_debug: bool = True
    
    class Config:
        # 从环境变量读取，转换为大写
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# 全局设置实例
settings = Settings() 