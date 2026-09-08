# EduPulse AI — Smart Study Assistant

EduPulse AI is an AI-powered study platform designed for A/L (Advanced Level) students, particularly in the Sri Lankan education context. It combines an AI tutor, document analysis, quiz generation, study planning, and a peer community into a single app.

The project has two client implementations sharing one Node.js backend:

- **Flutter mobile app** (`flutter_app/`) — the primary, fully-featured Android/iOS client
- **React + Capacitor web app** (`src/`) — a web shell that can also be packaged as an Android APK

---

## Features

| Screen | Description |
|---|---|
| **Dashboard** | Overview of quiz stats, task progress, quick actions, and a live community feed |
| **AI Tutor** | Conversational AI chat powered by NVIDIA NIM (LLaMA 3.2), with Markdown rendering |
| **PDF Analysis** | Upload a PDF or TXT file and receive an AI-generated summary, key points, and topic list |
| **Study Planner** | Task manager with priorities and due times, plus a calendar — all synced via Supabase Realtime |
| **Quizzes** | 15 curated A/L subject quizzes plus AI-generated quizzes on any topic and difficulty |
| **Community** | Real-time social feed where students can post and like content |
| **Settings** | Edit profile, change password, toggle dark/light theme, switch language (English / Sinhala / Tamil) |

---

## Tech Stack

### Flutter App
- Flutter / Dart `>=3.0.0 <4.0.0`
- `provider` — state management (auth, theme, language)
- `supabase_flutter` — database queries and Realtime subscriptions
- `go_router` — navigation
- `http` — REST calls to the Node.js backend
- `file_picker` — PDF/TXT upload
- `flutter_markdown` — render AI responses
- `fl_chart` — charts and progress visualizations
- `flutter_localizations` — English, Sinhala, Tamil

### Node.js Backend
- Plain Node.js HTTP server (no framework), runs on port `3001`
- `openai` SDK pointed at the NVIDIA NIM API — all AI features
- `@supabase/supabase-js` — server-side DB access with service role key
- `jsonwebtoken` + `bcryptjs` — JWT auth (HttpOnly cookie, 7-day expiry)

### React / Capacitor (Web Shell)
- React 19 + React Router DOM 7
- Vite 8 with Tailwind CSS 4
- Capacitor 8 — wraps the Vite build as an Android APK
- `pdfjs-dist` + `mammoth` — in-browser PDF and DOCX parsing

---

## Prerequisites

- **Node.js** 18 or later + npm
- **Flutter** 3.x (Dart SDK `>=3.0.0`)
- **Android Studio** + Android SDK (for Android builds)
- **JDK 17+** (required by Gradle)
- A **Supabase** project with the required tables (see [Database Setup](#database-setup))
- An **NVIDIA NIM** API key from [build.nvidia.com](https://build.nvidia.com)

---

## Environment Setup

Copy `.env` and fill in the values:

```env
# AI (NVIDIA NIM)
NVIDIA_API_KEY=your_nvidia_api_key
NVIDIA_MODEL=meta/llama-3.2-11b-vision-instruct

# Auth
JWT_SECRET=your_jwt_secret

# Supabase (server-side — keep secret)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key

# Supabase (client-side — safe for browser)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# API base URL for mobile builds
VITE_API_BASE_URL=http://YOUR_LOCAL_IP:3001
```

> **Flutter app:** The Supabase URL, anon key, and backend URL are hardcoded in `flutter_app/lib/core/constants.dart`. Update `kSupabaseUrl`, `kSupabaseAnonKey`, and `kApiBaseUrl` before building.

---

## Database Setup

The following Supabase tables are required:

| Table | Purpose |
|---|---|
| `users` | User accounts (name, email, hashed password, university, bio) |
| `user_settings` | Per-user app settings |
| `quiz_results` | Quiz scores and metadata |
| `study_tasks` | Planner tasks with priority and due time |
| `calendar_events` | Calendar events |
| `posts` | Community feed posts |
| `post_likes` | Post likes (user ↔ post relationship) |

Enable **Realtime** on `quiz_results`, `study_tasks`, `calendar_events`, `posts`, and `post_likes`.

---

## Running Locally

### 1. Install dependencies

```bash
npm install
```

### 2. Start the backend

```bash
npm run server
# Runs on http://localhost:3001
```

### 3. Start the web frontend (dev)

The Vite dev server embeds the API routes, so you only need one server during development:

```bash
npm run dev
# Runs on http://localhost:5173
```

### 4. Run the Flutter app

```bash
cd flutter_app
flutter pub get
flutter run
```

Make sure your device/emulator can reach the Node.js backend. Update `kApiBaseUrl` in `constants.dart`:
- **Android emulator:** `http://10.0.2.2:3001`
- **Physical device (same WiFi):** `http://YOUR_PC_IP:3001`

---

## Building for Android

### Via Capacitor (React web app → APK)

```bash
# Build the web app and sync to Android project
npm run build:android

# Open in Android Studio
npm run open:android
```

### Via Flutter

```bash
cd flutter_app

# Debug APK
flutter build apk

# Release APK
flutter build apk --release

# App Bundle (for Play Store)
flutter build appbundle --release
```

---

## Project Structure

```
EduPulseAI/
├── flutter_app/               # Flutter mobile app (primary client)
│   └── lib/
│       ├── core/              # Constants, theme, API service
│       ├── providers/         # Auth, theme, language state
│       └── screens/           # Dashboard, Tutor, PDF, Planner, Quizzes, Community, Settings
├── server/                    # Node.js backend
│   └── lib/
│       ├── auth.js            # JWT auth, user management
│       ├── nvidia.js          # NVIDIA NIM client
│       ├── tutor.js           # AI tutor logic
│       ├── analyzePdf.js      # Document analysis
│       ├── generateQuiz.js    # Quiz generation
│       └── db.js              # Supabase server-side client
├── src/                       # React web app (Capacitor shell)
├── android/                   # Capacitor Android project
├── vite.config.js             # Vite config (embeds API routes in dev)
├── capacitor.config.ts        # Capacitor config
└── package.json
```

---

## API Endpoints

All endpoints are served by `server/index.js` (port `3001`) or embedded in the Vite dev server.

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create a new account |
| `POST` | `/api/auth/login` | Log in |
| `POST` | `/api/auth/logout` | Log out |
| `GET` | `/api/auth/me` | Get current user + settings |
| `PUT` | `/api/users/profile` | Update name, university, bio |
| `PUT` | `/api/users/password` | Change password |
| `GET` | `/api/users/settings` | Get user settings |
| `PUT` | `/api/users/settings` | Update user settings |
| `POST` | `/api/tutor` | Send message to AI tutor |
| `POST` | `/api/analyze-pdf` | Analyze document text |
| `POST` | `/api/generate-quiz` | Generate a custom quiz |

---

## Supported Languages

| Code | Language |
|---|---|
| `en-US` | English |
| `si-LK` | Sinhala (සිංහල) |
| `ta-LK` | Tamil (தமிழ்) |

Language and theme preferences are persisted locally via `shared_preferences`.

---

## License

This project is private and not licensed for public distribution.
