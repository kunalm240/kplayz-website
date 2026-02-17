// ================= CONFIG =================
const API_BASE = window.location.origin;

const playlists = [
  {
    name: 'GTA V Cinematic',
    id: 'PLv0ioCII79zwUpg9nxl9KwP-I1mjFgjs8',
    image: '/images/gta-v.jpg'
  }

  // ➕ Add future playlists here
  // {
  //   name: 'Cyberpunk 2077',
  //   id: 'PLAYLIST_ID',
  //   image: '/images/cyberpunk.jpg'
  // }
];

// ================= HELPERS =================
function formatNumber(num) {
  if (!num) return '0';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return num.toString();
}

// ================= LOAD STATS =================
async function loadStats() {
  try {
    const res = await fetch(`${API_BASE}/api/youtube/stats`);
    const data = await res.json();

    document.getElementById('statSubscribers').textContent = formatNumber(data.subscribers);
    document.getElementById('statViews').textContent = formatNumber(data.totalViews);
    document.getElementById('statVideos').textContent = data.totalVideos;

  } catch (err) {
    console.error('Stats error:', err);
  }
}

// ================= LOAD LATEST VIDEO =================
async function loadLatestVideo() {
  try {
    const res = await fetch(`${API_BASE}/api/youtube/latest`);
    const video = await res.json();

    if (!video.videoId) return;

    const player = document.getElementById('ytPlayer');
    const container = document.getElementById('videoContainer');
    const placeholder = document.getElementById('videoPlaceholder');

    player.src = `https://www.youtube.com/embed/${video.videoId}`;
    container.style.display = 'block';
    placeholder.style.display = 'none';

    document.getElementById('videoTitle').textContent = video.title || 'Latest Upload';
    document.getElementById('videoDescription').textContent = video.description?.slice(0, 120) || '';
    document.getElementById('videoDate').textContent =
      video.publishedAt ? new Date(video.publishedAt).toLocaleDateString() : '';

  } catch (err) {
    console.error('Latest video error:', err);
  }
}

// ================= PLAYLIST CARDS =================
function renderPlaylists() {
  const grid = document.getElementById('seriesGrid');
  if (!grid) return;

  if (!playlists.length) {
    grid.innerHTML = '<p class="loading-text">No series available yet.</p>';
    return;
  }

  grid.innerHTML = playlists.map(playlist => `
    <div class="series-card">
      <a href="https://www.youtube.com/playlist?list=${playlist.id}" target="_blank">
        <div class="series-thumbnail">
          <img src="${playlist.image}" alt="${playlist.name}" loading="lazy" />
        </div>
        <div class="series-info">
          <h3>${playlist.name}</h3>
          <p class="series-meta">Cinematic walkthrough</p>
        </div>
      </a>
    </div>
  `).join('');
}

// ================= HERO BUTTON =================
function watchLatest() {
  window.open('https://youtube.com/@kplayz_official/videos', '_blank');
}

// ================= CONTACT FORM =================
document.getElementById('contactForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const msgBox = document.getElementById('formMessage');
  msgBox.style.display = 'block';
  msgBox.textContent = 'Sending...';

  try {
    const res = await fetch(`${API_BASE}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        subject: document.getElementById('subject').value,
        message: document.getElementById('message').value
      })
    });

    const result = await res.json();

    if (res.ok) {
      msgBox.className = 'form-message success';
      msgBox.textContent = 'Message sent successfully!';
      e.target.reset();
    } else {
      msgBox.className = 'form-message error';
      msgBox.textContent = result.error || 'Failed to send message';
    }

  } catch (err) {
    msgBox.className = 'form-message error';
    msgBox.textContent = 'Network error. Try again.';
  }
});

// ================= INIT =================
window.addEventListener('load', () => {
  loadStats();
  loadLatestVideo();
  renderPlaylists();
});

// Refresh stats every 5 minutes
setInterval(loadStats, 5 * 60 * 1000);
