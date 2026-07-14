require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSongs() {
  const { data, error } = await supabase.from('songs').select('number, title, audio_url').limit(5);
  console.log("Error:", error);
  console.log("Songs:", data);
}

checkSongs();
