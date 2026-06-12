const express = require('express');
const path = require('path');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL;
const frontendPath = path.join(__dirname, '../frontend');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(frontendPath));

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL ? { rejectUnauthorized: false } : false
});

const ensureFeedbackTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS contact_messages (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await pool.query(createTableQuery);
};

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/api/health', (req, res) => {
  const isConnected = Boolean(DATABASE_URL);

  res.status(200).json({
    status: 'ok',
    databaseConfigured: isConnected
  });
});

app.get('/api/feedback', async (req, res) => {
  if (!DATABASE_URL) {
    return res.status(503).json({
      message: 'Message service is unavailable right now. Please try again later.'
    });
  }

  const rawLimit = Number.parseInt(req.query.limit, 10);
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 50;

  try {
    await ensureFeedbackTable();
    const { rows } = await pool.query(
      'SELECT id, name, email, message, created_at FROM contact_messages ORDER BY created_at DESC LIMIT $1',
      [limit]
    );

    return res.status(200).json({
      count: rows.length,
      items: rows
    });
  } catch (error) {
    console.error('Error fetching feedback from PostgreSQL:', error);
    return res.status(500).json({
      message: 'Messages could not be retrieved. Please try again in a moment.'
    });
  }
});

app.post('/api/feedback', async (req, res) => {
  const { name, email, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const feedbackPayload = { name, email, message };

  if (!DATABASE_URL) {
    console.error('Feedback rejected because DATABASE_URL is not set:', feedbackPayload);

    return res.status(503).json({
      message: 'Message service is unavailable right now. Please try again later.',
      saved: false
    });
  }

  try {
    await ensureFeedbackTable();
    await pool.query(
      'INSERT INTO contact_messages (name, email, message) VALUES ($1, $2, $3)',
      [name, email, message]
    );

    console.log('New feedback received:', feedbackPayload);

    return res.status(200).json({
      message: `Thank you, ${name}! Your message has been sent successfully.`,
      saved: true
    });
  } catch (error) {
    console.error('Error saving feedback to PostgreSQL:', error);
    return res.status(500).json({
      message: 'Your message could not be saved. Please try again in a moment.',
      saved: false
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
