import hashlib
import os
from typing import Any


def get_env_with_default(key: str, default_value: str) -> str:
    """获取环境变量，如果为空则返回默认值"""
    value = os.getenv(key)
    return value if value is not None and value != "" else default_value


def is_empty(value: Any) -> bool:
    """判断值是否为空"""
    if value is None:
        return True
    
    if isinstance(value, str):
        return value.strip() == ""
    
    if isinstance(value, (list, dict, tuple, set)):
        return len(value) == 0
    
    if isinstance(value, (int, float)):
        return value == 0
    
    if isinstance(value, bool):
        return not value
    
    return False


def is_not_empty(value: Any) -> bool:
    """判断值是否不为空"""
    return not is_empty(value)


def md5(text: str) -> str:
    """计算字符串的MD5值"""
    return hashlib.md5(text.encode('utf-8')).hexdigest()


def str_to_int(s: str, default: int = 0) -> int:
    """将字符串转换为整数"""
    try:
        return int(s)
    except (ValueError, TypeError):
        return default


def str_to_float(s: str, default: float = 0.0) -> float:
    """将字符串转换为浮点数"""
    try:
        return float(s)
    except (ValueError, TypeError):
        return default


def safe_get(data: dict, key: str, default: Any = None) -> Any:
    """安全获取字典值"""
    return data.get(key, default) 