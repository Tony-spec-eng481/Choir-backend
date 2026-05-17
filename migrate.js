require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: Missing SUPABASE_URL or PUBLISHABLE_KEY in environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log("Reading hymns.json...");
  const hymnsPath = path.join(__dirname, '../Choir-react/src/data/hymns.json');
  
  if (!fs.existsSync(hymnsPath)) {
    console.error(`Error: hymns.json not found at ${hymnsPath}`);
    process.exit(1);
  }
  
  const rawData = fs.readFileSync(hymnsPath, 'utf8');
  const hymns = JSON.parse(rawData);
  
  console.log(`Loaded ${hymns.length} total raw hymn entries.`);
  
  // Filter out placeholders (items with empty/whitespace titles)
  const validSongs = hymns.filter(h => h.title && h.title.trim() !== '');
  console.log(`Filtered down to ${validSongs.length} valid hymns (skipping empty placeholders).`);
  
  const formattedSongs = validSongs.map(h => ({
    number: parseInt(h.number, 10),
    title: h.title.trim(),
    lyrics: h.lyrics,
    audio_url: h.audioUrl || h.audio_url || null
  }));
  
  console.log("Clearing existing songs table in Supabase...");
  const { error: deleteError } = await supabase
    .from('songs')
    .delete()
    .neq('id', 0); // Delete all rows where id is not 0
    
  if (deleteError) {
    console.warn("Notice: Clear existing table failed (maybe table is empty). Continuing...", deleteError.message);
  } else {
    console.log("Existing songs cleared.");
  }
  
  console.log("Inserting hymns in batches of 50...");
  const batchSize = 50;
  for (let i = 0; i < formattedSongs.length; i += batchSize) {
    const batch = formattedSongs.slice(i, i + batchSize);
    console.log(`Uploading batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(formattedSongs.length / batchSize)} (${batch.length} songs)...`);
    
    const { error } = await supabase
      .from('songs')
      .insert(batch);
      
    if (error) {
      console.error(`Error uploading batch starting at index ${i}:`, error.message);
      process.exit(1);
    }
  }
  
  console.log("🎉 Migration completed successfully! All songs are now in your Supabase database.");
}

runMigration().catch(err => {
  console.error("Migration failed with error:", err);
});
