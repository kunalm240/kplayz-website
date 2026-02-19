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

async function loadPerformanceSnapshot() {
  try {
    const res = await fetch(`${API}/api/youtube/stats`);
    const data = await res.json();

    document.getElementById("perfSubs").textContent =
      formatNumber(data.subscribers);

    document.getElementById("perfViews").textContent =
      formatNumber(data.totalViews);

  } catch (e) {
    console.error("Performance snapshot error", e);
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
window.addEventListener("scroll", () => {
  document.querySelectorAll(".info-section").forEach(sec => {
    const rect = sec.getBoundingClientRect();
    const offset = rect.top * 0.1;
    sec.style.setProperty("--bgShift", `${offset}px`);
  });
});

function scrollToSection(id){
  const el = document.getElementById(id);
  if(!el) return;

  const y = el.getBoundingClientRect().top + window.pageYOffset - 80;

  window.scrollTo({
    top:y,
    behavior:"smooth"
  });
}

document.addEventListener('DOMContentLoaded', () => {

  const symbols = ['△','○','✕','□'];
  const container = document.querySelector('.ps-rain');

  for(let i = 0; i < 50; i++){

    const span = document.createElement('span');
    span.classList.add('ps-symbol');

    span.innerText = symbols[Math.floor(Math.random()*symbols.length)];
    span.style.left = Math.random() * 100 + 'vw';

    // FAR LAYER (small, slow, faint)
    if(Math.random() > 0.25){
      span.style.fontSize = '10px';
      span.style.opacity = 0.05;
      span.style.animationDuration = (14 + Math.random() * 6) + 's';
    }
    // NEAR LAYER (slightly bigger, faster)
    else{
      span.style.fontSize = '16px';
      span.style.opacity = 0.12;
      span.style.animationDuration = (8 + Math.random() * 4) + 's';
    }

    span.style.animationDelay = Math.random() * 10 + 's';

    container.appendChild(span);
  }

});

const indicator = document.querySelector('.nav-indicator');
const navLinks = document.querySelectorAll('.nav-menu a');

navLinks.forEach(link => {

  link.addEventListener('mouseenter', (e) => {

    const rect = e.target.getBoundingClientRect();
    const navRect = document.querySelector('.navbar').getBoundingClientRect();

    indicator.style.width = rect.width + 'px';
    indicator.style.left = (rect.left - navRect.left) + 'px';
  });

});

document.querySelector('.navbar').addEventListener('mouseleave', () => {
  indicator.style.width = '0';
});

document.addEventListener("mousemove", e=>{
  document.querySelectorAll(".bg-word").forEach(el=>{
    const x = (window.innerWidth/2 - e.clientX) * 0.005;
    const y = (window.innerHeight/2 - e.clientY) * 0.005;
    el.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
  });
});

document.addEventListener('mousemove', (e) => {

  const x = (e.clientX / window.innerWidth - 0.5) * 20;
  const y = (e.clientY / window.innerHeight - 0.5) * 20;

  document.querySelectorAll('.ps-symbol').forEach((el, i) => {

    const depth = el.style.fontSize === '16px' ? 0.6 : 0.3; // near vs far
    el.style.transform += ` translate(${x * depth}px, ${y * depth}px)`;

  });

});

window.addEventListener("scroll", () => {
  const scrollTop = window.scrollY;
  const docHeight = document.body.scrollHeight - window.innerHeight;
  const progress = (scrollTop / docHeight) * 100;

  const bar = document.getElementById("scrollBar");
  if (bar) bar.style.height = progress + "%";
});
/* ---------- INIT ---------- */
window.addEventListener("load", () => {
  loadStats();
  loadLatestVideo();
  loadPerformanceSnapshot();
  loadSeries();
});
