-- Chạy script này trong Supabase → SQL Editor

-- Bảng lưu tất cả dữ liệu dashboard
CREATE TABLE IF NOT EXISTS data_store (
  key         TEXT PRIMARY KEY,
  data        JSONB NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Chỉ manager mới được ghi, tất cả được đọc
ALTER TABLE data_store ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for all" ON data_store
  FOR SELECT USING (true);

CREATE POLICY "Allow write for service role" ON data_store
  FOR ALL USING (true);

-- Bảng weekly tasks (để thêm/sửa/xóa task)
CREATE TABLE IF NOT EXISTS weekly_tasks (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  category    TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'notstarted',
  progress    INTEGER NOT NULL DEFAULT 0,
  week_key    TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE weekly_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for service role" ON weekly_tasks FOR ALL USING (true);

-- Index để query nhanh theo tuần
CREATE INDEX IF NOT EXISTS idx_weekly_tasks_week_key ON weekly_tasks(week_key);

-- Bảng lịch sử đăng nhập
CREATE TABLE IF NOT EXISTS login_logs (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email    TEXT NOT NULL,
  logged_in_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE login_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for service role" ON login_logs FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_login_logs_email ON login_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_login_logs_time  ON login_logs(logged_in_at DESC);

-- Bảng lịch sử AI (nếu chưa có)
CREATE TABLE IF NOT EXISTS ai_history (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       TEXT NOT NULL,
  context_label TEXT NOT NULL,
  analysis      TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for service role" ON ai_history FOR ALL USING (true);
