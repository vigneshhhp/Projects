const path = require('path');
const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Static files
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

// DB
const db = require('./lib/db');

// Auth middleware
const { authRequired } = require('./middleware/auth');

// Routers
app.use('/api/auth', require('./routes/auth')); // register, login
app.use('/api/customer', authRequired, require('./routes/customer'));
app.use('/api/vehicles', authRequired, require('./routes/vehicles'));
app.use('/api/services', authRequired, require('./routes/services'));

// Fallback to index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Health check
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'DB not reachable' });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});


