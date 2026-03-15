# Planning Poker Pro

Free real-time planning poker for agile teams. No sign-up required.

**Live site:** [planningpokerpro.com](https://planningpokerpro.com)

---

## What it does

- Create or join a planning room with a shareable code
- Vote on story points using Fibonacci, T-shirt sizes, or other decks
- Supports Dev and QA teams voting separately
- Optionally link Jira to import issues and write estimates back
- Works on desktop and mobile

---

## Tech Stack

### Backend
- **Node.js** — runtime
- **Express** — HTTP server, serves static files, handles REST API routes
- **Socket.IO** — real-time WebSocket layer; all game state (players joining, votes, reveals, round resets) is communicated via events over a persistent socket connection

### Frontend
- **Vanilla JS** — no frontend framework. A single `app.js` file handles all UI state, socket events, DOM updates, and animations
- **Plain HTML/CSS** — `index.html` is the entire app shell; CSS variables and media queries handle theming and mobile responsiveness
- **Physics engine** — bouncing card background animations are driven by a custom `requestAnimationFrame` loop with wall-collision detection, not CSS animations

### Infrastructure
- Cloud hosting with auto-deploy from GitHub on push to main
- Custom domain: `planningpokerpro.com`

### Integrations
- **Atlassian OAuth 2.0** — Jira link flow; tokens are stored in server memory only, never persisted to disk or a database

### Dependencies
```
express    ^4.18.2   HTTP server + routing
socket.io  ^4.7.4    WebSocket real-time communication
dotenv     ^17.3.1   Environment variable management
```

---

## Project Structure

```
planning-poker/
├── server.js          # Express server, Socket.IO game logic, Jira OAuth & API proxy
├── public/
│   ├── index.html     # App shell — all screens (landing, game) live here
│   ├── app.js         # All client-side logic
│   ├── style.css      # All styles including animations and mobile responsive
│   ├── favicon.svg    # App icon
│   ├── og-image.png   # Open Graph image for link previews
│   ├── manifest.json  # PWA manifest (Add to Home Screen support)
│   ├── robots.txt     # Search engine crawl rules
│   ├── privacy.html   # Privacy policy (served at /privacy)
│   └── 404.html       # Custom 404 page
├── package.json
└── .env               # Local env vars (not committed)
```

---

## Local Development

```bash
npm install
cp .env.example .env   # fill in your values
npm run dev            # starts server with --watch (auto-restarts on file changes)
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Port to run the server on (default: 3000) |
| `APP_URL` | Full URL of the app (e.g. `https://planningpokerpro.com`) |
| `ATLASSIAN_CLIENT_ID` | OAuth app client ID from developer.atlassian.com |
| `ATLASSIAN_CLIENT_SECRET` | OAuth app client secret |

---

## Architecture Notes

### Game State
All room state lives in memory on the server (`rooms` object in `server.js`). There is no database. If the server restarts, all active rooms are lost. This is intentional — rooms are ephemeral by design.

### Real-time Communication
Socket.IO handles all game events:
- `join-room` / `leave-room` — player joining/leaving
- `pick-card` — a player submits their vote
- `reveal` — host reveals all votes
- `new-round` — host resets for next story
- `add-issue` / `remove-issue` / `set-active-issue` — issue management

### Jira Integration
The server acts as a proxy between the client and the Atlassian API. OAuth tokens are stored in a `jiraSessions` object in memory and are refreshed automatically before expiry. Tokens are never written to disk.

---

## Deployment

The app auto-deploys to Render on every push to `main`. No build step required — it's plain HTML/JS/CSS served statically by Express.

Health check endpoint: `GET /health` → 200 OK
