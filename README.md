# EduPulse

An AI-powered study platform built for Sri Lankan Advanced Level (A/L) students. EduPulse combines an AI tutor, model paper generator, PDF analyser, study planner, and community — all in one app.

---

## Features

| Feature | Description |
|---|---|
| **AI Tutor** | Real-time chat with an AI tutor. Supports Sinhala, English, and Tamil. Saves full conversation history with Supabase real-time sync. |
| **MCQ Paper Generator** | Generates Sri Lanka A/L model exam papers for any subject and difficulty level. Uses AI to produce curriculum-accurate questions. |
| **PDF Analysis** | Upload PDF or Word documents. AI extracts a summary, key concepts, and flashcards automatically. |
| **Study Planner** | Create and manage study tasks with priorities, due times, and a calendar view. |
| **My Library** | Unified history of all quiz results, PDF analyses, and AI tutor chats with real-time updates and delete support. |
| **Community** | Post questions, share tips, like and comment on posts. Real-time feed via Supabase. |
| **Notifications** | Real-time notification bell. Auto-notifies on quiz completion and community posts. Mark as read, delete. |
| **Language Switcher** | Switch between English 🇬🇧, Sinhala 🇱🇰, and Tamil 🇱🇰. All UI and AI responses change to the selected language. |
| **Dark Mode** | Toggle dark/light theme. Persisted in localStorage. |
| **Settings** | Edit profile, change password, manage notification preferences, switch language and theme. |

---

## Tech Stack

- **Frontend** — React 19, Vite 8, Tailwind CSS 4
- **Backend** — Node.js (embedded in Vite dev server via custom plugin), Vercel serverless functions for production
- **Database & Real-time** — Supabase (PostgreSQL + real-time subscriptions)
- **AI** — NVIDIA NIM API (OpenAI-compatible)
  - Tutor: `openai/gpt-oss-20b`
  - Quiz generation: `minimaxai/minimax-m3`
- **Auth** — Custom JWT auth (cookie-based, `bcryptjs` + `jsonwebtoken`)
- **Mobile** — Capacitor (Android build ready)

---

## Project Structure

```
EduPulseAI/
├── api/                        # Vercel serverless API handlers
│   ├── tutor.js                # POST /api/tutor
│   ├── analyze-pdf.js          # POST /api/analyze-pdf
│   └── generate-quiz.js        # POST /api/generate-quiz
├── server/
│   └── lib/
│       ├── tutor.js            # AI tutor logic
│       ├── generateQuiz.js     # MCQ paper generation
│       ├── analyzePdf.js       # Document analysis
│       ├── nvidia.js           # NVIDIA NIM client
│       └── auth.js             # JWT + bcrypt auth helpers
├── src/
│   ├── assets/                 # Logo, icons
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.jsx      # Top nav (notifications, language, dark mode)
│   │   │   ├── Sidebar.jsx     # Navigation sidebar
│   │   │   ├── Layout.jsx      # Page shell
│   │   │   └── NotificationBell.jsx  # Real-time notification dropdown
│   │   └── ui/                 # Reusable UI components
│   ├── context/
│   │   ├── AuthContext.jsx     # User session + settings
│   │   ├── ThemeContext.jsx    # Dark/light mode
│   │   └── LanguageContext.jsx # i18n (EN / SI / TA)
│   ├── lib/
│   │   ├── api.js              # Frontend API helpers
│   │   └── supabase.js         # Supabase client
│   └── pages/
│       ├── Dashboard.jsx
│       ├── AITutor.jsx
│       ├── Library.jsx
│       ├── PDFAnalysis.jsx
│       ├── Quizzes.jsx
│       ├── StudyPlanner.jsx
│       ├── Community.jsx
│       ├── Settings.jsx
│       ├── Login.jsx
│       └── Signup.jsx
├── scripts/
│   └── setup-notifications.sql
├── supabase-setup.sql          # Full database setup SQL
├── vite.config.js              # Vite + embedded API routes for dev
├── capacitor.config.ts         # Mobile (Android) config
└── .env                        # Environment variables
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- An [NVIDIA NIM](https://build.nvidia.com) API key

### 1. Clone & Install

```bash
git clone https://github.com/your-username/edupulse.git
cd edupulse
npm install
```

### 2. Environment Variables

Create a `.env` file in the project root:

```env
# NVIDIA NIM — AI models
NVIDIA_API_KEY=nvapi-your-key-here
NVIDIA_MODEL=openai/gpt-oss-20b

# JWT auth secret
JWT_SECRET=your-secret-key-here

# Supabase server-side (never expose to browser)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJ...your-service-role-key

# Supabase client-side (safe for browser)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key

# Optional: for mobile/production builds
VITE_API_BASE_URL=https://your-deployed-backend.com
```

Get your Supabase keys from: **Supabase Dashboard → Project Settings → API**

Get your NVIDIA API key from: **https://build.nvidia.com**

### 3. Set Up the Database

Run the SQL in your Supabase SQL Editor (**Dashboard → SQL Editor → New query**):

1. Run `supabase-setup.sql` — creates all core tables
2. Run `scripts/setup-notifications.sql` — creates notifications + triggers

Then grant access to the anon role:

```sql
ALTER TABLE public.posts           DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes      DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments   DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_chats     DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_messages  DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications   DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_results    DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_analyses    DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users           DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings   DISABLE ROW LEVEL SECURITY;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
```

### 4. Run the App

```bash
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Database Schema

| Table | Description |
|---|---|
| `users` | User accounts (name, email, hashed password, university, plan) |
| `user_settings` | Per-user preferences (notifications, dark mode, etc.) |
| `tutor_chats` | AI tutor conversation sessions |
| `tutor_messages` | Individual messages within tutor chats |
| `quiz_results` | Saved quiz scores and metadata |
| `pdf_analyses` | AI-generated analysis of uploaded documents |
| `posts` | Community posts |
| `post_likes` | Post like records |
| `post_comments` | Post comment records |
| `notifications` | In-app notifications (real-time) |
| `study_tasks` | Study planner tasks |
| `calendar_events` | Calendar events in study planner |

---

## API Routes

All routes are available at `/api/*` in both development (via Vite plugin) and production (Vercel functions).

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login and set auth cookie |
| `POST` | `/api/auth/logout` | Clear auth cookie |
| `GET`  | `/api/auth/me` | Get current user + settings |
| `PUT`  | `/api/users/profile` | Update profile |
| `PUT`  | `/api/users/password` | Change password |
| `GET`  | `/api/users/settings` | Get user settings |
| `PUT`  | `/api/users/settings` | Update user settings |
| `POST` | `/api/tutor` | Send message to AI tutor |
| `POST` | `/api/analyze-pdf` | Analyse document text with AI |
| `POST` | `/api/generate-quiz` | Generate A/L MCQ paper |

---

## Language Support

The app supports three languages switchable from the header or Settings page:

| Language | Code | Coverage |
|---|---|---|
| English | `en` | Full UI + AI responses |
| Sinhala (සිංහල) | `si` | Full UI + AI responses |
| Tamil (தமிழ்) | `ta` | Full UI + AI responses |

The selected language is persisted in `localStorage` and passed to the AI so responses match the user's language.

---

## Mobile (Android)

The app is configured for Android deployment via Capacitor.

```bash
npm run build
npx cap sync android
npx cap open android
```

For production mobile builds, set `VITE_API_BASE_URL` in `.env.production` to your deployed backend URL.

---

## Production Deployment

The API routes in `/api/*.js` are Vercel serverless functions. Deploy with:

```bash
npm run build
vercel deploy
```

Set all environment variables in the Vercel dashboard under **Project → Settings → Environment Variables**.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server (frontend + API) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

---

## License

MIT
