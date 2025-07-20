-- Description: 创建知识库和文档表
-- 知识库相关表

-- 知识库表
CREATE TABLE IF NOT EXISTS knowledge_bases (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    embedding_model VARCHAR(100) DEFAULT 'text-embedding-ada-002',
    chunk_size INTEGER DEFAULT 1000,
    chunk_overlap INTEGER DEFAULT 200,
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 知识库文档表
CREATE TABLE IF NOT EXISTS kb_documents (
    id BIGSERIAL PRIMARY KEY,
    knowledge_base_id BIGINT REFERENCES knowledge_bases(id),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    file_path VARCHAR(500),
    file_type VARCHAR(50),
    file_size BIGINT,
    -- OpenAI embedding 维度
    embedding VECTOR(1536),
    metadata JSONB DEFAULT '{}',
    chunk_index INTEGER DEFAULT 0,
    parent_doc_id BIGINT REFERENCES kb_documents(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
); 