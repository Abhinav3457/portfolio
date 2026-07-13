const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const frontendPath = path.join(__dirname, '../frontend');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(frontendPath));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
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



// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
