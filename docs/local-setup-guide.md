# Nationhood — Local Development Setup Guide

This guide walks you through setting up Nationhood on your local PC so you can develop, test, and preview changes instantly without deploying.

---

## Prerequisites

You need two things installed on your PC:

### 1. Node.js (v18 or newer)

**Windows:**
1. Go to https://nodejs.org
2. Download the **LTS** version (the big green button)
3. Run the installer — accept all defaults
4. When it asks about "Tools for Native Modules," check the box (optional but helpful)

**Mac:**
```bash
# If you have Homebrew:
brew install node

# Otherwise, download from https://nodejs.org
```

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Verify it worked** — open a terminal/command prompt and run:
```bash
node --version    # Should show v18+ or v20+
npm --version     # Should show 9+ or 10+
```

### 2. Git

**Windows:**
1. Go to https://git-scm.com/download/win
2. Download and install — accept all defaults
3. This also gives you "Git Bash," a terminal you can use

**Mac:**
```bash
# Git comes with Xcode Command Line Tools:
xcode-select --install
```

**Linux:**
```bash
sudo apt-get install git
```

**Verify:**
```bash
git --version    # Should show git version 2.x
```

---

## Step 1: Clone the Repository

Open a terminal and navigate to where you want the project to live, then clone it:

```bash
# Navigate to where you want the project (e.g., your Documents folder)
cd ~/Documents

# Clone your repo
git clone https://github.com/TherranT11/nationhood.git

# Move into the project folder
cd nationhood
```

> **Already have it cloned?** Just `cd` into your existing `nationhood` folder and run `git pull` to get the latest changes.

---

## Step 2: Install Dependencies

From inside the `nationhood` folder, run:

```bash
npm install
```

This reads `package.json` and installs Vite (the build tool). It creates a `node_modules/` folder — this is normal and can be large. It's already in `.gitignore` so it won't be committed.

---

## Step 3: Create Your Environment File

The game needs to know where your Supabase database is. This is configured via environment files that are **not** stored in Git (for security).

### For the main environment:

Create a file called `.env.main` in the root of the project:

```bash
# On Mac/Linux:
touch .env.main

# On Windows (in Command Prompt):
echo. > .env.main
```

Open `.env.main` in any text editor and add these three lines:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_ENV=main
```

### Where to find your Supabase credentials:

1. Go to https://supabase.com and log in
2. Open your Nationhood project
3. Go to **Settings** → **API**
4. Copy the **Project URL** → paste as `VITE_SUPABASE_URL`
5. Copy the **anon/public** key under "Project API keys" → paste as `VITE_SUPABASE_ANON_KEY`

> **Important:** Use the `anon` key, NOT the `service_role` key. The service role key has full database access and should never be in frontend code.

### For the work/test environment (optional):

If you have a separate Supabase project for testing, create `.env.work` with the same format but pointing to your test project:

```env
VITE_SUPABASE_URL=https://your-work-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-work-anon-key-here
VITE_APP_ENV=work
```

---

## Step 4: Start the Dev Server

```bash
# Start the main environment:
npm run dev

# OR start the work/test environment (runs on port 3001):
npm run dev:work
```

You should see output like:

```
  VITE v7.x.x  ready in 200 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
  press h + enter to show help
```

**Open that URL in your browser** (usually http://localhost:5173) — you should see Nationhood running!

---

## Step 5: Develop!

Now you can edit any file and see changes instantly:

1. Open the project folder in your code editor (VS Code recommended)
2. Edit any `.html`, `.js`, or `.css` file
3. Save the file
4. **Your browser automatically updates** — no refresh needed (Vite hot-reloads)

### Useful pages to test:

| URL | Page |
|-----|------|
| `http://localhost:5173/login.html` | Login |
| `http://localhost:5173/dashboard.html` | Main dashboard |
| `http://localhost:5173/politics.html` | Political actions |
| `http://localhost:5173/government.html` | Government management |
| `http://localhost:5173/diplomacy.html` | Diplomacy |
| `http://localhost:5173/economy.html` | Economy |
| `http://localhost:5173/bills.html` | Legislation |

---

## Available npm Scripts

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start local dev server (main environment) |
| `npm run dev:work` | Start local dev server (work environment, port 3001) |
| `npm run build` | Build for production (outputs to `dist/`) |
| `npm run build:work` | Build work environment for production |
| `npm run seed:work` | Populate test data in work environment |
| `npm run snapshot:save` | Save a database snapshot |
| `npm run snapshot:restore` | Restore a database snapshot |
| `npm run lint:inline-scripts` | Check inline scripts for unsafe globals |
| `npm run sync:edge-function` | Regenerate the Supabase edge function from game modules |

---

## Recommended Code Editor

**Visual Studio Code (VS Code)** — free, works on Windows/Mac/Linux:

1. Download from https://code.visualstudio.com
2. Open VS Code
3. File → Open Folder → select your `nationhood` folder
4. You now have a full editor with file explorer, terminal, and Git integration

**Helpful VS Code extensions:**
- **Live Server** — alternative way to preview HTML files
- **ESLint** — JavaScript linting
- **GitLens** — enhanced Git history and blame

---

## Troubleshooting

### "command not found: npm"
Node.js isn't installed or isn't in your PATH. Reinstall Node.js and make sure to check "Add to PATH" during installation.

### "VITE_SUPABASE_URL is undefined" or blank page
Your `.env.main` file is missing or in the wrong location. It must be in the root of the project (same folder as `package.json`), and the variable names must start with `VITE_`.

### "Cannot connect to Supabase" / auth errors
- Double-check your Supabase URL and anon key in `.env.main`
- Make sure you're using the `anon` key, not the `service_role` key
- Check that your Supabase project is running (not paused)

### Port already in use
Another process is using port 5173. Either stop it, or run Vite on a different port:
```bash
npx vite --port 3000
```

### Changes not showing up
- Make sure you saved the file
- Hard refresh your browser: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Check the terminal for error messages

### "node_modules" is huge / taking forever
This is normal. `node_modules` can be large but it's not committed to Git. If it gets corrupted, delete it and run `npm install` again:
```bash
rm -rf node_modules
npm install
```

---

## How It All Connects

```
Your PC (local)                     Cloud (Supabase)
┌─────────────────────┐             ┌─────────────────────┐
│                     │             │                     │
│  Vite Dev Server    │             │  Supabase Project   │
│  (localhost:5173)   │             │                     │
│                     │  HTTP/S     │  ┌───────────────┐  │
│  ┌───────────────┐  │ ──────────► │  │  PostgreSQL    │  │
│  │  HTML/JS/CSS  │  │             │  │  Database      │  │
│  │  (your code)  │  │ ◄────────── │  │               │  │
│  └───────────────┘  │             │  └───────────────┘  │
│                     │             │                     │
│  .env.main          │             │  Edge Functions     │
│  (credentials)      │             │  (advance-tick)     │
│                     │             │                     │
└─────────────────────┘             └─────────────────────┘
```

- **Frontend (HTML, JS, CSS)** runs entirely on your PC via Vite
- **Database and auth** still run on Supabase in the cloud
- **Edge functions** (like the game tick) still run on Supabase
- You're only running the frontend locally — the backend stays in the cloud

This means you can freely experiment with UI changes, new pages, and JavaScript logic without affecting anything on the server side.

---

## Quick Start Summary

```bash
git clone https://github.com/TherranT11/nationhood.git
cd nationhood
npm install
# Create .env.main with your Supabase credentials (see Step 3)
npm run dev
# Open http://localhost:5173 in your browser
```

That's it — you're developing locally!
