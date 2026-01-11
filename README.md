# 1v1 LeetCode Race 🏆⚡

A real-time competitive coding game where two players race to solve the same LeetCode problem. First to submit a correct solution wins!

![Status](https://img.shields.io/badge/status-production-success)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## 🎮 Features

- **Real-time 1v1 Matches** - Get matched with another player instantly
- **Live Opponent Status** - See when they're coding, testing, or submitting
- **Monaco Editor** - Professional code editor with syntax highlighting
- **Instant Code Execution** - Run tests and validate solutions via Piston API
- **Bot Opponents** - Always have someone to play against, even when alone
- **Global Leaderboard** - Compete for the fastest solve times
- **Confetti Animations** - Celebrate victories in style
- **Production Ready** - Built for real users, not a demo

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- Vercel account (optional, for deployment)

### Installation

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Set up Supabase:**

   a. Create a new project at [supabase.com](https://supabase.com)

   b. Run the schema in Supabase SQL Editor:
   ```bash
   # Copy contents of supabase-schema.sql and run in Supabase SQL Editor
   ```

   c. Seed the database with 10 problems:
   ```bash
   # Copy contents of seed-problems.sql and run in Supabase SQL Editor
   ```

   d. Enable Realtime:
   - Go to Database > Replication
   - Enable replication for the `matches` table

3. **Configure environment variables:**

Create a `.env.local` file:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Get these from: Supabase Dashboard → Settings → API

4. **Run the development server:**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🎯 How It Works

### Game Flow

1. **Find Match** - Player clicks "Find Match" button
2. **Matchmaking** - System pairs with another player or bot (30s timeout)
3. **Race** - Both players see the same problem and code in Monaco editor
4. **Execute** - Players can run tests or submit solutions
5. **Winner** - First correct submission wins
6. **Results** - View winner, times, and leaderboard

### Architecture

```
Frontend (Next.js 14)
    ↓
Supabase Realtime ← Real-time match updates
    ↓
Supabase PostgreSQL ← Data storage
    ↓
Piston API ← Code execution
```

### Key Technologies

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling with dark gaming theme
- **Monaco Editor** - VS Code's editor component
- **Supabase** - PostgreSQL database + real-time subscriptions
- **Piston API** - Free code execution engine (supports 40+ languages)
- **Canvas Confetti** - Victory animations

## 📁 Project Structure

```
leetcode-competition-1/
├── app/
│   ├── page.tsx              # Landing page
│   ├── queue/page.tsx        # Matchmaking queue
│   ├── race/[matchId]/       # Race page with editor
│   ├── results/[matchId]/    # Results and leaderboard
│   ├── globals.css           # Global styles
│   └── layout.tsx            # Root layout
├── lib/
│   ├── supabase.ts           # Supabase client & types
│   └── code-executor.ts      # Piston API integration
├── supabase-schema.sql       # Database schema
├── seed-problems.sql         # 10 LeetCode problems
└── README.md                 # This file
```

## 🗄️ Database Schema

### Tables

**problems**
- Stores LeetCode problems with test cases
- Fields: title, description, difficulty, test_cases, starter_code, constraints

**matches**
- Tracks ongoing and completed matches
- Fields: problem_id, player1_id, player2_id, times, status, winner
- Real-time enabled for live updates

**leaderboard**
- Records fastest solve times per problem
- Fields: problem_id, username, time_ms, language

## 🎨 Customization

### Adding New Problems

Edit `seed-problems.sql` and add:

```sql
INSERT INTO problems (title, description, difficulty, test_cases, starter_code, constraints)
VALUES (
  'Your Problem Title',
  'Problem description with examples...',
  'easy',  -- or 'medium', 'hard'
  '[{"input": {...}, "expected_output": ..., "is_sample": true}]'::jsonb,
  '{"python": "def solution():\n    pass"}'::jsonb,
  'Constraints text'
);
```

### Adjusting Bot Difficulty

In `app/race/[matchId]/page.tsx`, line 95:
```typescript
const botDelay = 45000 + Math.random() * 75000  // 45-120 seconds
```

### Styling

Colors are defined in `tailwind.config.ts`:
```typescript
colors: {
  primary: '#6366f1',    // Indigo
  secondary: '#8b5cf6',  // Purple
}
```

## 🚢 Deployment

### Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

**One-click deploy:**
```bash
vercel --prod
```

### Environment Variables for Production

Set in Vercel Dashboard → Settings → Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key

## 🧪 Testing Checklist

Before deploying, verify:

- [ ] Landing page loads with stats
- [ ] Can click "Find Match" and reach queue
- [ ] Queue matches with bot after 30s
- [ ] Race page loads with problem and editor
- [ ] Can type code in Monaco editor
- [ ] "Run Tests" executes and shows results
- [ ] "Submit" validates all test cases
- [ ] Timer counts up correctly
- [ ] Opponent status updates in real-time
- [ ] Results page shows winner correctly
- [ ] Leaderboard displays top times
- [ ] "Play Again" starts new match
- [ ] Works on mobile (responsive)

**Test with 2 browser tabs:**
- Open 2 tabs in incognito mode
- Start match in both simultaneously
- Verify real-time status updates work

## 🐛 Troubleshooting

**"No problems available"**
- Run `seed-problems.sql` in Supabase SQL Editor

**Real-time not working**
- Enable Realtime for `matches` table in Supabase
- Check Supabase Dashboard → Database → Replication

**Code execution fails**
- Piston API might be down (check status)
- Verify your code syntax is correct
- Check browser console for errors

**Match not starting**
- Clear browser cache and retry
- Check Supabase credentials in `.env.local`

## 📊 Performance

- **Page Load:** <1s (optimized with Next.js)
- **Code Execution:** <500ms (Piston API)
- **Real-time Latency:** <100ms (Supabase Realtime)
- **Match Start:** Instant with bot, <30s with real player

## 🔐 Security

- Anonymous play (no authentication required)
- Row Level Security enabled on all tables
- Public read access only
- Code execution sandboxed by Piston API
- No sensitive data stored

## 🎯 Future Enhancements

**Phase 2 Features:**
- User authentication and profiles
- Multiple language support (JavaScript, Java, C++)
- Custom problems and private matches
- Friend system and invites
- Advanced rankings and ELO system
- Code complexity analysis
- Live chat during matches
- Tournament mode

## 📝 License

MIT License - feel free to use for your own projects!

## 🤝 Contributing

This is a production project. If you want to contribute:
1. Fork the repo
2. Create a feature branch
3. Test thoroughly
4. Submit a PR with clear description

## 🌟 Credits

Built with passion for competitive programming.

**Tech Stack:**
- Next.js by Vercel
- Supabase for backend
- Piston API for code execution
- Monaco Editor by Microsoft

---

**Ready to race?** Deploy and share with your developer friends!

For issues or questions, open a GitHub issue.
