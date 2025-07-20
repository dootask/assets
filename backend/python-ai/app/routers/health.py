from datetime import datetime

from app.config import settings
from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check():
    """基础健康检查接口"""
    
    health_status = {
        "success": True,
        "data": {
            "status": "healthy",
            "service": "python-service",
            "timestamp": datetime.now().isoformat(),
            "app_name": settings.app_name,
            "app_version": settings.app_version,
            "log_level": settings.log_level,
            "enable_debug": settings.enable_debug,
            "message": "服务运行正常"
        }
    }
    
    return health_status