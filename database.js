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

// --- SERMONS ---

const getAllSermons = async () => {
  const { data, error } = await supabase
    .from('sermons')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

const getSermonsSync = async (lastSync) => {
  let query = supabase.from('sermons').select('*');
  
  if (lastSync) {
    query = query.gte('updated_at', lastSync);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

const addSermon = async (date, title, scriptureReading, memoryVerse, questions, documentUrl, content) => {
  const { data, error } = await supabase
    .from('sermons')
    .insert([
      { 
        date, 
        title, 
        scripture_reading: scriptureReading, 
        memory_verse: memoryVerse, 
        questions: questions || [], 
        document_url: documentUrl,
        content
      }
    ])
    .select();
  
  if (error) throw error;
  return data[0];
};

const updateSermon = async (id, date, title, scriptureReading, memoryVerse, questions, documentUrl, content) => {
  const updateData = { 
    date, 
    title, 
    scripture_reading: scriptureReading, 
    memory_verse: memoryVerse,
    questions: questions || [],
    content,
    updated_at: new Date().toISOString() 
  };
  
  if (documentUrl !== undefined) {
    updateData.document_url = documentUrl;
  }
  
  const { data, error } = await supabase
    .from('sermons')
    .update(updateData)
    .eq('id', id)
    .select();
    
  if (error) throw error;
  return data && data.length > 0;
};

const deleteSermon = async (id) => {
  const { error } = await supabase
    .from('sermons')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
  return true;
};

// --- READINGS ---

const getAllReadings = async () => {
  const { data, error } = await supabase
    .from('readings')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

const getReadingsSync = async (lastSync) => {
  let query = supabase.from('readings').select('*');
  
  if (lastSync) {
    query = query.gte('updated_at', lastSync);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

const addReading = async (date, title, bibleVerses, audioUrl) => {
  const { data, error } = await supabase
    .from('readings')
    .insert([
      { 
        date, 
        title, 
        bible_verses: bibleVerses, 
        audio_url: audioUrl
      }
    ])
    .select();
  
  if (error) throw error;
  return data[0];
};

const updateReading = async (id, date, title, bibleVerses, audioUrl) => {
  const updateData = { 
    date, 
    title, 
    bible_verses: bibleVerses, 
    updated_at: new Date().toISOString() 
  };
  
  if (audioUrl !== undefined) {
    updateData.audio_url = audioUrl;
  }
  
  const { data, error } = await supabase
    .from('readings')
    .update(updateData)
    .eq('id', id)
    .select();
    
  if (error) throw error;
  return data && data.length > 0;
};

const deleteReading = async (id) => {
  const { error } = await supabase
    .from('readings')
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
  deleteSong,
  getAllSermons,
  getSermonsSync,
  addSermon,
  updateSermon,
  deleteSermon,
  getAllReadings,
  getReadingsSync,
  addReading,
  updateReading,
  deleteReading
};
