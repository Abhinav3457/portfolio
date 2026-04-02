const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Connect to MongoDB (optional, for now we'll just log)
mongoose.connect('mongodb://localhost:27017/portfolio')
.then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
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
  res.sendFile(path.join(__dirname, '../frontend/abhinav.html'));
});

app.post('/api/feedback', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Save to database
    const feedback = new Feedback({ name, email, message });
    await feedback.save();

    console.log('New feedback received:', { name, email, message });

    res.status(200).json({ message: 'Feedback saved successfully' });
  } catch (error) {
    console.error('Error saving feedback:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});