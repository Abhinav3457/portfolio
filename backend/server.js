const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const SERVER_START_TIME = Date.now();
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
  const now = Date.now();
  const uptimeMs = now - SERVER_START_TIME;

  // Format uptime as human-readable string
  let uptimeStr;
  const totalSeconds = Math.floor(uptimeMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) {
    uptimeStr = days + 'd ' + hours + 'h ' + minutes + 'm';
  } else if (hours > 0) {
    uptimeStr = hours + 'h ' + minutes + 'm';
  } else if (minutes > 0) {
    uptimeStr = minutes + 'm ' + (totalSeconds % 60) + 's';
  } else {
    uptimeStr = totalSeconds + 's';
  }

  res.status(200).json({
    status: 'ok',
    timestamp: now,
    uptime: uptimeMs,
    uptimeHuman: uptimeStr,
    startTime: SERVER_START_TIME
  });
});

// Proxy endpoint to check external site availability
app.get('/api/check-site', async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'Missing url query parameter' });
  }

  const start = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: { 'User-Agent': 'Portfolio-Health-Checker/1.0' }
    });

    clearTimeout(timeout);

    const elapsed = Date.now() - start;

    return res.status(200).json({
      url,
      status: response.ok ? 'online' : 'error',
      statusCode: response.status,
      responseTime: elapsed
    });
  } catch (error) {
    const elapsed = Date.now() - start;
    return res.status(200).json({
      url,
      status: 'offline',
      statusCode: null,
      responseTime: elapsed,
      error: error.name === 'AbortError' ? 'timeout' : 'unreachable'
    });
  }
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

// ── Lighthouse Score API ──
// Proxies Google PageSpeed Insights v5 to fetch real Lighthouse scores
const LIGHTHOUSE_CACHE = {};
const LIGHTHOUSE_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

app.get('/api/lighthouse', async (req, res) => {
  const url = req.query.url;
  const strategy = req.query.strategy || 'desktop';

  if (!url) {
    return res.status(400).json({ error: 'Missing url query parameter' });
  }

  // Normalize URL to avoid cache misses from trailing slashes etc.
  const normalizedUrl = url.replace(/\/+$/, '');
  const cacheKey = normalizedUrl + '::' + strategy;
  const now = Date.now();

  // Check cache
  if (LIGHTHOUSE_CACHE[cacheKey] && now - LIGHTHOUSE_CACHE[cacheKey].ts < LIGHTHOUSE_CACHE_TTL) {
    return res.status(200).json(LIGHTHOUSE_CACHE[cacheKey].data);
  }

  try {
    const apiUrl = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed?' +
      'url=' + encodeURIComponent(normalizedUrl) +
      '&strategy=' + strategy +
      '&category=performance';

    const controller = new AbortController();
    const timeout = setTimeout(function() { controller.abort(); }, 30000);

    const response = await fetch(apiUrl, {
      headers: { 'User-Agent': 'Portfolio-Lighthouse-Checker/1.0' },
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.error('Lighthouse API error:', response.status, errText);
      return res.status(502).json({ error: 'PageSpeed API returned ' + response.status });
    }

    const data = await response.json();

    // Extract performance score (0-100)
    const perfCategory = data?.lighthouseResult?.categories?.performance;
    if (!perfCategory || typeof perfCategory.score !== 'number') {
      return res.status(502).json({ error: 'No performance score in response' });
    }

    const score = Math.round(perfCategory.score * 100);

    // Extract key metrics for display
    const audits = data?.lighthouseResult?.audits || {};

    const result = {
      url: normalizedUrl,
      strategy,
      score,
      metrics: {
        lcp: audits['largest-contentful-paint']?.displayValue || null,
        fid: audits['max-potential-fid']?.displayValue || null,
        cls: audits['cumulative-layout-shift']?.displayValue || null,
        tbt: audits['total-blocking-time']?.displayValue || null,
        si: audits['speed-index']?.displayValue || null
      },
      fetchedAt: now
    };

    // Cache the result
    LIGHTHOUSE_CACHE[cacheKey] = { data: result, ts: now };

    return res.status(200).json(result);
  } catch (error) {
    console.error('Lighthouse fetch error:', error.message);
    return res.status(502).json({ error: 'Failed to fetch Lighthouse score: ' + error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
