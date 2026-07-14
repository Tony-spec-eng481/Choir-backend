require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkNumbers() {
  const numbersToCheck = [302, 303, 281, 304, 301, 300, 299, 298, 297, 296];
  const { data, error } = await supabase
    .from('songs')
    .select('number, title, audio_url')
    .in('number', numbersToCheck);
    
  console.log("Error:", error);
  console.log("Matched Songs:", data);
}

checkNumbers();
