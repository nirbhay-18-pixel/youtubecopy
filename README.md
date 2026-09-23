# StreamNest

A modern video discovery platform powered by the YouTube Data API v3. StreamNest provides a clean, responsive interface for browsing, searching, and watching YouTube videos — all within your own application.

## Features

- 🏠 **Home Feed** — Browse popular and trending videos with category filters
- 🔍 **Search** — Real-time YouTube search with filters (sort, duration)
- 📺 **Watch Page** — Watch videos using the official YouTube embedded player
- 📺 **Channel Pages** — View channel info, videos, and playlists
- 📋 **Playlists** — Browse and view YouTube playlists
- 💬 **Comments** — View video comments where available
- 🌙 **Dark Mode** — Light, Dark, and System theme support
- 📱 **Responsive** — Mobile-first design with bottom navigation
- ⚡ **Performance** — Debounced search, caching, lazy loading
- 🔖 **Local Bookmarks** — Save videos locally for later
- 📜 **Watch History** — Track recently watched videos locally
- ♿ **Accessible** — Keyboard navigation, screen reader support

## Architecture

```
src/
├── components/
│   ├── navigation/     # TopBar, Sidebar, MobileNav
│   ├── ui/             # Skeleton loaders, shared UI
│   ├── video/          # VideoCard, RelatedVideoCard
│   └── player/         # YouTubePlayer (official embed)
├── pages/
│   ├── Home.tsx        # Home feed with categories
│   ├── Watch.tsx       # Video watch page
│   ├── Search.tsx      # Search results
│   ├── Channel.tsx     # Channel profile
│   └── ...
├── services/
│   └── youtube/
│       ├── client.ts   # API client with caching & quota
│       ├── search.ts   # Search service
│       ├── videos.ts   # Video metadata service
│       ├── channels.ts # Channel service
│       ├── comments.ts # Comments service
│       └── playlists.ts # Playlists service
├── hooks/              # Custom React hooks
├── types/              # TypeScript interfaces
└── App.tsx             # Main app with routing
```

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS v4
- **Routing:** React Router v6
- **Icons:** Lucide React
- **API:** YouTube Data API v3
- **Database:** Supabase (optional, for user data)
- **Player:** Official YouTube IFrame Player

## Prerequisites

- Node.js 18+ 
- npm or yarn
- YouTube Data API v3 key

## Installation

```bash
# Clone the repository
git clone <repo-url>
cd streamnest

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Add your YouTube API key to .env
# VITE_YOUTUBE_API_KEY=your_key_here

# Start development server
npm run dev
```

## YouTube API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **YouTube Data API v3**
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Copy the API key and add it to your `.env` file as `VITE_YOUTUBE_API_KEY`
6. (Recommended) Restrict the API key to your domain and the YouTube Data API

### API Quota

YouTube API has a daily quota of 10,000 units. Key operations cost:
- Search: 100 units
- Video details: 1 unit
- Channel details: 1 unit
- Comments: 1 unit

The app includes quota tracking and caching to minimize usage.

## Google OAuth Setup (Optional)

For authenticated features:

1. In Google Cloud Console, go to **APIs & Services** → **OAuth consent screen**
2. Configure the consent screen
3. Create **OAuth 2.0 Client ID** (Web application)
4. Add authorized JavaScript origins and redirect URIs
5. Add credentials to `.env`:
   ```
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   ```

## Supabase Setup (Optional)

For persistent user data (bookmarks, playlists, preferences):

1. Create a project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key
3. Add to `.env`:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

## Building

```bash
# Production build
npm run build

# Preview production build
npm run preview
```

## Deployment

### Vercel
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
# Deploy the dist/ folder
```

### Environment Variables in Production

Set these in your hosting platform's dashboard:
- `VITE_YOUTUBE_API_KEY` — Required
- `VITE_SUPABASE_URL` — Optional
- `VITE_SUPABASE_ANON_KEY` — Optional

## Security Notes

- Never commit `.env` files or API keys to version control
- The YouTube API key is exposed in the frontend (as designed by Google)
- Restrict your API key to specific domains in Google Cloud Console
- Never expose `GOOGLE_CLIENT_SECRET` in frontend code
- Use Row Level Security in Supabase for user data

## YouTube API Terms

This application:
- ✅ Uses the official YouTube Data API v3
- ✅ Uses the official YouTube IFrame Player for video playback
- ✅ Does not download, scrape, or proxy YouTube videos
- ✅ Does not bypass YouTube's playback restrictions or DRM
- ✅ Does not remove YouTube attribution
- ✅ Follows YouTube API Services Terms of Service

## License

MIT
