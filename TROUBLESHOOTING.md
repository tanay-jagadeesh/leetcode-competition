# Troubleshooting Guide

Common issues and how to fix them.

## Installation Issues

### "npm install fails"

**Problem:** Dependencies won't install

**Solutions:**
```bash
# Clear cache
npm cache clean --force

# Delete and reinstall
rm -rf node_modules package-lock.json
npm install

# Use Node 18+
node --version  # Should be 18.x or higher
```

---

## Database Issues

### "Error: No problems available"

**Problem:** Problems table is empty

**Solution:**
1. Go to Supabase SQL Editor
2. Copy entire `seed-problems.sql`
3. Click "Run"
4. Verify 10 rows in problems table

### "Failed to fetch problems"

**Problem:** Database connection error

**Solutions:**
1. Check `.env.local` has correct keys
2. Verify Supabase project is active
3. Check RLS policies are enabled
4. Try restarting dev server

### "Insert/Update failed"

**Problem:** RLS policies blocking operations

**Solution:**
1. Go to Supabase Authentication → Policies
2. Verify these policies exist:
   - "Anyone can read problems"
   - "Anyone can insert matches"
   - "Anyone can update matches"
   - "Anyone can read/insert leaderboard"

---

## Real-time Issues

### "Opponent status not updating"

**Problem:** Realtime subscriptions not working

**Solutions:**
1. Enable Realtime in Supabase:
   - Database → Replication
   - Toggle `matches` table ON
2. Check browser console for errors
3. Verify Supabase keys in `.env.local`
4. Try incognito mode (extensions can block)

### "Match doesn't start"

**Problem:** Real-time channel not subscribing

**Solution:**
```bash
# Check Supabase logs
# Go to Supabase → Logs → API

# Common issue: RLS blocking updates
# Fix: Verify update policy exists
```

---

## Code Execution Issues

### "Code execution fails"

**Problem:** Piston API error or code syntax error

**Solutions:**
1. Check browser Network tab for failed requests
2. Verify code has no syntax errors
3. Test with simple code: `def two_sum(nums, target): return [0, 1]`
4. Piston API might be down (rare) - check https://github.com/engineer-man/piston

### "Timeout error"

**Problem:** Code takes too long (>5s)

**Solution:**
- Optimize your algorithm
- Piston has 5s timeout for safety
- Infinite loops will timeout

### "Wrong output format"

**Problem:** Your function returns wrong type

**Example:**
```python
# Wrong - returns string
def two_sum(nums, target):
    return "0,1"  # ❌

# Correct - returns array
def two_sum(nums, target):
    return [0, 1]  # ✓
```

---

## Matchmaking Issues

### "Stuck in queue forever"

**Problem:** Bot match not triggering

**Solutions:**
1. Wait full 30 seconds
2. Check browser console for errors
3. Verify problems exist in database
4. Clear sessionStorage and retry

### "Can't join existing match"

**Problem:** Race condition when multiple players queue

**Solution:**
- This is rare but can happen
- Just cancel and try again
- Bot fallback will work

---

## UI/Display Issues

### "Monaco editor not loading"

**Problem:** Editor component fails to load

**Solutions:**
```bash
# Reinstall Monaco
npm uninstall @monaco-editor/react
npm install @monaco-editor/react@^4.6.0

# Clear Next.js cache
rm -rf .next
npm run dev
```

### "Styles look broken"

**Problem:** Tailwind not compiling

**Solutions:**
```bash
# Rebuild Tailwind
npm run build

# Check tailwind.config.ts paths are correct
# Should include: './app/**/*.{js,ts,jsx,tsx}'
```

### "Confetti not showing"

**Problem:** Canvas-confetti not loaded

**Solution:**
```bash
npm install canvas-confetti @types/canvas-confetti
```

---

## Deployment Issues

### "Vercel build fails"

**Problem:** Build errors during deployment

**Solutions:**
1. Check build logs in Vercel dashboard
2. Ensure all dependencies in `package.json`
3. Fix TypeScript errors: `npm run build` locally
4. Verify Node version matches (18+)

### "Environment variables not working in production"

**Problem:** Env vars not set in Vercel

**Solutions:**
1. Go to Vercel project settings
2. Environment Variables section
3. Add both variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Redeploy: `vercel --prod --force`

### "502 Bad Gateway"

**Problem:** Vercel deployment in progress

**Solution:**
- Wait 2-3 minutes for deployment to complete
- Check Vercel dashboard for deployment status
- If persists >5 min, check build logs

---

## Session/Player Issues

### "Player role confused"

**Problem:** Shows as wrong player in match

**Solution:**
```javascript
// Clear session and retry
sessionStorage.clear()
// Refresh page
```

### "Can't play again"

**Problem:** Session stuck on old match

**Solution:**
1. Clear session storage in DevTools
2. Or use incognito mode for fresh session

---

## Performance Issues

### "Slow page loads"

**Problem:** Large bundle or slow API

**Solutions:**
1. Check Network tab in DevTools
2. Optimize images (if you added any)
3. Verify Supabase region matches Vercel region
4. Enable Vercel Edge Functions (Pro tier)

### "Editor lagging"

**Problem:** Monaco editor performance

**Solutions:**
1. Disable minimap (already done in code)
2. Reduce `fontSize` in editor options
3. Check for browser extensions interfering

---

## Data Issues

### "Leaderboard empty"

**Problem:** No completed matches with passing tests

**Solution:**
- Complete a match with all tests passing
- Leaderboard only shows successful submissions
- Check `leaderboard` table in Supabase

### "Timer shows wrong time"

**Problem:** Timer state not updating

**Solution:**
- Refresh the page
- Should be rare - timer uses local state

---

## Testing Issues

### "Can't test with 2 players"

**Problem:** Both tabs get bot matches

**Solution:**
1. Open 2 incognito windows
2. Click "Find Match" in BOTH within 1 second
3. They should match each other
4. If bot still appears, database lag - retry

---

## Mobile Issues

### "Editor unusable on phone"

**Expected:** Editor works best on desktop/tablet

**Workarounds:**
- Use landscape mode
- Increase font size
- Connect Bluetooth keyboard
- Desktop experience recommended

---

## Debug Commands

### Check Supabase connection
```javascript
// In browser console
const { data, error } = await supabase.from('problems').select('count')
console.log(data, error)
```

### Check environment variables
```javascript
// In browser console
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
// Should NOT be undefined
```

### Clear all local state
```javascript
// In browser console
sessionStorage.clear()
localStorage.clear()
location.reload()
```

---

## Still Having Issues?

1. **Check browser console** - Most errors show here
2. **Check Supabase logs** - Database issues show here
3. **Check Vercel logs** - Deployment issues show here
4. **Test in incognito** - Rules out extension issues
5. **Try different browser** - Rules out browser issues

## Get Help

If none of the above work:
1. Check GitHub Issues for similar problems
2. Open a new issue with:
   - Browser and version
   - Error message (full text)
   - Steps to reproduce
   - Screenshots if UI issue

---

**Pro tip:** Most issues are either:
- Missing environment variables
- Database not seeded
- Realtime not enabled
- RLS policies missing

Check these four first! ✓
