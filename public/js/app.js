const API_BASE = window.location.origin;

/* ================= NAVBAR GLASS SCROLL ================= */
window.addEventListener('scroll',()=>{
  const nav=document.querySelector('.navbar');
  if(window.scrollY>20){nav.classList.add('scrolled')}
  else{nav.classList.remove('scrolled')}
});

/* ================= FADE IN ON SCROLL ================= */
const observer=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.classList.add('visible');
    }
  });
},{threshold:.15});

document.querySelectorAll('section').forEach(sec=>{
  sec.classList.add('fade-in');
  observer.observe(sec);
});

/* ================= NUMBER FORMAT ================= */
function formatNumber(num){
  if(num>=1000000)return (num/1000000).toFixed(1)+'M';
  if(num>=1000)return (num/1000).toFixed(1)+'K';
  return num;
}

/* ================= ANIMATE COUNTER ================= */
function animateCounter(el,target){
  let count=0;
  const speed=target/60;
  const update=()=>{
    count+=speed;
    if(count<target){
      el.textContent=formatNumber(Math.floor(count));
      requestAnimationFrame(update);
    }else{
      el.textContent=formatNumber(target);
    }
  };
  update();
}

/* ================= LOAD STATS ================= */
async function loadStats(){
  const res=await fetch(`${API_BASE}/api/youtube/stats`);
  const data=await res.json();

  animateCounter(document.getElementById('statSubscribers'),data.subscribers);
  animateCounter(document.getElementById('statViews'),data.totalViews);
  animateCounter(document.getElementById('statVideos'),data.totalVideos);
}

/* ================= LOAD LATEST VIDEO ================= */
async function loadLatestVideo(){
  const res=await fetch(`${API_BASE}/api/youtube/latest`);
  const video=await res.json();
  if(!video.videoId)return;

  const player=document.getElementById('ytPlayer');
  const container=document.getElementById('videoContainer');
  const placeholder=document.getElementById('videoPlaceholder');

  player.src=`https://www.youtube.com/embed/${video.videoId}`;
  container.style.display='block';
  placeholder.style.display='none';

  document.getElementById('videoTitle').textContent=video.title;
  document.getElementById('videoDescription').textContent=video.description.slice(0,120);
  document.getElementById('videoDate').textContent=new Date(video.publishedAt).toLocaleDateString();
}

async function loadPlaylistVideos() {
  try {
    const res = await fetch('/api/youtube/playlist');
    const videos = await res.json();

    const grid = document.getElementById('seriesGrid');

    if (!videos || videos.length === 0) {
      grid.innerHTML = '<p>No videos yet.</p>';
      return;
    }

    grid.innerHTML = videos.map(video => `
      <div class="series-card">
        <a href="https://youtube.com/watch?v=${video.videoId}" target="_blank">
          <div class="series-thumbnail">
            <img src="${video.thumbnail}" alt="${video.title}">
          </div>
          <div class="series-info">
            <h3>${video.title}</h3>
            <p>${new Date(video.publishedAt).toLocaleDateString()}</p>
          </div>
        </a>
      </div>
    `).join('');

  } catch (err) {
    console.error(err);
  }
}

async function loadPlaylists() {
  try {
    const res = await fetch('/api/youtube/playlists');
    const playlists = await res.json();

    const container = document.getElementById('playlistGrid');

    if (!playlists || playlists.length === 0) {
      container.innerHTML = '<p>No playlists yet.</p>';
      return;
    }

    container.innerHTML = playlists.map(pl => {
      const game = detectGame(pl.title);

      return `
        <div class="series-card"
             onclick="window.open('https://youtube.com/playlist?list=${pl.id}','_blank')">
          <div class="series-thumbnail">
            <img src="${pl.thumbnail}" alt="${pl.title}">
          </div>
          <div class="series-info">
            <h3>${game}</h3>
            <p>${pl.count} videos</p>
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    console.error(err);
  }
}

/* ================= INIT ================= */
window.addEventListener('load',()=>{
  loadStats();
  loadLatestVideo();
  loadPlaylistVideos();
});
