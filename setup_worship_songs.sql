-- Create the worship_songs table
CREATE TABLE worship_songs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    number INTEGER NOT NULL,
    title TEXT NOT NULL,
    lyrics TEXT NOT NULL,
    audio_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE worship_songs ENABLE ROW LEVEL SECURITY;

-- Allow public read access on worship_songs
CREATE POLICY "Allow public read access on worship_songs" 
ON worship_songs 
FOR SELECT 
USING (true);

-- Allow all operations for the backend (using service role or public for easy setup matching readings/sermons)
CREATE POLICY "Allow all on worship_songs" 
ON worship_songs 
FOR ALL 
USING (true);

-- ==========================================
-- STORAGE BUCKET CREATION INSTRUCTIONS
-- ==========================================
-- 1. Go to Storage in your Supabase Dashboard.
-- 2. Click "New Bucket".
-- 3. Name it "WorshipSongs".
-- 4. Make it Public.
-- 5. Add a policy to allow public reads and inserts (similar to your Hymns/Sermons buckets).
