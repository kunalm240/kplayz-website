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

    if (!video?.videoId) return;

    const player = document.getElementById("ytPlayer");
    player.src = `https://www.youtube.com/embed/${video.videoId}`;

    document.getElementById("videoTitle").textContent = video.title;

    const date = new Date(video.publishedAt);
    document.getElementById("videoDate").textContent =
      date.toLocaleDateString("en-US", { year:"numeric", month:"short", day:"numeric" });

    document.getElementById("videoContainer").style.display = "block";
    document.getElementById("videoPlaceholder").style.display = "none";
  } catch (e) {
    console.error("Video error", e);
  }
}

/* ---------- LOAD SERIES ---------- */
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
          <p class="series-count">${pl.count} videos</p>
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
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        message: document.getElementById("message").value
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

/* SCROLL REVEAL */
const reveals = document.querySelectorAll("section");

function revealOnScroll() {
  const trigger = window.innerHeight * 0.85;

  reveals.forEach(sec => {
    const top = sec.getBoundingClientRect().top;

    if (top < trigger) {
      sec.classList.add("reveal", "active");
    } else {
      sec.classList.remove("active");
    }
  });
}

const seriesGrid = document.getElementById("seriesGrid");

if (seriesGrid) {
  seriesGrid.addEventListener("mousemove", (e) => {
    const { left, width } = seriesGrid.getBoundingClientRect();
    const x = e.clientX - left;

    if (x < width * 0.2) {
      seriesGrid.scrollBy({ left: -10, behavior: "smooth" });
    } else if (x > width * 0.8) {
      seriesGrid.scrollBy({ left: 10, behavior: "smooth" });
    }
  });
}

window.addEventListener("scroll", revealOnScroll);
window.addEventListener("load", revealOnScroll);
