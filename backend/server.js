const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const frontendPath = path.join(__dirname, '../frontend');

// Mongoose schema for contact messages
const contactMessageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  email: {
    type: String,
    required: true,
    trim: true,
    maxlength: 254
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000
  }
}, {
  timestamps: true
});

const ContactMessage = mongoose.model('ContactMessage', contactMessageSchema);

// Connect to MongoDB
const connectDB = async () => {
  if (!MONGODB_URI) {
    console.warn('MONGODB_URI is not set. Contact form will be unavailable.');
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
  }
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(frontendPath));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    databaseConfigured: Boolean(MONGODB_URI),
    databaseConnected: mongoose.connection.readyState === 1
  });
});

app.get('/api/leetcode', async (req, res) => {
  const LEETCODE_USERNAME = process.env.LEETCODE_USERNAME || 'Abhinnav91';
  const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours
  const now = Date.now();

  if (app._lcCache && now - app._lcCache.ts < CACHE_TTL) {
    return res.status(200).json(app._lcCache.data);
  }

  try {
    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query userProfileQuestions($username: String!) {
          matchedUser(username: $username) {
            submitStatsGlobal {
              acSubmissionNum {
                difficulty
                count
              }
            }
          }
        }`,
        variables: { username: LEETCODE_USERNAME }
      })
    });

    const json = await response.json();
    const nums = json?.data?.matchedUser?.submitStatsGlobal?.acSubmissionNum || [];

    const stats = { total: 0, easy: 0, medium: 0, hard: 0 };
    for (const item of nums) {
      if (item.difficulty === 'All') stats.total = item.count;
      else if (item.difficulty === 'Easy') stats.easy = item.count;
      else if (item.difficulty === 'Medium') stats.medium = item.count;
      else if (item.difficulty === 'Hard') stats.hard = item.count;
    }

    app._lcCache = { data: stats, ts: now };
    return res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching LeetCode stats:', error.message);
    return res.status(502).json({ error: 'Failed to fetch LeetCode stats' });
  }
});

app.get('/api/feedback', async (req, res) => {
  if (!MONGODB_URI) {
    return res.status(503).json({
      message: 'Message service is unavailable right now. Please try again later.'
    });
  }

  const rawLimit = Number.parseInt(req.query.limit, 10);
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 50;

  try {
    const messages = await ContactMessage.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('name email message createdAt')
      .lean();

    return res.status(200).json({
      count: messages.length,
      items: messages
    });
  } catch (error) {
    console.error('Error fetching feedback from MongoDB:', error);
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

  if (!MONGODB_URI) {
    console.error('Feedback rejected because MONGODB_URI is not set:', feedbackPayload);

    return res.status(503).json({
      message: 'Message service is unavailable right now. Please try again later.',
      saved: false
    });
  }

  try {
    await ContactMessage.create(feedbackPayload);

    console.log('New feedback received:', feedbackPayload);

    return res.status(200).json({
      message: `Thank you, ${name}! Your message has been sent successfully.`,
      saved: true
    });
  } catch (error) {
    console.error('Error saving feedback to MongoDB:', error);
    return res.status(500).json({
      message: 'Your message could not be saved. Please try again in a moment.',
      saved: false
    });
  }
});

// Start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
