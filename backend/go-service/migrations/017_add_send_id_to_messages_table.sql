-- Description: 给messages表添加send_id字段
-- 添加SEND_ID字段到智能体表

DO $$
BEGIN
    -- messages 表
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='messages' AND column_name='send_id'
    ) THEN
        ALTER TABLE messages ADD COLUMN send_id BIGINT;
    END IF;
    -- messages send_id 索引
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'idx_ai_messages_send_id' AND n.nspname = 'public'
    ) THEN
        CREATE INDEX idx_ai_messages_send_id ON messages(send_id);
    END IF;
END $$;
