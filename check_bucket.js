require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: files, error } = await supabase.storage.from('Hymns').list();
  if (error) {
    console.error("Error listing files:", error);
    return;
  }
  console.log(`Found ${files.length} files in Hymns bucket.`);
  console.log(files.slice(0, 10)); // print first 10
}
check();
