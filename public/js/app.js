const API_BASE = window.location.origin;

/* ================= NAVBAR GLASS SCROLL ================= */
window.addEventListener('scroll', () => {
  const nav = document.querySelector('.navbar');
  if (window.scrollY > 20) nav.classList.add('scrolled');
  else nav.classList.remove('scrolled');
});

/* ================= FADE IN ON SCROLL ================= */
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.15 });

document.querySelectorAll('section').forEach(sec => {
  sec.classList.add('fade-in');
  observer.observe(sec);
});

/* ================= NUMBER FORMAT ================= */
function formatNumber(num) {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num;
}

/* ================= ANIMATE COUNTER ================= */
function animateCounter(el, target) {
  if (!el) return;
  let count = 0;
  const speed = target / 60;

  const update = () => {
    count += speed;
    if (count < target) {
      el.textContent = formatNumber(Math.floor(count));
      requestAnimationFrame(update);
    } else {
      el.textContent = formatNumber(target);
    }
  };

  update();
}

/* ================= LOAD STATS ================= */
async function loadStats() {
  try {
    const res = await fetch(`${API_BASE}/api/youtube/stats`);
    const data = await res.json();

    animateCounter(document.getElementById('statSubscribers'), data.subscribers);
    animateCounter(document.getElementById('statViews'), data.totalViews);
    animateCounter(document.getElementById('statVideos'), data.totalVideos);
  } catch (err) {
    console.error("Stats error:", err);
  }
}

/* ================= LOAD LATEST VIDEO ================= */
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

    document.getElementById('videoTitle').textContent = video.title;
    document.getElementById('videoDescription').textContent =
      (video.description || "").substring(0, 140) + '…';
    document.getElementById('videoDate').textContent =
      new Date(video.publishedAt).toLocaleDateString();
  } catch (err) {
    console.error("Latest video error:", err);
  }
}

/* ================= CINEMATIC SERIES BANNER ================= */
function loadSeries() {
  const playlists = [
    {
      name: "GTA V — Story Mode",
      id: "PLv0ioCII79zwUpg9nxl9KwP-I1mjFgjs8",
      image: "/images/gta-v.jpg",
      description: "Ongoing cinematic no-commentary gameplay"
    }
  ];

  const grid = document.getElementById("seriesGrid");
  if (!grid) return;

  grid.innerHTML = playlists.map(pl => `
    <a href="https://youtube.com/playlist?list=${pl.id}"
       target="_blank"
       class="series-banner">

      <img src="${pl.image}" alt="${pl.name}">

      <div class="series-info">
        <h3>${pl.name}</h3>
        <p>${pl.description}</p>
      </div>

    </a>
  `).join("");
}

/* ================= WATCH LATEST BUTTON ================= */
function watchLatest() {
  window.open("https://youtube.com/@kplayz_official/videos", "_blank");
}

/* ================= CONTACT FORM ================= */
document.getElementById('contactForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

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
    const msg = document.getElementById('formMessage');

    msg.style.display = 'block';

    if (res.ok) {
      msg.className = 'form-message success';
      msg.textContent = 'Message sent! Thank you!';
      e.target.reset();
    } else {
      msg.className = 'form-message error';
      msg.textContent = result.error || 'Failed to send';
    }
  } catch (err) {
    console.error("Contact error:", err);
  }
});

/* ================= INIT ================= */
window.addEventListener('load', () => {
  loadStats();
  loadLatestVideo();
  loadSeries();
});
