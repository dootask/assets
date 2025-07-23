-- Description: 给agents表添加bot_id字段
-- 添加机器人ID字段到智能体表

DO $$
BEGIN
    -- 检查bot_id字段是否已经存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agents' AND column_name = 'bot_id'
    ) THEN
        ALTER TABLE agents ADD COLUMN bot_id BIGINT DEFAULT 0;
    END IF;
END $$; 