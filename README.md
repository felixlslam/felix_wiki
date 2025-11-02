Felix Wiki

This repository contains a minimal Wiki app with a React + Vite frontend and an Express backend that persists data to a JSON file. It supports multiple “spaces”, each with its own set of pages.

Structure
- `src/` — React + Vite frontend (TypeScript)
- `server/` — Express backend (JSON-file storage in `server/data/db.json`)
- `public/` — Static assets served by Vite
- `vite.config.js` — Vite config with API proxy to the backend

Quick start (dev)
1) Start the backend API

In a terminal:

```bash
cd server
npm install
npm run start
```

This starts the backend on http://localhost:4000.

2) Start the frontend dev server

In another terminal at the repository root:

```bash
npm install
npm run dev
```

The Vite dev server runs on an available port (commonly 5173/5174/5175) and proxies `/api` to `http://localhost:4000`.

Features
- Pages with Markdown editor and live preview
- Hierarchical page tree with compact spacing
- Multiple spaces
	- Create, rename, and delete spaces (the default space cannot be deleted)
	- Articles are scoped to a space
	- Deleting a space moves its articles to the default space

Notes
- Data is stored in a simple JSON file at `server/data/db.json` (no native DB dependencies).
- The frontend uses Material UI (MUI) for components and styling.

Next steps (optional)
- Migrate/add frontend tests at the root using Vitest + Testing Library
- Add a convenience script to run backend and frontend together (e.g., via `concurrently`)
