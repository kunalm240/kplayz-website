# 🎮 KPLAYZ PREMIUM - DEPLOYMENT GUIDE

## ⚡ SUPER QUICK START

All files are now ready in `/KPLAYZ-PREMIUM/` folder!

### STEP 1: Upload to GitHub (Your Repo: kunalm240/kplayz-website)

1. **DELETE** all old files from your repo first
2. **UPLOAD** all new files from `/KPLAYZ-PREMIUM/`
3. **IMPORTANT**: `package.json` must be at ROOT level (NOT in subfolder)
4. Commit & push

### STEP 2: YouTube API Key (5 min)
1. Go: https://console.cloud.google.com
2. Create new project "KPLAYZ"
3. Enable: YouTube Data API v3
4. Create API Key
5. Copy it

### STEP 3: Gmail App Password (3 min)
1. Go: https://myaccount.google.com/apppasswords
2. Need 2-Factor enabled first
3. Generate app password for KPLAYZ
4. Copy 16-character password

### STEP 4: Render Environment Variables
1. Go to Render Dashboard → Your service
2. Add these:
   - YOUTUBE_API_KEY = (from Step 2)
   - GMAIL_USER = kplayz.official@gmail.com
   - GMAIL_PASSWORD = (from Step 3)
   - NODE_ENV = production

### STEP 5: Deploy
Push to GitHub → Render auto-deploys → DONE! 🚀

---

## 📋 FILES CREATED

✅ server.js - Backend with YouTube API + Nodemailer  
✅ package.json - All dependencies  
✅ public/index.html - Premium monochrome design  
✅ public/css/styles.css - Apple-like styling  
✅ public/js/app.js - Dynamic YouTube data  
✅ Procfile - Render config  
✅ runtime.txt - Node version  
✅ .env.example - Environment template  
✅ .gitignore - Git config  

---

## 🎯 FEATURES

✅ Real YouTube stats (subscribers, views, videos)  
✅ Latest video auto-loads  
✅ Contact form with email  
✅ Premium monochrome design  
✅ Mobile responsive  
✅ Smooth animations  
✅ SEO ready  
✅ Performance optimized  

---

## 🔧 CUSTOMIZE

### Add Your Playlists
Edit `public/js/app.js` line ~85:
```javascript
const playlists = [
  { name: 'GTA V', id: 'YOUR_PLAYLIST_ID_HERE', videoCount: 15 },
  // Add more...
];
```

### Get Playlist ID
URL: youtube.com/playlist?list=**PLxxx123**  
That PLxxx123 is your ID.

### Change Text
Edit `public/index.html`:
- Hero tagline (line ~40)
- About section (line ~120)
- Any text you want

---

## 🐛 TROUBLESHOOTING

**YouTube stats not loading?**
- Check API key in Render
- Check YouTube Data API v3 enabled

**Contact form not sending?**
- Check Gmail password correct
- Check 2-Factor enabled on Gmail

**Website doesn't load?**
- Check logs in Render Dashboard
- Ensure package.json at ROOT

---

## 🎉 THAT'S IT!

Your premium KPLAYZ website is LIVE with:
- Real YouTube integration
- Working contact form
- Beautiful monochrome design
- Mobile responsive
- Auto-updating content

Share it everywhere! 🚀

---

Questions? Check logs in Render Dashboard.
