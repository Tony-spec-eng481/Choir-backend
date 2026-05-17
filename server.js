require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./database');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure Multer for temp storage before uploading to Supabase
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['audio/mpeg', 'audio/wav', 'audio/x-wav'];
    const allowedExts = ['.mp3', '.wav'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedMimeTypes.includes(file.mimetype) || allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only MP3 and WAV audio files are allowed!'), false);
    }
  }
});

// Helper function to upload to Supabase Storage
async function uploadToSupabase(file) {
  const fileBuffer = fs.readFileSync(file.path);
  const fileName = `audio-${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
  
  const { data, error } = await db.supabase.storage
    .from(process.env.SUPABASE_BUCKET || 'Hymns')
    .upload(fileName, fileBuffer, {
      contentType: file.mimetype,
      upsert: true
    });
    
  // Delete local temp file
  try {
    fs.unlinkSync(file.path);
  } catch (err) {
    console.error('Error deleting temp file:', err);
  }

  if (error) {
    throw error;
  }

  // Get Public URL
  const { data: { publicUrl } } = db.supabase.storage
    .from(process.env.SUPABASE_BUCKET || 'Hymns')
    .getPublicUrl(data.path);

  return publicUrl;
}

// --- API ROUTES ---

// POST: Add a new song
app.post('/api/songs', upload.single('audio'), async (req, res) => {
  try {
    const { number, title, lyrics } = req.body;
    let audioUrl = null;

    if (!number || !title || !lyrics) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: 'Number, title, and lyrics are required.' });
    }

    if (req.file) {
      audioUrl = await uploadToSupabase(req.file);
    }

    const newSong = await db.addSong(number, title, lyrics, audioUrl);
    res.status(201).json({ message: 'Song added successfully', song: newSong });
  } catch (err) {
    console.error('Error adding song:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// GET: Sync songs
app.get('/api/songs/sync', async (req, res) => {
  try {
    const lastSync = req.query.lastSync;
    const songs = await db.getSongsSync(lastSync);
    res.json(songs);
  } catch (err) {
    console.error('Error syncing songs:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET: List all songs
app.get('/api/songs', async (req, res) => {
  try {
    const songs = await db.getAllSongs();
    res.json(songs);
  } catch (err) {
    console.error('Error fetching songs:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT: Update an existing song
app.put('/api/songs/:id', upload.single('audio'), async (req, res) => {
  try {
    const { number, title, lyrics } = req.body;
    let audioUrl = undefined;

    if (!number || !title || !lyrics) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: 'Number, title, and lyrics are required.' });
    }

    if (req.file) {
      audioUrl = await uploadToSupabase(req.file);
    }

    const success = await db.updateSong(req.params.id, number, title, lyrics, audioUrl);
    if (success) {
      res.json({ message: 'Song updated successfully' });
    } else {
      res.status(404).json({ error: 'Song not found' });
    }
  } catch (err) {
    console.error('Error updating song:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// DELETE: Delete a song
app.delete('/api/songs/:id', async (req, res) => {
  try {
    const success = await db.deleteSong(req.params.id);
    if (success) {
      res.json({ message: 'Song deleted successfully' });
    } else {
      res.status(404).json({ error: 'Song not found' });
    }
  } catch (err) {
    console.error('Error deleting song:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Hymn App Backend listening at http://localhost:${port}`);
});
