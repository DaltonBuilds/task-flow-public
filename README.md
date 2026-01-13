TaskFlow (Public)
==================

TaskFlow is a Kanban-style task manager running entirely on Cloudflare Workers with a D1 database and a static, theme-aware UI built with Tailwind CSS. This repository contains a sanitized version of the app suitable for cloning, learning, or extending.

Features
--------
- Boards, columns, tasks, subtasks, comments, recurrence, archive/trash, and activity log APIs under `/api/*`.
- Multiple views in the bundled UI (board, list, calendar), theme toggle, keyboard shortcuts, and offline banner cues.
- Cloudflare Access headers respected for protected routes; additional runtime checks included for production.
- CORS, request size limits, and per-method rate limiting baked in; request IDs and structured logging on every request.
- Health check at `/api/health` verifies worker liveness and D1 connectivity.
- Infrastructure as code provided via Terraform for D1 and Cloudflare Access policy scaffolding.

Architecture
------------
- **Runtime:** Cloudflare Workers using Hono for routing and middleware.
- **Data:** Cloudflare D1 (schema auto-created on first request by `initializeDatabase`).
- **Assets:** Static HTML/CSS/JS served from the worker (`public/` → `dist/`), styles built with Tailwind via PostCSS.
- **Config:** Wrangler for local dev/build/deploy; optional Terraform to provision D1 and Zero Trust Access.

Prerequisites
-------------
- Node.js 20+ and npm.
- Cloudflare account with D1 enabled.
- Wrangler CLI (`npm i -g wrangler`) authenticated with your account.
- (Optional) Terraform 1.5+ if you want to stand up infrastructure via IaC.

Local Development
-----------------
1) Install deps:
```
npm install
```
2) Ensure Wrangler has your account ID in `wrangler.jsonc` and that the `DB` binding exists (local `wrangler dev` will create an in-memory D1 by default).
3) Run dev servers in two terminals:
```
npm run dev:css          # Tailwind/PostCSS watch → public/static/main.css
npm run dev:sandbox      # Wrangler dev with local D1 on :3000
```
4) Open the app at the printed dev URL (default `http://localhost:3000`). API is under `/api/*`; the SPA is served from `/`.

Build & Deploy
--------------
- Build (worker + assets):
```
npm run build
```
- Preview with Wrangler using the built worker:
```
npm run preview
```
- Deploy to your default environment:
```
npm run deploy
```
- Deploy to the production environment defined in `wrangler.jsonc`:
```
npm run deploy:prod
```
Ensure the production `d1_databases` block has the correct `database_id` and that `routes`/custom domains are set before deploying.

Configuration
-------------
Wrangler bindings and env keys referenced in code:
- `DB` (required): Cloudflare D1 binding.
- `ENVIRONMENT` (optional): `development` | `staging` | `production` (defaults to development).
- `ALLOWED_ORIGINS` (recommended in prod): comma-separated list for CORS allowlist. In production, requests without an allowed origin are rejected.

Cloudflare Access
-----------------
The app honors Cloudflare Access headers (`CF-Access-*`) and enforces them for `/api/*` when `ENVIRONMENT=production`. If you use Zero Trust Access, set the application domain and allowed emails in Terraform (`terraform/access.tf`) or configure equivalent policies in the Cloudflare dashboard.

API Quick Peek
--------------
- `GET /api/health` – health and D1 connectivity check.
- `GET /api/boards` – list boards (optional `include_archived`, `include_deleted`).
- `POST /api/boards` – create a board (supports templates: `blank`, `simple`, `basic`, `extended`).
- `PATCH /api/boards/:boardId`, `DELETE /api/boards/:boardId?hard=true`.
- `POST /api/boards/:boardId/columns`, `PATCH /api/columns/:columnId`, `DELETE /api/columns/:columnId`.
- `POST /api/tasks`, `PATCH /api/tasks/:taskId` (supports recurrence, tags, priority, due dates).
- `POST /api/tasks/:taskId/subtasks`, `POST /api/tasks/:taskId/comments`, `GET /api/tasks/:taskId/comments`.
- `GET /api/trash`, `POST /api/trash/restore`, `DELETE /api/trash/purge`.
- `GET /api/analytics/summary` – aggregated board/task metrics.

Terraform (optional)
--------------------
If you want IaC-managed setup:
1) Copy `terraform/terraform.tfvars.example` to `terraform/terraform.tfvars` and fill in `cloudflare_account_id`, custom domain, and allowed emails.
2) Update `terraform/access.tf` with your domain (`cloudflare_zero_trust_access_application.taskflow.domain`).
3) Run:
```
cd terraform
terraform init
terraform plan
terraform apply
```
After apply, place the emitted D1 IDs into `wrangler.jsonc` (`database_id` fields).

Demo Mode (Static Deployment)
-----------------------------
This repo includes a **demo mode** that runs entirely in the browser using localStorage — no database or backend required. Perfect for showcasing the app to recruiters or deploying to any static hosting.

### How It Works
- `demo-api.js` intercepts all `/api/*` fetch requests and handles them with localStorage
- `demo-data.js` pre-seeds the app with a sample "Product Launch" board on first visit
- All CRUD operations work normally, but data is stored in the visitor's browser

### Build & Deploy Demo
```bash
npm run build:demo    # Builds static files to dist/
npm run preview:demo  # Preview locally on :3000
```

### Deploy to Static Hosting
After running `npm run build:demo`, deploy the `dist/` folder to any static host:

**Cloudflare Pages:**
```bash
npx wrangler pages deploy dist --project-name=taskflow-demo
```

**Vercel:**
```bash
cd dist && npx vercel --prod
```

**Netlify:**
```bash
npx netlify deploy --dir=dist --prod
```

**GitHub Pages:**
- This repo includes a ready-to-go GitHub Actions workflow at `.github/workflows/pages.yml`.
- In GitHub → **Settings → Pages**, select **Build and deployment → Source: GitHub Actions**.
- Push to `main` and the workflow will build and deploy the `dist/` folder.

If you prefer deploying manually (e.g. to a `gh-pages` branch), make sure you build with the correct base path (project Pages are served from `/<repo>/`):

```bash
BASE_PATH="/<repo-name>/" npm run build:demo
```

### Demo Features
- Pre-seeded board with sample tasks showcasing priorities, due dates, tags, and subtasks
- All views work (Board, List, Calendar)
- Data persists in visitor's browser localStorage
- "Reset Demo Data" option in the user menu to start fresh
- Demo mode banner indicates local storage usage

Useful Scripts
--------------
- `npm run dev` – Vite dev server (Hono adapter; handy for rapid iteration without Wrangler).
- `npm run dev:sandbox` – Wrangler dev with local D1.
- `npm run build` – Build CSS + worker bundle, rename to `_worker.js`.
- `npm run build:demo` – Build static demo with localStorage (no backend needed).
- `npm run preview` – Serve the built worker locally with Wrangler.
- `npm run preview:demo` – Serve the static demo locally.
- `npm run deploy` / `npm run deploy:prod` – Deploy via Wrangler.
- `npm run db:migrate:local` – Apply D1 migrations (placeholder; schema also initializes automatically at runtime).
- `npm run db:reset` – Reset local D1 state and reseed (if `seed.sql` is added).

Notes
-----
- CORS defaults to permissive in development and uses `ALLOWED_ORIGINS` in production.
- Request bodies over 1 MB are rejected; per-method rate limiting is enabled in `rateLimitByMethod`.
- The worker emits `X-Request-ID` per call and uses structured logs; observe them via `wrangler tail` in production.

Thanks for stopping by! 💙
