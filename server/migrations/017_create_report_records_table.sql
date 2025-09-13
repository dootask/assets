-- 创建报表记录表
CREATE TABLE IF NOT EXISTS report_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_name VARCHAR(200) NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    file_path VARCHAR(500),
    file_size BIGINT,
    file_format VARCHAR(10) DEFAULT 'xlsx',
    generated_by VARCHAR(100),
    parameters TEXT,
    download_count INTEGER DEFAULT 0,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_report_records_type ON report_records(report_type);
CREATE INDEX IF NOT EXISTS idx_report_records_created_at ON report_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_records_generated_by ON report_records(generated_by);

-- 清理过期报表记录的触发器
CREATE TRIGGER IF NOT EXISTS cleanup_expired_reports
AFTER INSERT ON report_records
WHEN NEW.expires_at IS NOT NULL AND NEW.expires_at < CURRENT_TIMESTAMP
BEGIN
    DELETE FROM report_records WHERE id = NEW.id;
END;
