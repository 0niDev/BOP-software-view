# Deploy to Render.com (Recommended - Best Free Alternative)

## Why Render is the best choice:
- ✅ **No outbound connection restrictions** (SQLite Cloud will work)
- ✅ **Free tier available** with 750 hours/month
- ✅ **Automatic HTTPS** 
- ✅ **Easy GitHub integration**
- ✅ **No credit card required** for free tier

## Deployment Steps:

### 1. Push your code to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/your-repo-name.git
git push -u origin main
```

### 2. Deploy on Render
1. Go to https://render.com and sign up (free)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: Your app name (e.g., "erp-system")
   - **Environment**: Python
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn wsgi:app`
   - **Instance Type**: Free
5. Click "Create Web Service"

### 3. Wait for deployment
Render will automatically:
- Install dependencies
- Build your app
- Deploy with HTTPS

Your app will be live at: `https://your-app-name.onrender.com`

---

## Alternative: Railway.app

If you prefer Railway:

1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway auto-detects Python and deploys automatically

Your app will be at: `https://your-project.railway.app`

---

## Files Already Configured:
- ✅ `requirements.txt` - Added gunicorn
- ✅ `Procfile` - For Heroku/Railway compatibility  
- ✅ `render.yaml` - Render configuration file
- ✅ `wsgi.py` - WSGI entry point

## Important Notes:
- **Free tier limitations**: Render free services sleep after 15 minutes of inactivity (wake up on next request, takes ~30 seconds)
- **Database**: Your SQLite Cloud connection will work fine on Render (no port blocking)
- **Logs**: View real-time logs in the Render dashboard
- **Custom Domain**: Free subdomain included, custom domains supported

## Troubleshooting:
If you see connection errors after deploying:
1. Check Render logs in the dashboard
2. Verify your SQLite Cloud API key is correct
3. Ensure database name matches exactly
