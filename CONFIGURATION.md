# YouTube API Configuration Guide

This guide explains how to configure your YouTube API key for StreamNest.

## Quick Start

1. **Get your API key** from Google Cloud Console
2. **Add it to `.env` file** in the project root
3. **Restart the development server**
4. **Test the application**

---

## Step 1: Get Your YouTube API Key

### 1.1 Go to Google Cloud Console
Visit: https://console.cloud.google.com/

### 1.2 Create or Select a Project
- If you don't have a project, click "Select a project" → "New Project"
- Give it a name (e.g., "StreamNest")
- Click "Create"

### 1.3 Enable YouTube Data API v3
1. In the left sidebar, go to **APIs & Services** → **Library**
2. Search for "YouTube Data API v3"
3. Click on it
4. Click **Enable**

### 1.4 Create API Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **API key**
3. Copy the generated API key
4. (Optional but recommended) Click **Restrict Key** to:
   - Limit it to YouTube Data API v3 only
   - Add HTTP referrer restrictions for your domain

---

## Step 2: Add API Key to Your Project

### In Development Environment

1. Open the `.env` file in the project root
2. Add your API key:

```env
VITE_YOUTUBE_API_KEY=AIzaSyC...your_actual_key_here
```

**Important:** 
- The variable MUST start with `VITE_` to be accessible in the browser
- Do NOT add quotes around the key
- Do NOT commit the `.env` file to Git (it's already in .gitignore)

### In Production Environment

Set the environment variable in your hosting platform:

**Vercel:**
- Go to Project Settings → Environment Variables
- Add `VITE_YOUTUBE_API_KEY` with your key
- Redeploy

**Netlify:**
- Go to Site Settings → Environment Variables
- Add `VITE_YOUTUBE_API_KEY` with your key
- Redeploy

---

## Step 3: Restart Development Server

After adding the API key, you MUST restart the development server:

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

**Why?** Vite loads environment variables at startup. Changes to `.env` require a restart.

---

## Step 4: Test the Configuration

1. Open your browser to http://localhost:3000
2. You should see real YouTube videos loading
3. Try searching for videos
4. Click on a video to watch it

---

## Troubleshooting

### "YouTube API key is not configured"
- ✅ Check that `.env` file exists in the project root
- ✅ Check that the variable is named exactly `VITE_YOUTUBE_API_KEY`
- ✅ Check that you restarted the dev server after adding the key
- ✅ Check that there are no quotes around the key value

### "API key not valid" or "Bad request"
- ✅ Verify your API key is correct (no extra spaces)
- ✅ Check that YouTube Data API v3 is enabled in Google Cloud Console
- ✅ Check that your API key is not restricted to a different API

### "Access denied" or "403 Forbidden"
- ✅ Your API key may have restrictions that prevent this operation
- ✅ Check API key restrictions in Google Cloud Console
- ✅ Make sure YouTube Data API v3 is allowed for this key

### "Quota exceeded"
- YouTube API has a daily quota of 10,000 units
- Search operations cost 100 units each
- Wait until tomorrow or request a quota increase
- The app caches results to minimize API usage

---

## API Key Security

### ✅ Do:
- Use API key restrictions in Google Cloud Console
- Limit the key to YouTube Data API v3 only
- Add HTTP referrer restrictions for production domains
- Keep your `.env` file out of Git (already configured)

### ❌ Don't:
- Commit `.env` to Git
- Share your API key publicly
- Use the same API key for multiple unrelated projects
- Leave API keys in source code

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_YOUTUBE_API_KEY` | ✅ Yes | YouTube Data API v3 key |
| `GOOGLE_CLIENT_ID` | ❌ No | For OAuth authentication |
| `GOOGLE_CLIENT_SECRET` | ❌ No | For OAuth (server-side only) |
| `VITE_SUPABASE_URL` | ❌ No | For persistent user data |
| `VITE_SUPABASE_ANON_KEY` | ❌ No | Supabase anonymous key |

---

## Testing Your API Key

You can test your API key directly in the browser:

```
https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&maxResults=1&key=YOUR_API_KEY_HERE
```

Replace `YOUR_API_KEY_HERE` with your actual key. You should see JSON data with video information.

---

## Need Help?

- YouTube API Documentation: https://developers.google.com/youtube/v3
- Google Cloud Console: https://console.cloud.google.com/
- Check the browser console for detailed error messages
