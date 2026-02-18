const API_BASE = window.location.origin;

/* NAVBAR SCROLL */
window.addEventListener('scroll', () => {
  const nav = document.querySelector('.navbar');
  if (window.scrollY > 20) nav.classList.add('scrolled');
  else nav.classList.remove('scrolled');
});

/* NUMBER FORMAT */
function formatNumber(num) {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num;
}

/* COUNTER ANIMATION */
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

/* LOAD STATS */
async function loadStats() {
  try {
    const res = await fetch(`${API_BASE}/api/youtube/stats`);
    const data = await res.json();

    animateCounter(document.getElementById('statSubscribers'), data.subscribers);
    animateCounter(document.getElementById('statViews'), data.totalViews);
    animateCounter(document.getElementById('statVideos'), data.totalVideos);
  } catch (err) {
    console.error(err);
  }
}

/* LOAD LATEST VIDEO */
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
    console.error(err);
  }
}

/* WATCH LATEST BUTTON */
function watchLatest() {
  window.open("https://youtube.com/@kplayz_official/videos", "_blank");
}

/* CONTACT FORM */
document.getElementById('contactForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

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
});

/* INIT */
window.addEventListener('load', () => {
  loadStats();
  loadLatestVideo();
});
