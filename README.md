
# Idonnu (IDONNU.EXE) 📼 ♡

> **Find something worth watching — no scrolling required.**  
> An AI-powered movie, TV series, and anime recommendation engine wrapped in an interactive Windows 98 / Vaporwave retro desktop environment.

---

## ⚡ Overview

Streaming services trap viewers in endless decision loops. **Idonnu** eliminates choice paralysis:
1. Answer **5 quick vibe questions** (format, mood, runtime, era/language, dealbreakers).
2. An **LLM (OpenAI GPT-4o)** analyzes your answers against real community-rated picks.
3. Receive **exactly one high-confidence recommendation** with a personalized rationale, rich metadata, and a permanent shareable permalink.

Built on **TanStack Start** (React 19 full-stack SSR), **Tailwind CSS v4**, **Drizzle ORM**, **PostgreSQL**, and dual metadata providers (**OMDB** & **Jikan / MyAnimeList**).

---

## 📸 Screenshots

| **Home & Questionnaire Flow (`QUEST.EXE`)** | **Recommendation Result & Pitch (`MATCH.DAT`)** |
|:---:|:---:|
| [![Home Screen](docs/screenshots/idunno-ecru.vercel.app-askkk.png) | [![Result Screen](docs/screenshots/idunno-ecru.vercel.app-result-56f12bb3-01aa-4116-bf97-f0f01.png)](docs/screenshots/idunno-ecru.vercel.app-result-56f12bb3-01aa-4116-bf97-f0f01.png) |
| *5-question vibe questionnaire on the retro desktop* | *Bespoke recommendation with full metadata and "Convince Me" pitch* |

---

## ✨ Features

### 🎬 5-Question Recommendation Flow (`QUEST.EXE`)
- **Database-driven questions**: Dynamic questions seeded in PostgreSQL, configurable on the fly without redeployment.
- **Smart multi-select**: Single-select content categories (Movie, TV, Anime, etc.) paired with multi-select preferences (genres, vibes, era).
- **Few-shot prompt injection**: Injects up to 3 historically successful recommendations (`feedback = 1`) sharing similar user answers into the LLM prompt to continuously improve suggestion accuracy.

### 🖥️ Windows 98 & Vaporwave Desktop Shell
- **Full Window Manager**: Draggable, resizable, stackable, and minimizable windows with active taskbar integration, Start menu, and system clock.
- **Display Properties (`DISPLAY.EXE`)**:
  - **4 Visual Themes**: Warm Cream (Default), Vaporwave Dream, Windows 98 Classic, and Black & White.
  - **Custom Wallpapers**: Real-time desktop wallpaper selector with retro tiling/fills.
  - **Audio Player**: Looping ambient chiptune & lofi background music tracks with volume control.
- **CRT & Scanline Effects**: Authentic scanline sweep animations, phosphor dot-grids, and pixel-shadow styling.
- **Aesthetic Desktop Gadgets**: Ambient pixel art image windows (`SUNSET.GIF`, `KITTY.JPG`).

### 📺 Rich Media Metadata & Dual Pipelines
- **Movies & TV Shows**: Queried through the **OMDB API** for IMDb ratings, release years, plot summaries, and posters.
- **Anime**: Queried via the **Jikan v4 API** (official MyAnimeList REST wrapper) with MAL IDs, genre badges, and anime artwork.

### 💾 Lists, Sync & User Accounts
- **Desktop Folders (`*.DIR`)**:
  - `WATCHLIST.DIR`: Save picks to watch later.
  - `FAVES.DIR`: Automatically tracks titles you gave a thumbs-up.
  - `HISTORY.DIR`: Chronological log of past sessions (persisted locally, synced with DB when logged in).
- **Authentication (`LOGIN.EXE` / `LOGOUT.EXE`)**: Lightweight user accounts for syncing watchlist and favorites across sessions and devices.

### 🔗 Social & Shareable Results (`MATCH.DAT`)
- **Server-Side Rendered (SSR) Permalinks**: `/result/$sessionId` fetches results directly in the route loader for SEO and social unfurls.
- **"Convince Me" Pitch**: Extra conversational rationale window detailing why this title fits your exact vibe.
- **Share Card Export**: One-click social card generation via `html-to-image`.
- **Feedback Loops**: Instant 👍 / 👎 buttons updating the database to refine future prompts.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Framework** | [TanStack Start](https://tanstack.com/start) (Full-stack SSR with Vite & Nitro) |
| **Frontend** | React 19, TypeScript, [Tailwind CSS v4](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com) |
| **Routing & State** | [TanStack Router](https://tanstack.com/router), [TanStack Query v5](https://tanstack.com/query) |
| **Database & ORM** | [PostgreSQL](https://www.postgresql.org), [Drizzle ORM](https://orm.drizzle.team), `drizzle-kit` |
| **AI / LLM** | [OpenAI API](https://openai.com) (GPT-4o structured JSON completions) |
| **External APIs** | [OMDB API](https://www.omdbapi.com) (Movies & TV), [Jikan API](https://jikan.moe) (Anime / MyAnimeList) |
| **Icons & Fonts** | [Lucide React](https://lucide.dev), Space Mono, Press Start 2P, VT323, Geist |

---

## 🏗️ Architecture & Data Flow

```text
Browser                           Server (TanStack Start)             External Services
───────                           ───────────────────────             ─────────────────
1. GET / ─────────────────────────> Redirects to /ask
2. GET /ask ──────────────────────> Loader calls getQuestions() ────> PostgreSQL (questions)
                                  <── Returns Question[]
3. User completes questionnaire
4. useRecommend.mutate(answers) ──> Server Function: recommend()
                                      ├── Validate answers (Zod)
                                      ├── Query similar picks ──────> PostgreSQL (picks)
                                      ├── Build few-shot prompt
                                      ├── OpenAI Chat Completion ───> GPT-4o (JSON Mode)
                                      ├── Fetch rich metadata ──────> OMDB or Jikan API
                                      └── Save session ─────────────> PostgreSQL (INSERT picks)
                                  <── Returns { sessionId, ... }
5. Navigate to /result/$sessionId
6. GET /result/$sessionId ────────> Loader calls getResult() ───────> PostgreSQL & OMDB/Jikan
                                  <── Fully rendered ResultPage (SSR)
7. User clicks 👍 / 👎 ───────────> Server Function: submitFeedback() > PostgreSQL (UPDATE picks)
```

---

## 📁 Repository Structure

```
idunno/
├── src/
│   ├── routes/                         # TanStack Router file-based routes
│   │   ├── __root.tsx                  # Root layout, providers, fonts, and desktop shell
│   │   ├── index.tsx                   # Redirects root to /ask
│   │   ├── ask.tsx                     # Questionnaire modal (QUEST.EXE)
│   │   └── result/
│   │       └── $sessionId.tsx          # Shareable SSR recommendation page (MATCH.DAT)
│   │
│   ├── features/                       # Modular feature domains
│   │   ├── question-flow/              # Question state machine, components, and loader
│   │   ├── recommendation/             # LLM orchestration, result card, share dialog
│   │   ├── feedback/                   # Thumbs up/down feedback & watchlist toggles
│   │   └── desktop-apps/               # FolderWindow, LoginWindow, LogoutWindow
│   │
│   ├── components/                     # UI primitives & desktop components
│   │   ├── desktop/                    # Window manager, taskbar, icons, Display Properties
│   │   └── ui/                         # shadcn/ui components (buttons, dialogs, inputs)
│   │
│   ├── lib/                            # Shared server libraries & clients
│   │   ├── db/                         # Drizzle client, schema, and queries
│   │   ├── llm/                        # OpenAI client, few-shot prompt builder
│   │   ├── omdb/                       # OMDB fetch client & queries
│   │   └── jikan/                      # Jikan v4 anime fetch client & queries
│   │
│   └── styles/
│       └── app.css                     # Tailwind v4, retro CRT overlays, themes & scanlines
│
├── drizzle/                            # Drizzle schema migrations & metadata
├── scripts/
│   └── seed-questions.ts               # Database question seeder
├── CONTEXT.md                          # Domain terminology & architectural reference
└── AGENTS.md                           # AI Agent coding guidelines & protocols
```

---

## ⚙️ Environment Variables

Create a `.env.local` file in the project root based on `.env.example`:

```env
# PostgreSQL connection string for runtime queries (Transaction pooler - port 6543)
DATABASE_URL=postgresql://user:password@host:6543/dbname

# PostgreSQL connection string for Drizzle migrations (Direct connection - port 5432)
DIRECT_URL=postgresql://user:password@host:5432/dbname

# OpenAI API Key (requires access to GPT-4o)
OPENAI_API_KEY=sk-...

# OMDB API Key (free tier available at https://www.omdbapi.com/apikey.aspx)
OMDB_API_KEY=your_omdb_key
OMDB_BASE_URL=https://www.omdbapi.com

# Client-accessible base URL (VITE_ prefix required)
VITE_APP_URL=http://localhost:3000
```

> **Note:** The Jikan v4 API is free, public, and requires no API key.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v20+ recommended)
- **pnpm** (preferred package manager)
- **PostgreSQL** database (e.g. Supabase, Neon, or local instance)

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Database Migration & Seeding
Push the database schema and populate the initial questionnaire set:
```bash
# Push schema changes to your database
pnpm db:push

# (Or run migrations if using migration files)
# pnpm db:migrate

# Seed the 5 default recommendation questions
pnpm db:seed
```

### 4. Run the Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Starts Vite development server with hot-module replacement |
| `pnpm build` | Builds client/server production bundle and checks types |
| `pnpm preview` | Locally previews the production build |
| `pnpm start` | Runs the compiled Nitro server in `.output/server/index.mjs` |
| `pnpm typecheck` | Runs TypeScript compiler checks without emitting files |
| `pnpm lint` | Runs ESLint across the codebase |
| `pnpm db:push` | Pushes Drizzle schema directly to the database |
| `pnpm db:generate`| Generates SQL migration files from `src/lib/db/schema.ts` |
| `pnpm db:migrate` | Runs pending Drizzle migrations |
| `pnpm db:studio` | Opens interactive Drizzle Studio database viewer |
| `pnpm db:seed` | Clears and seeds default questions via `scripts/seed-questions.ts` |

---

## 🗄️ Database Schema Summary

- **`questions`**: Active questions (`order`, `text`, `options` JSON array, `active` flag).
- **`picks`**: Stores recommendation sessions (`id` UUID / sessionId, user answers, title, media type, IMDb ID, MAL ID, rationale, feedback, watchlist flag).
- **`users`**: Optional user profiles (`username`, `password_hash`) for syncing saved collections.

---

## 📄 License

This project is private and intended for personal / demonstration use.
