-- ==========================================================
-- LINE認証への移行マイグレーション
-- Supabase SQL Editor で順番に実行してください
-- （既存のSupabase Auth user_idのデータは削除されます）
-- ==========================================================

-- 1. 既存データをクリア（自分の検証データのみ、失ってOK）
TRUNCATE TABLE articles CASCADE;
TRUNCATE TABLE audits CASCADE;
TRUNCATE TABLE seo_settings CASCADE;

-- 2. auth.users への外部キー制約を削除
ALTER TABLE articles DROP CONSTRAINT IF EXISTS articles_user_id_fkey;
ALTER TABLE audits DROP CONSTRAINT IF EXISTS audits_user_id_fkey;
ALTER TABLE seo_settings DROP CONSTRAINT IF EXISTS seo_settings_user_id_fkey;

-- 3. user_id カラムの型を uuid → text に変更（LINE User ID は "Uxxx..." 形式のtext）
ALTER TABLE articles ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE audits ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE seo_settings ALTER COLUMN user_id TYPE text USING user_id::text;

-- 4. RLS を無効化（LINE認証でゲートするため、Supabase Auth 側のRLSは使わない）
ALTER TABLE articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE audits DISABLE ROW LEVEL SECURITY;
ALTER TABLE seo_settings DISABLE ROW LEVEL SECURITY;

-- 5. 既存のRLSポリシーを削除（無効化時にもクリーンに）
DROP POLICY IF EXISTS "Users can view own articles" ON articles;
DROP POLICY IF EXISTS "Users can insert own articles" ON articles;
DROP POLICY IF EXISTS "Users can update own articles" ON articles;
DROP POLICY IF EXISTS "Users can delete own articles" ON articles;
DROP POLICY IF EXISTS "Users can view own audits" ON audits;
DROP POLICY IF EXISTS "Users can insert own audits" ON audits;
DROP POLICY IF EXISTS "Users can delete own audits" ON audits;
DROP POLICY IF EXISTS "Users can view own settings" ON seo_settings;
DROP POLICY IF EXISTS "Users can upsert own settings" ON seo_settings;
