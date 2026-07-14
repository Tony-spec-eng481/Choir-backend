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
    const allowedMimeTypes = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const allowedExts = ['.mp3', '.wav', '.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedMimeTypes.includes(file.mimetype) || allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type! Only MP3, WAV, PDF, DOC, DOCX are allowed.'), false);
    }
  }
});

// Helper function to upload to Supabase Storage
// Helper function to upload to Supabase Storage
async function uploadToSupabase(file, bucketOverride) {
  const bucketName = bucketOverride || process.env.SUPABASE_BUCKET || 'Hymns';
  const fileBuffer = fs.readFileSync(file.path);
  const prefix = file.mimetype.includes('audio') ? 'audio' : 'doc';
  const fileName = `${prefix}-${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
  
  const { data, error } = await db.supabase.storage
    .from(bucketName)
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
    .from(bucketName)
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

// --- SERMON ROUTES ---

// POST: Add a new sermon
app.post('/api/sermons', upload.single('document'), async (req, res) => {
  try {
    const { date, title, scriptureReading, memoryVerse, questions, content } = req.body;
    let documentUrl = null;

    if (!date || !title) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Date and title are required.' });
    }

    if (req.file) {
      documentUrl = await uploadToSupabase(req.file, 'Sermons');
    }

    let parsedQuestions = [];
    if (questions) {
      try { parsedQuestions = JSON.parse(questions); } catch (e) { console.error('Error parsing questions JSON:', e); }
    }

    const newSermon = await db.addSermon(date, title, scriptureReading, memoryVerse, parsedQuestions, documentUrl, content);
    res.status(201).json({ message: 'Sermon added successfully', sermon: newSermon });
  } catch (err) {
    console.error('Error adding sermon:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// GET: Sync sermons
app.get('/api/sermons/sync', async (req, res) => {
  try {
    const lastSync = req.query.lastSync;
    const sermons = await db.getSermonsSync(lastSync);
    res.json(sermons);
  } catch (err) {
    console.error('Error syncing sermons:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET: List all sermons
app.get('/api/sermons', async (req, res) => {
  try {
    const sermons = await db.getAllSermons();
    res.json(sermons);
  } catch (err) {
    console.error('Error fetching sermons:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT: Update an existing sermon
app.put('/api/sermons/:id', upload.single('document'), async (req, res) => {
  try {
    const { date, title, scriptureReading, memoryVerse, questions, content } = req.body;
    let documentUrl = undefined;

    if (!date || !title) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Date and title are required.' });
    }

    if (req.file) {
      documentUrl = await uploadToSupabase(req.file, 'Sermons');
    }

    let parsedQuestions = [];
    if (questions) {
      try { parsedQuestions = JSON.parse(questions); } catch (e) { console.error('Error parsing questions JSON:', e); }
    }

    const success = await db.updateSermon(req.params.id, date, title, scriptureReading, memoryVerse, parsedQuestions, documentUrl, content);
    if (success) {
      res.json({ message: 'Sermon updated successfully' });
    } else {
      res.status(404).json({ error: 'Sermon not found' });
    }
  } catch (err) {
    console.error('Error updating sermon:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// DELETE: Delete a sermon
app.delete('/api/sermons/:id', async (req, res) => {
  try {
    const success = await db.deleteSermon(req.params.id);
    if (success) {
      res.json({ message: 'Sermon deleted successfully' });
    } else {
      res.status(404).json({ error: 'Sermon not found' });
    }
  } catch (err) {
    console.error('Error deleting sermon:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- READINGS ROUTES ---

// POST: Add a new reading
app.post('/api/readings', upload.single('audio'), async (req, res) => {
  try {
    const { date, title, bibleVerses } = req.body;
    let audioUrl = null;

    if (!date) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Date is required.' });
    }

    if (req.file) {
      audioUrl = await uploadToSupabase(req.file, 'Readings');
    }

    const newReading = await db.addReading(date, title, bibleVerses, audioUrl);
    res.status(201).json({ message: 'Reading added successfully', reading: newReading });
  } catch (err) {
    console.error('Error adding reading:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// GET: Sync readings
app.get('/api/readings/sync', async (req, res) => {
  try {
    const lastSync = req.query.lastSync;
    const readings = await db.getReadingsSync(lastSync);
    res.json(readings);
  } catch (err) {
    console.error('Error syncing readings:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET: List all readings
app.get('/api/readings', async (req, res) => {
  try {
    const readings = await db.getAllReadings();
    res.json(readings);
  } catch (err) {
    console.error('Error fetching readings:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT: Update an existing reading
app.put('/api/readings/:id', upload.single('audio'), async (req, res) => {
  try {
    const { date, title, bibleVerses } = req.body;
    let audioUrl = undefined;

    if (!date) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Date is required.' });
    }

    if (req.file) {
      audioUrl = await uploadToSupabase(req.file, 'Readings');
    }

    const success = await db.updateReading(req.params.id, date, title, bibleVerses, audioUrl);
    if (success) {
      res.json({ message: 'Reading updated successfully' });
    } else {
      res.status(404).json({ error: 'Reading not found' });
    }
  } catch (err) {
    console.error('Error updating reading:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// DELETE: Delete a reading
app.delete('/api/readings/:id', async (req, res) => {
  try {
    const success = await db.deleteReading(req.params.id);
    if (success) {
      res.json({ message: 'Reading deleted successfully' });
    } else {
      res.status(404).json({ error: 'Reading not found' });
    }
  } catch (err) {
    console.error('Error deleting reading:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Hymn App Backend listening at http://localhost:${port}`);
});
