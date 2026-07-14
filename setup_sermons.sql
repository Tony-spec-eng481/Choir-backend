-- Create the sermons table
CREATE TABLE sermons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date TEXT NOT NULL,
    title TEXT NOT NULL,
    scripture_reading TEXT,
    memory_verse TEXT,
    questions JSONB DEFAULT '[]'::jsonb,
    document_url TEXT,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optional: Add Row Level Security (RLS) policies if you have them enabled for the songs table. 
-- By default, allowing public read access:
ALTER TABLE sermons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on sermons" 
ON sermons 
FOR SELECT 
USING (true);

-- (If using anon key for inserts from backend, allow inserts/updates. 
-- Usually backend uses service_role which bypasses RLS, but if using anon key, you need these):
CREATE POLICY "Allow all on sermons" 
ON sermons 
FOR ALL 
USING (true);

-- Insert a dummy sermon for testing
INSERT INTO sermons (date, title, scripture_reading, memory_verse, questions, content)
VALUES (
    'July 14, 2026', 
    'The Grace of God', 
    'Ephesians 2:8-9', 
    'Ephesians 2:8', 
    '[{"question": "What is grace?", "bibleVerse": "Romans 11:6"}, {"question": "How do we receive it?", "bibleVerse": "John 1:16"}]', 
    'This is a typed sermon content.'
);

-- ==========================================
-- STORAGE BUCKET CREATION INSTRUCTIONS
-- ==========================================
-- 1. Go to Storage in your Supabase Dashboard.
-- 2. Click "New Bucket".
-- 3. Name it "Sermons".
-- 4. Make it Public.
-- 5. Add a policy to allow public reads and inserts (similar to your Hymns bucket).
