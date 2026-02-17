// ============================================================================
// KPLAYZ - FRONTEND APPLICATION
// ============================================================================

const API_BASE = window.location.origin;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

let pageData = { stats: null, latestVideo: null };

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));
  if (days > 7) return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

async function fetchAPI(endpoint) {
  try {
    const cacheKey = `cache_${endpoint}`;
    const cached = localStorage.getItem(cacheKey);
    const cacheTime = localStorage.getItem(`${cacheKey}_time`);
    if (cached && cacheTime) {
      const age = Date.now() - parseInt(cacheTime);
      if (age < CACHE_DURATION) return JSON.parse(cached);
    }
    const response = await fetch(`${API_BASE}${endpoint}`);
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    const data = await response.json();
    localStorage.setItem(cacheKey, JSON.stringify(data));
    localStorage.setItem(`${cacheKey}_time`, Date.now().toString());
    return data;
  } catch (error) {
    console.error(`Fetch error (${endpoint}):`, error);
    const cached = localStorage.getItem(`cache_${endpoint}`);
    if (cached) return JSON.parse(cached);
    return null;
  }
}

async function loadChannelStats() {
  try {
    const stats = await fetchAPI('/api/youtube/stats');
    if (!stats) return;
    document.getElementById('statSubscribers').innerHTML = formatNumber(stats.subscribers);
    document.getElementById('statViews').innerHTML = formatNumber(stats.totalViews);
    document.getElementById('statVideos').innerHTML = stats.totalVideos;
    pageData.stats = stats;
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

async function loadLatestVideo() {
  try {
    const video = await fetchAPI('/api/youtube/latest');
    if (!video || !video.videoId) {
      document.getElementById('videoTitle').innerHTML = 'Latest video coming soon!';
      return;
    }
    document.getElementById('ytPlayer').src = `https://www.youtube.com/embed/${video.videoId}?autoplay=0&rel=0`;
    document.getElementById('videoContainer').style.display = 'block';
    document.getElementById('videoPlaceholder').style.display = 'none';
    document.getElementById('videoTitle').innerHTML = video.title;
    document.getElementById('videoDescription').innerHTML = video.description.substring(0, 200) + '...';
    document.getElementById('videoDate').innerHTML = `📅 ${formatDate(video.publishedAt)}`;
    document.getElementById('videoLink').href = `https://youtube.com/watch?v=${video.videoId}`;
    pageData.latestVideo = video;
  } catch (error) {
    console.error('Error loading latest video:', error);
  }
}

async function loadPlaylists() {
  try {
    // Example playlists - customize with your IDs
    const playlists = [
      { name: 'GTA V Cinematic', id: 'PLxxx', videoCount: 15 },
      { name: 'Cyberpunk 2077', id: 'PLyyy', videoCount: 12 },
      { name: 'More Gaming', id: 'PLzzz', videoCount: 10 }
    ];
    const seriesGrid = document.getElementById('seriesGrid');
    seriesGrid.innerHTML = '';
    for (const playlist of playlists) {
      const card = document.createElement('div');
      card.className = 'series-card';
      card.innerHTML = `
        <div class="series-thumbnail">
          <div style="background: linear-gradient(135deg, #333 0%, #1a1a1a 100%); width: 100%; height: 100%;"></div>
        </div>
        <div class="series-info">
          <h3>${playlist.name}</h3>
          <p>${playlist.videoCount} videos</p>
          <a href="https://youtube.com/playlist?list=${playlist.id}" target="_blank" class="series-button" style="display: inline-block; padding: 0.5rem 1rem; border: 1px solid #333; background: transparent; color: #fff; border-radius: 4px; text-decoration: none; font-size: 0.85rem;">Watch Playlist</a>
        </div>
      `;
      seriesGrid.appendChild(card);
    }
  } catch (error) {
    console.error('Error loading playlists:', error);
  }
}

document.getElementById('contactForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const formMessage = document.getElementById('formMessage');
  const submitBtn = document.getElementById('submitBtn');
  try {
    submitBtn.disabled = true;
    const formData = {
      name: document.getElementById('name').value,
      email: document.getElementById('email').value,
      subject: document.getElementById('subject').value,
      message: document.getElementById('message').value
    };
    const response = await fetch(`${API_BASE}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    const result = await response.json();
    formMessage.style.display = 'block';
    if (response.ok) {
      formMessage.className = 'form-message success';
      formMessage.innerHTML = result.message;
      form.reset();
    } else {
      formMessage.className = 'form-message error';
      formMessage.innerHTML = result.error || 'Failed to send message';
    }
  } catch (error) {
    console.error('Form submission error:', error);
    formMessage.style.display = 'block';
    formMessage.className = 'form-message error';
    formMessage.innerHTML = 'Error sending message. Please try again.';
  } finally {
    submitBtn.disabled = false;
  }
});

document.getElementById('watchLatestBtn')?.addEventListener('click', async () => {
  if (pageData.latestVideo?.videoId) {
    window.open(`https://youtube.com/watch?v=${pageData.latestVideo.videoId}`, '_blank');
  }
});

const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
navToggle?.addEventListener('click', () => { document.body.classList.toggle('menu-open'); });
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => { document.body.classList.remove('menu-open'); });
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    if (this.getAttribute('href') === '#') return;
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
  });
});

async function init() {
  try {
    await Promise.all([
      loadChannelStats(),
      loadLatestVideo(),
      loadPlaylists()
    ]);
  } catch (error) {
    console.error('Initialization error:', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

setInterval(() => {
  localStorage.clear();
  init();
}, 5 * 60 * 1000);
