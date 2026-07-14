require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAudioUrls() {
  console.log("Clearing all audio_url in songs table...");
  const { error: clearError } = await supabase
    .from('songs')
    .update({ audio_url: null })
    .neq('id', 0); // Update all rows
    
  if (clearError) {
    console.error("Error clearing audio_url:", clearError);
    return;
  }
  console.log("Successfully cleared audio_url.");

  console.log("Fetching files from Hymns bucket...");
  const { data: files, error: filesError } = await supabase.storage.from('Hymns').list();
  
  if (filesError) {
    console.error("Error listing files:", filesError);
    return;
  }

  console.log(`Found ${files.length} files. Mapping to songs...`);

  let updatedCount = 0;
  for (const file of files) {
    if (file.name === '.emptyFolderPlaceholder') continue;
    
    // Extract number. Example: audio-1781350959729-302_Iganagwo_Ni_Kiria_Wi_Nakio.mp3
    const match = file.name.match(/-(\d+)_/);
    if (match && match[1]) {
      const number = parseInt(match[1], 10);
      const { data: publicUrlData } = supabase.storage.from('Hymns').getPublicUrl(file.name);
      const url = publicUrlData.publicUrl;

      // console.log(`Updating song number ${number} with url ${url}`);
      const { error: updateError } = await supabase
        .from('songs')
        .update({ audio_url: url })
        .eq('number', number);
        
      if (updateError) {
        console.error(`Error updating song ${number}:`, updateError);
      } else {
        updatedCount++;
      }
    } else {
      console.log(`Could not extract number from filename: ${file.name}`);
    }
  }

  console.log(`Finished updating. Successfully updated ${updatedCount} songs.`);
}

fixAudioUrls();
