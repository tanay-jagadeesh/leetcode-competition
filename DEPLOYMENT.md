# Deployment Guide

This guide will help you deploy your 1v1 LeetCode Race app to production.

## Prerequisites

- GitHub account
- Vercel account (free tier works)
- Supabase account (free tier works)

## Step-by-Step Deployment

### 1. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be provisioned (~2 minutes)
3. Go to **SQL Editor** in the sidebar
4. Create a new query and paste the contents of `supabase-schema.sql`
5. Click **Run** to create all tables
6. Create another query and paste the contents of `seed-problems.sql`
7. Click **Run** to seed 10 problems

**Enable Realtime:**
1. Go to **Database** → **Replication**
2. Find the `matches` table
3. Toggle the switch to enable replication
4. Save changes

**Get API Keys:**
1. Go to **Settings** → **API**
2. Copy your **Project URL** (looks like: `https://xxxxx.supabase.co`)
3. Copy your **anon/public key** (long string starting with `eyJ...`)
4. Save these for the next step

### 2. Deploy to Vercel

**Option A: Deploy via GitHub (Recommended)**

1. Push your code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit - 1v1 LeetCode Race"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/leetcode-race.git
git push -u origin main
```

2. Go to [vercel.com](https://vercel.com)
3. Click **Add New Project**
4. Import your GitHub repository
5. Configure the project:
   - **Framework Preset:** Next.js
   - **Build Command:** `npm run build`
   - **Output Directory:** (leave default)

6. Add environment variables:
   - Click **Environment Variables**
   - Add `NEXT_PUBLIC_SUPABASE_URL` with your Supabase URL
   - Add `NEXT_PUBLIC_SUPABASE_ANON_KEY` with your Supabase anon key

7. Click **Deploy** and wait 2-3 minutes

**Option B: Deploy via CLI**

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. Follow prompts:
   - Link to existing project? **N**
   - Project name? **leetcode-race**
   - Directory? **./leetcode-competition-1**

5. Add environment variables:
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Paste your Supabase URL when prompted

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Paste your Supabase key when prompted
```

6. Deploy to production:
```bash
vercel --prod
```

### 3. Test Your Deployment

1. Open your Vercel URL (e.g., `https://leetcode-race.vercel.app`)
2. Click **Find Match**
3. Wait 30 seconds for bot match
4. Test coding and submission
5. Check if results page works
6. Verify leaderboard displays

**Test with a friend:**
1. Share your URL with someone
2. Both click "Find Match" at the same time
3. Verify you get matched together
4. Test real-time status updates

### 4. Custom Domain (Optional)

1. Go to your Vercel project dashboard
2. Click **Settings** → **Domains**
3. Add your domain (e.g., `leetcoderace.com`)
4. Follow DNS configuration instructions
5. Wait for DNS propagation (5-60 minutes)

### 5. Post-Deployment Checklist

- [ ] Landing page loads without errors
- [ ] "Find Match" button works
- [ ] Bot matches work after 30 seconds
- [ ] Code editor loads properly
- [ ] "Run Tests" executes code
- [ ] "Submit" validates solutions
- [ ] Real-time updates work (test with 2 tabs)
- [ ] Results page displays correctly
- [ ] Leaderboard shows entries
- [ ] Mobile layout works (test on phone)

## Troubleshooting

### "Error fetching problems"
- Verify you ran `seed-problems.sql` in Supabase
- Check Supabase SQL Editor for errors
- Verify RLS policies are enabled

### "Realtime not working"
- Enable Realtime in Supabase (Database → Replication)
- Check that `matches` table has replication enabled
- Try refreshing the page

### "Code execution fails"
- Piston API may be temporarily down (rare)
- Check browser console for errors
- Verify your code syntax is correct

### "Environment variables not working"
- Rebuild and redeploy: `vercel --prod --force`
- Check variables are set in Vercel dashboard
- Ensure variables start with `NEXT_PUBLIC_`

### "502 Bad Gateway"
- Vercel is deploying, wait 1-2 minutes
- Check Vercel deployment logs for errors
- Try redeploying

## Monitoring

### Vercel Analytics (Free)

1. Go to your project on Vercel
2. Click **Analytics** tab
3. View real-time traffic and performance

### Supabase Logs

1. Go to Supabase project
2. Click **Logs** → **API**
3. Monitor database queries and errors

### Error Tracking

Check Vercel deployment logs:
```bash
vercel logs
```

Or in dashboard: Project → Deployments → [latest] → View Logs

## Scaling

Your app can handle:
- **100+ concurrent users** on free tier
- **Unlimited matches** (Supabase free tier: 500MB database)
- **Unlimited code executions** (Piston API is free)

### If you outgrow free tier:

**Supabase Pro ($25/mo):**
- 8GB database
- Automatic backups
- Custom domains

**Vercel Pro ($20/mo):**
- Priority support
- Advanced analytics
- Team collaboration

## Security

### Important: Don't Commit Secrets

Ensure `.env.local` is in `.gitignore`:
```bash
echo ".env.local" >> .gitignore
git rm --cached .env.local  # If already committed
```

### Enable Rate Limiting (Optional)

Add to `next.config.js`:
```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-RateLimit-Limit', value: '100' },
          { key: 'X-RateLimit-Remaining', value: '99' },
        ],
      },
    ]
  },
}
```

## Updating Production

1. Make changes locally
2. Test thoroughly
3. Commit and push to GitHub:
```bash
git add .
git commit -m "Your update description"
git push
```

4. Vercel auto-deploys on push (takes 2-3 minutes)

Or manually deploy:
```bash
vercel --prod
```

## Rollback

If something breaks:

1. Go to Vercel dashboard
2. Click **Deployments**
3. Find previous working deployment
4. Click **⋯** → **Promote to Production**

Or via CLI:
```bash
vercel rollback
```

## Support

- **Vercel Issues:** [vercel.com/support](https://vercel.com/support)
- **Supabase Issues:** [supabase.com/support](https://supabase.com/support)
- **Project Issues:** Open GitHub issue

---

**You're live!** Share your app and get users competing! 🚀
