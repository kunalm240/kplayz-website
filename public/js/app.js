const API = window.location.origin;

function formatNumber(num) {
  if (!num) return "0";
  if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
  return num;
}

/* ---------- LOAD STATS ---------- */
async function loadStats() {
  try {
    const res = await fetch(`${API}/api/youtube/stats`);
    const data = await res.json();

    document.getElementById("statSubscribers").textContent = formatNumber(data.subscribers);
    document.getElementById("statViews").textContent = formatNumber(data.totalViews);
    document.getElementById("statVideos").textContent = data.totalVideos;
  } catch (e) {
    console.error("Stats error", e);
  }
}

/* ---------- LOAD LATEST VIDEO ---------- */
async function loadLatestVideo() {
  try {
    const res = await fetch(`${API}/api/youtube/latest`);
    const video = await res.json();

    if (!video?.id) return;

    const player = document.getElementById("ytPlayer");
    player.src = `https://www.youtube.com/embed/${video.id}`;

    document.getElementById("videoTitle").textContent = video.title;
    document.getElementById("videoDate").textContent = video.publishedAt;

    document.getElementById("videoContainer").style.display = "block";
    document.getElementById("videoPlaceholder").style.display = "none";
  } catch (e) {
    console.error("Video error", e);
  }
}

/* ---------- LOAD SERIES (GTA V) ---------- */
async function loadSeries() {
  const grid = document.getElementById("seriesGrid");

  try {
    const res = await fetch(`${API}/api/youtube/playlists`);
    const playlists = await res.json();

    if (!playlists.length) {
      grid.innerHTML = `<p class="loading-text">No series found</p>`;
      return;
    }

    grid.innerHTML = playlists.map(pl => `
      <a href="https://youtube.com/playlist?list=${pl.id}" target="_blank" class="series-card">
        <img src="${pl.thumbnail}" alt="${pl.title}" loading="lazy"/>
        <div class="series-info">
          <h3>${pl.title}</h3>
          <p>${pl.count} videos</p>
        </div>
      </a>
    `).join("");

  } catch (err) {
    console.error("Series load error:", err);
    grid.innerHTML = `<p class="loading-text">Failed to load series</p>`;
  }
}

/* ---------- CONTACT FORM ---------- */
document.getElementById("contactForm").addEventListener("submit", async e => {
  e.preventDefault();

  const msg = document.getElementById("formMessage");

  try {
    const res = await fetch(`${API}/api/contact`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        name: name.value,
        email: email.value,
        message: message.value
      })
    });

    const data = await res.json();

    msg.style.display = "block";

    if (res.ok) {
      msg.textContent = "Message sent successfully!";
      msg.className = "form-message success";
      e.target.reset();
    } else {
      msg.textContent = "Failed to send message";
      msg.className = "form-message error";
    }
  } catch {
    msg.style.display = "block";
    msg.textContent = "Server error";
    msg.className = "form-message error";
  }
});

/* ---------- CTA ---------- */
function watchLatest() {
  window.open("https://youtube.com/@kplayz_official/videos", "_blank");
}

/* ---------- INIT ---------- */
window.addEventListener("load", () => {
  loadStats();
  loadLatestVideo();
  loadSeries();
});
