const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio';
const frontendPath = path.join(__dirname, '../frontend');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(frontendPath));

mongoose
  .connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000
  })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.log('MongoDB connection error:', err.message);
  });

// Feedback schema
const feedbackSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
  date: { type: Date, default: Date.now }
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    databaseConnected: mongoose.connection.readyState === 1
  });
});

app.post('/api/feedback', async (req, res) => {
  const { name, email, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const feedbackPayload = { name, email, message };

  if (mongoose.connection.readyState === 1) {
    try {
      const feedback = new Feedback(feedbackPayload);
      await feedback.save();

      console.log('New feedback received:', feedbackPayload);

      return res.status(200).json({
        message: `Thank you, ${name}! Your message has been sent successfully.`,
        saved: true
      });
    } catch (error) {
      console.error('Error saving feedback to MongoDB:', error);
    }
  }

  console.log('Feedback received without database persistence:', feedbackPayload);

  return res.status(202).json({
    message: `Thank you, ${name}! Your message has been received.`,
    saved: false
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
