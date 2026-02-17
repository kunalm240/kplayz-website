const express = require('express');
const cors = require('cors');
const axios = require('axios');
const nodemailer = require('nodemailer');
const NodeCache = require('node-cache');
require('dotenv').config();

const app = express();
const cache = new NodeCache({ stdTTL: 600 }); // 10-minute cache

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('public'));

// Rate limiting object (simple in-memory)
const rateLimitMap = {};

// ============================================================================
// RATE LIMITER MIDDLEWARE
// ============================================================================
function rateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowStart = now - 3600000; // 1 hour window
  
  if (!rateLimitMap[ip]) {
    rateLimitMap[ip] = [];
  }
  
  // Clean old requests
  rateLimitMap[ip] = rateLimitMap[ip].filter(time => time > windowStart);
  
  // Check limit (3 requests per hour)
  if (rateLimitMap[ip].length >= 3) {
    return res.status(429).json({ 
      error: 'Too many requests. Max 3 per hour.' 
    });
  }
  
  rateLimitMap[ip].push(now);
  next();
}

// ============================================================================
// YOUTUBE API INTEGRATION
// ============================================================================
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = 'UC-channel-id-here'; // Will be fetched dynamically

async function getChannelStats() {
  try {
    const cached = cache.get('channelStats');
    if (cached) return cached;

    // Search for channel by handle
    const searchRes = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: '@kplayz_official',
        type: 'channel',
        key: YOUTUBE_API_KEY,
        maxResults: 1
      }
    });

    if (!searchRes.data.items?.length) {
      throw new Error('Channel not found');
    }

    const channelId = searchRes.data.items[0].id.channelId;

    // Get channel statistics
    const statsRes = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
      params: {
        part: 'statistics,snippet,brandingSettings',
        id: channelId,
        key: YOUTUBE_API_KEY
      }
    });

    const channel = statsRes.data.items[0];
    const stats = channel.statistics;

    const result = {
      subscribers: parseInt(stats.subscriberCount) || 0,
      totalViews: parseInt(stats.viewCount) || 0,
      totalVideos: parseInt(stats.videoCount) || 0,
      channelTitle: channel.snippet.title,
      description: channel.snippet.description,
      thumbnail: channel.snippet.thumbnails.high.url
    };

    cache.set('channelStats', result);
    return result;
  } catch (error) {
    console.error('YouTube Stats Error:', error.message);
    return {
      subscribers: 0,
      totalViews: 0,
      totalVideos: 0,
      channelTitle: 'KPLAYZ',
      description: 'Gaming Creator',
      thumbnail: ''
    };
  }
}

async function getLatestVideo() {
  try {
    const cached = cache.get('latestVideo');
    if (cached) return cached;

    const searchRes = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: '@kplayz_official',
        type: 'channel',
        key: YOUTUBE_API_KEY,
        maxResults: 1
      }
    });

    const channelId = searchRes.data.items[0].id.channelId;

    const videosRes = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        channelId: channelId,
        order: 'date',
        type: 'video',
        key: YOUTUBE_API_KEY,
        maxResults: 1,
        publishedAfter: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    });

    if (!videosRes.data.items?.length) {
      return {
        videoId: '',
        title: 'Latest Video',
        thumbnail: '',
        publishedAt: new Date(),
        description: ''
      };
    }

    const video = videosRes.data.items[0];
    const result = {
      videoId: video.id.videoId,
      title: video.snippet.title,
      thumbnail: video.snippet.thumbnails.high.url,
      publishedAt: video.snippet.publishedAt,
      description: video.snippet.description,
      channelId: channelId
    };

    cache.set('latestVideo', result);
    return result;
  } catch (error) {
    console.error('Latest Video Error:', error.message);
    return {
      videoId: '',
      title: 'Latest Video',
      thumbnail: '',
      publishedAt: new Date(),
      description: '',
      error: error.message
    };
  }
}

async function getPlaylistVideos(playlistId) {
  try {
    const cacheKey = `playlist_${playlistId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const itemsRes = await axios.get('https://www.googleapis.com/youtube/v3/playlistItems', {
      params: {
        part: 'snippet',
        playlistId: playlistId,
        key: YOUTUBE_API_KEY,
        maxResults: 50
      }
    });

    const videos = itemsRes.data.items.map(item => ({
      videoId: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.high.url,
      publishedAt: item.snippet.publishedAt,
      position: item.snippet.position
    }));

    cache.set(cacheKey, videos);
    return videos;
  } catch (error) {
    console.error('Playlist Error:', error.message);
    return [];
  }
}

// ============================================================================
// NODEMAILER SETUP
// ============================================================================
let transporter;
try {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASSWORD
    }
  });
} catch (error) {
  console.error('Nodemailer setup error:', error);
}

// ============================================================================
// API ROUTES
// ============================================================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// YouTube Channel Stats
app.get('/api/youtube/stats', async (req, res) => {
  try {
    const stats = await getChannelStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Latest Video
app.get('/api/youtube/latest', async (req, res) => {
  try {
    const video = await getLatestVideo();
    res.json(video);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Playlist Videos
app.get('/api/youtube/playlist/:id', async (req, res) => {
  try {
    const videos = await getPlaylistVideos(req.params.id);
    res.json({ videos, count: videos.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Contact Form
app.post('/api/contact', rateLimit, async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ 
        error: 'All fields are required' 
      });
    }

    if (message.length > 5000) {
      return res.status(400).json({ 
        error: 'Message too long (max 5000 chars)' 
      });
    }

    // HTML sanitization (remove script tags)
    const sanitize = (str) => {
      return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/javascript:/gi, '')
                .trim();
    };

    const cleanName = sanitize(name);
    const cleanEmail = sanitize(email);
    const cleanSubject = sanitize(subject);
    const cleanMessage = sanitize(message);

    // Email template
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; color: #1a1a1a; padding: 20px;">
        <h2 style="color: #000;">New Contact from KPLAYZ Website</h2>
        <p><strong>Name:</strong> ${cleanName}</p>
        <p><strong>Email:</strong> ${cleanEmail}</p>
        <p><strong>Subject:</strong> ${cleanSubject}</p>
        <hr style="border: 1px solid #e0e0e0;">
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap;">${cleanMessage}</p>
      </div>
    `;

    if (transporter) {
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: process.env.GMAIL_USER,
        replyTo: cleanEmail,
        subject: `[KPLAYZ] ${cleanSubject}`,
        html: emailHtml
      });
    }

    res.json({ 
      success: true, 
      message: 'Message sent successfully! I\'ll get back to you soon.' 
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ 
      error: 'Failed to send message. Please try again.' 
    });
  }
});

// ============================================================================
// FRONTEND ROUTES (SPA routing)
// ============================================================================
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/series/:name', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/about', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/media-kit', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/contact', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// 404 handling
app.use((req, res) => {
  res.status(404).sendFile(__dirname + '/public/index.html');
});

// ============================================================================
// SERVER START
// ============================================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🎮 KPLAYZ Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
