import logging
import sys
from contextlib import asynccontextmanager

from app.config import settings
from app.routers import health
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 配置日志
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.DEBUG if settings.enable_debug else logging.INFO),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    logger.info(f"启动 {settings.app_name} v{settings.app_version}")
    logger.info(f"DEBUG: {settings.enable_debug}")
    
    yield  # 应用运行期间
    
    logger.info("应用已关闭")


# 创建 FastAPI 应用实例
app = FastAPI(
    title=f"{settings.app_name}",
    description="DooTask AI 智能体服务 - Python AI 微服务",
    version=settings.app_version,
    debug=settings.enable_debug,
    lifespan=lifespan
)

# 设置CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应该限制具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(health.router, tags=["健康检查"])

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0", 
        port=settings.python_ai_service_port,
        reload=settings.enable_debug,
        log_level=settings.log_level
    ) 