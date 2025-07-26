-- Description: 给ai_models表添加proxy_url字段
-- 添加代理地址字段到AI模型表

DO $$
BEGIN
    -- 检查proxy_url字段是否已经存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ai_models' AND column_name = 'proxy_url'
    ) THEN
        ALTER TABLE ai_models ADD COLUMN proxy_url VARCHAR(500);
    END IF;
END $$; 