const express = require('express');
const cors = require('cors');
const axios = require('axios');
const nodemailer = require('nodemailer');
const NodeCache = require('node-cache');
require('dotenv').config();

const app = express();
const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes cache

// ================= ENV =================
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = 'UCQ0c2i4bBA0NU8Ikpr2fX3g';

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// ================= RATE LIMIT (3 per hour) =================
const rateLimitMap = {};

function rateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowStart = now - 3600000;

  if (!rateLimitMap[ip]) {
    rateLimitMap[ip] = [];
  }

  rateLimitMap[ip] = rateLimitMap[ip].filter(time => time > windowStart);

  if (rateLimitMap[ip].length >= 3) {
    return res.status(429).json({ error: 'Too many requests. Max 3 per hour.' });
  }

  rateLimitMap[ip].push(now);
  next();
}

// ================= YOUTUBE STATS =================
async function getChannelStats() {
  try {
    const cached = cache.get('channelStats');
    if (cached) return cached;

    const res = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
      params: {
        part: 'statistics,snippet',
        id: CHANNEL_ID,
        key: YOUTUBE_API_KEY
      }
    });

    const channel = res.data.items[0];
    const stats = channel.statistics;

    const result = {
      subscribers: parseInt(stats.subscriberCount) || 0,
      totalViews: parseInt(stats.viewCount) || 0,
      totalVideos: parseInt(stats.videoCount) || 0,
      channelTitle: channel.snippet.title,
      thumbnail: channel.snippet.thumbnails.high.url
    };

    cache.set('channelStats', result);
    return result;

  } catch (error) {
    console.error('YouTube Stats Error:', error.message);
    return { subscribers: 0, totalViews: 0, totalVideos: 0 };
  }
}

// ================= LATEST VIDEO =================
// ================= LATEST VIDEO =================
async function getLatestVideo() {
  try {
    const cached = cache.get('latestVideo');
    if (cached) return cached;

    // 1️⃣ Get uploads playlist ID
    const uploadsRes = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
      params: {
        part: 'contentDetails',
        id: CHANNEL_ID,
        key: YOUTUBE_API_KEY
      }
    });

    const uploadsPlaylistId =
      uploadsRes.data.items[0].contentDetails.relatedPlaylists.uploads;

    // 2️⃣ Get latest video from uploads playlist
    const videoRes = await axios.get('https://www.googleapis.com/youtube/v3/playlistItems', {
      params: {
        part: 'snippet',
        playlistId: uploadsPlaylistId,
        maxResults: 1,
        key: YOUTUBE_API_KEY
      }
    });

    const video = videoRes.data.items[0].snippet;

    const result = {
      id: video.resourceId.videoId,
      title: video.title,
      publishedAt: new Date(video.publishedAt).toDateString()
    };

    cache.set('latestVideo', result);
    return result;

  } catch (error) {
    console.error('Latest Video Error:', error.message);
    return { id: '' };
  }
}

// ================= PLAYLIST VIDEOS =================
async function getPlaylistVideos(playlistId) {
  try {
    const cacheKey = `playlist_${playlistId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const res = await axios.get('https://www.googleapis.com/youtube/v3/playlistItems', {
      params: {
        part: 'snippet',
        playlistId: playlistId,
        key: YOUTUBE_API_KEY,
        maxResults: 50
      }
    });

    const videos = res.data.items.map(item => ({
      videoId: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.high.url,
      publishedAt: item.snippet.publishedAt
    }));

    cache.set(cacheKey, videos);
    return videos;

  } catch (error) {
    console.error('Playlist Error:', error.message);
    return [];
  }
}

// ================= NODEMAILER =================
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD
  }
});

// ================= API ROUTES =================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Channel stats
app.get('/api/youtube/stats', async (req, res) => {
  const stats = await getChannelStats();
  res.json(stats);
});

// Latest video
app.get('/api/youtube/latest', async (req, res) => {
  const video = await getLatestVideo();
  res.json(video);
});

// Playlist videos
app.get('/api/youtube/playlist/:id', async (req, res) => {
  const videos = await getPlaylistVideos(req.params.id);
  res.json({ videos, count: videos.length });
});

// GET ALL PLAYLISTS
// ================= GET PLAYLISTS =================
app.get('/api/youtube/playlists', async (req, res) => {
  try {
    const cached = cache.get('playlists');
    if (cached) return res.json(cached);

    const response = await axios.get('https://www.googleapis.com/youtube/v3/playlists', {
      params: {
        part: 'snippet,contentDetails',
        channelId: CHANNEL_ID,
        maxResults: 10,
        key: YOUTUBE_API_KEY
      }
    });

    const playlists = response.data.items.map(pl => ({
      id: pl.id,
      title: pl.snippet.title,
      thumbnail: pl.snippet.thumbnails.high.url,
      count: pl.contentDetails.itemCount,
      description: pl.snippet.description
    }));

    cache.set('playlists', playlists);
    res.json(playlists);

  } catch (err) {
    console.error('Playlist fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch playlists' });
  }
});
// Contact form
app.post('/api/contact', rateLimit, async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const sanitize = str =>
      str.replace(/<script.*?>.*?<\/script>/gi, '').replace(/javascript:/gi, '').trim();

    const cleanName = sanitize(name);
    const cleanEmail = sanitize(email);
    const cleanSubject = sanitize(subject);
    const cleanMessage = sanitize(message);

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER,
      replyTo: cleanEmail,
      subject: `[KPLAYZ] ${cleanSubject}`,
      html: `
        <h3>New Contact Message</h3>
        <p><b>Name:</b> ${cleanName}</p>
        <p><b>Email:</b> ${cleanEmail}</p>
        <p><b>Subject:</b> ${cleanSubject}</p>
        <p><b>Message:</b><br>${cleanMessage}</p>
      `
    });

    res.json({ success: true, message: 'Message sent successfully!' });

  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// ================= START SERVER =================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.get('/api/youtube/uploads', async (req, res) => {
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=6`;

    const response = await axios.get(url);

    const videos = response.data.items
      .filter(item => item.id.videoId)
      .map(item => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.medium.url,
        publishedAt: item.snippet.publishedAt
      }));

    res.json(videos);

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch uploads' });
  }
});
