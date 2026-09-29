# Siete Safety Inspections

Static app (`public/index.html`) + API (`public/_worker.js`) on Cloudflare Pages.
Inspections and checklists are stored in **D1**; photos in **R2**.

## Repo layout
```
public/index.html            the app (single file)
public/_worker.js            API: /api/health, /api/templates, /api/inspections, /api/photos
schema.sql                   D1 tables
```

## One-time setup
1. **GitHub** – create a private repo (e.g. `siete-inspections`) and upload the contents of this folder (keep the folder structure).
2. **D1** – Cloudflare dashboard → Storage & Databases → D1 → Create → name `siete-inspections`. Open it → Console → paste `schema.sql` → Execute.
3. **R2** – R2 → Create bucket → name `siete-photos` (leave it private).
4. **Pages** – Workers & Pages → Create → Pages → Connect to Git → pick the repo.
   - Framework preset: **None** · Build command: *(empty)* · Output directory: **public**
5. **Bindings** – the new Pages project → Settings → Bindings → Add:
   - D1 database: variable name **DB** → `siete-inspections`
   - R2 bucket: variable name **PHOTOS** → `siete-photos`
   Then Deployments → Retry deployment so the bindings take effect.
6. **Lock it down** – Zero Trust → Access → Applications → Add → Self-hosted → your `*.pages.dev` domain (or custom domain). Allow your company email domain. Without this, anyone with the link can see inspections.

Open the site: the app detects `/api/health` and uses the server automatically. If the server is unreachable it falls back to the device and shows a notice.

## Updating
Any commit to the main branch redeploys automatically. For app changes, replace `public/index.html` with the new build.

## Notes
- Inspections created earlier in the standalone file stay on that device; they don't copy to the server.
- Photos are uploaded when an inspection saves; the database keeps only their links.
