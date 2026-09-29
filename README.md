# Siete Safety Inspections

A Cloudflare Worker that serves the app (`public/index.html`) and its API (`src/worker.js`).
Inspections and checklists are stored in **D1**; photos in **R2**.

## Repo layout
```
wrangler.jsonc     Worker config: static files, D1 + R2 bindings
public/index.html  the app (single file)
src/worker.js      API: /api/health, /api/templates, /api/inspections, /api/photos
schema.sql         D1 tables
```

## One-time setup
1. **D1**: Storage & databases → D1 → Create → name `siete-inspections`. Open it → Console → paste `schema.sql` → Execute. Copy the **Database ID** from the database's overview.
2. **R2**: R2 → Create bucket → name `siete-photos` (keep it private).
3. **wrangler.jsonc**: in GitHub, edit the file and replace `PASTE-YOUR-D1-DATABASE-ID-HERE` with that Database ID. Commit.
4. **Build settings** (Workers & Pages → siete-inspections → Settings → Build): Build command empty, Deploy command `npx wrangler deploy`, Root directory `/`.
5. **Lock it down**: Zero Trust → Access → Applications → Add → Self-hosted → your `siete-inspections.<account>.workers.dev` domain. Allow only your company emails.

Each commit to `main` redeploys automatically. When the app opens on the live site it finds `/api/health` and uses the server. If the server can't be reached, it saves on the device and shows a notice.

## Updating the app
Replace `public/index.html` with the new build and commit.
