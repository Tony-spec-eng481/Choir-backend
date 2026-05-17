require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or PUBLISHABLE_KEY in environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Database helper functions
const getAllSongs = async () => {
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .order('number', { ascending: true });
  
  if (error) throw error;
  return data;
};

const getSongsSync = async (lastSync) => {
  let query = supabase.from('songs').select('*');
  
  if (lastSync) {
    query = query.gte('updated_at', lastSync);
  }
  
  const { data, error } = await query.order('number', { ascending: true });
  if (error) throw error;
  return data;
};

const addSong = async (number, title, lyrics, audioUrl) => {
  const { data, error } = await supabase
    .from('songs')
    .insert([
      { number: parseInt(number, 10), title, lyrics, audio_url: audioUrl }
    ])
    .select();
  
  if (error) throw error;
  return data[0];
};

const updateSong = async (id, number, title, lyrics, audioUrl) => {
  const updateData = { 
    number: parseInt(number, 10), 
    title, 
    lyrics, 
    updated_at: new Date().toISOString() 
  };
  
  if (audioUrl !== undefined) {
    updateData.audio_url = audioUrl;
  }
  
  const { data, error } = await supabase
    .from('songs')
    .update(updateData)
    .eq('id', id)
    .select();
    
  if (error) throw error;
  return data && data.length > 0;
};

const deleteSong = async (id) => {
  const { error } = await supabase
    .from('songs')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
  return true;
};

module.exports = {
  supabase,
  getAllSongs,
  getSongsSync,
  addSong,
  updateSong,
  deleteSong
};
