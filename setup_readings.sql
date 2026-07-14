-- Create the readings table
CREATE TABLE readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date TEXT NOT NULL,
    title TEXT,
    bible_verses TEXT,
    audio_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optional: Add Row Level Security (RLS) policies if you have them enabled for the songs table. 
-- By default, allowing public read access:
ALTER TABLE readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on readings" 
ON readings 
FOR SELECT 
USING (true);

-- (If using anon key for inserts from backend, allow inserts/updates. 
-- Usually backend uses service_role which bypasses RLS, but if using anon key, you need these):
CREATE POLICY "Allow all on readings" 
ON readings 
FOR ALL 
USING (true);

-- ==========================================
-- STORAGE BUCKET CREATION INSTRUCTIONS
-- ==========================================
-- 1. Go to Storage in your Supabase Dashboard.
-- 2. Click "New Bucket".
-- 3. Name it "Readings".
-- 4. Make it Public.
-- 5. Add a policy to allow public reads and inserts (similar to your Hymns bucket).
