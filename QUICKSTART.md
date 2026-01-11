# Quick Start Guide

Get your 1v1 LeetCode Race running in 5 minutes.

## 1. Install Dependencies

```bash
npm install
```

## 2. Set Up Supabase

### Create Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Wait ~2 minutes for provisioning

### Run SQL Scripts
1. Go to SQL Editor (left sidebar)
2. Copy/paste `supabase-schema.sql` → Run
3. Copy/paste `seed-problems.sql` → Run

### Enable Realtime
1. Go to Database → Replication
2. Enable replication for `matches` table

### Get API Keys
1. Go to Settings → API
2. Copy Project URL
3. Copy anon/public key

## 3. Configure Environment

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-key-here
```

## 4. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

## 5. Test It Works

1. Click "Find Match"
2. Wait 30 seconds for bot match
3. Try coding and submitting
4. Verify results page shows

## 6. Deploy to Production

```bash
# Push to GitHub
git init
git add .
git commit -m "Initial commit"
git push

# Deploy to Vercel
# Go to vercel.com → Import project → Add env vars → Deploy
```

## Common Issues

**"No problems available"**
→ Run `seed-problems.sql` in Supabase

**Realtime not working**
→ Enable replication for `matches` table

**Code execution fails**
→ Check browser console for errors

## Next Steps

- Test with 2 browser tabs (real-time updates)
- Customize problems in `seed-problems.sql`
- Adjust bot difficulty in race page
- Add custom domain in Vercel
- Share with friends!

---

Full documentation: See [README.md](README.md)
Deployment guide: See [DEPLOYMENT.md](DEPLOYMENT.md)
