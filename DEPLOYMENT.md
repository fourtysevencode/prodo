# Prodo Web Frontend Deployment Guide
This document explains how to deploy the Prodo web platform across all supported subdomains (`www.prodo.live`, `prodo.live`, `dev.prodo.live`, `beta.prodo.live`).

---

## Deployment Architecture & Subdomains
- **`www.prodo.live`**: Public marketing & landing site.
- **`prodo.live`**: Main authenticated web application.
- **`dev.prodo.live`**: Developer portal (restricted to accounts with `isDev` flag, returns 403 Forbidden for unauthorized users).
- **`beta.prodo.live`**: Strictly routes to a **403 Forbidden** page.

---

## 1. Prerequisites

Ensure you have the following installed on your machine:
- **Node.js** (v18+) & **npm**
- **Cloudflare Wrangler CLI**: `npm install -g wrangler`
- **Python** (v3.11+) & **Modal CLI**: `pip install modal`

---

## 2. Cloudflare API Backend & Database Deployment

The API backend runs on Cloudflare Workers and connects to a serverless Cloudflare D1 SQL database (`prodo-db`).

### A. Apply Database Schema Migrations
If you make changes to `server/schema.sql`, execute the migrations:

```bash
cd server
# Execute schema on local D1 database
npx wrangler d1 execute prodo-db --local --file=schema.sql

# Execute schema on production D1 database
npx wrangler d1 execute prodo-db --remote --file=schema.sql
```

### B. Deploy Worker API (FastAPI Python)
Deploy the FastAPI Python Worker API (`api.prodo.live`) to Cloudflare Workers:

```bash
cd server
npx wrangler deploy
```

### C. Run Backend Automated Tests
Execute the Python test suite:

```bash
cd server
.venv/bin/pytest tests/test_api.py
```

---

## 3. Computer Vision Engine Deployment (Modal.com)

The heavy computer vision and landmark inference runs on Modal serverless runners.

### A. Authenticate Modal CLI (First Time Only)
```bash
modal token new
```

### B. Deploy Modal App
Deploy the ASGI application (`modal_app.py`) to Modal cloud:

```bash
cd server
python -m modal deploy modal_app.py
```

*The live deployment URL will be generated (e.g. `https://kazenoko-main--prodo-cv-fastapi-app.modal.run`).*

---

## 4. Frontend Web App Deployment (Cloudflare Pages)

The frontend React dashboard builds into static distribution assets deployed to Cloudflare Pages (`prodo.live`).

### A. Build and Deploy
```bash
cd web
npm run deploy
```

*This command automatically executes `npm run build` and runs `npx wrangler pages deploy dist --project-name prodo-live`.*

---

## 5. Automated CI/CD (GitHub Actions)

Every push to the `main` branch triggers `.github/workflows/deploy.yml`, which automatically builds and deploys all three components.

Ensure the following repository secrets are configured in GitHub (`Settings -> Secrets and variables -> Actions`):
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `MODAL_TOKEN_ID`
- `MODAL_TOKEN_SECRET`

---

## 6. Cross-Platform Desktop & Mobile Artifact Builds

### A. Local Desktop Build (Tauri + Rust)
To build and check the desktop application locally:

```bash
cd desktop
npm run build              # Builds Vite React distribution assets
cd src-tauri
cargo check                # Type-checks Rust backend
# Build release app package:
npx tauri build
```

### B. Local Android Build (Kotlin Gradle)
To build the native Android application locally:

```bash
cd mobile
./gradlew assembleDebug    # Generates debug APK at mobile/app/build/outputs/apk/debug/app-debug.apk
```

### C. Automated CI/CD Build Artifacts (GitHub Actions)
Automated builds for **Windows, macOS, Linux, and Native Kotlin Android** are configured in `.github/workflows/build-desktop.yml`.

- **Windows**: `.msi` installer & `.exe` executable (`windows-latest`)
- **macOS**: `.dmg` disk image & `.app` bundle (`macos-latest`)
- **Linux**: `.AppImage` & `.deb` package (`ubuntu-22.04`)
- **Android**: `.apk` native Kotlin application package (`ubuntu-22.04`)

### D. Triggering Artifact Builds
- Manual trigger available via GitHub Actions UI (**Workflow Dispatch**).
- Automatic release build on tag push (e.g., `git push origin v0.1.0`).
- Artifacts are downloadable directly from the GitHub Actions run details or drafted release tags.

---

## 7. Automated Security Scans & Vulnerability Audits

Automated security checks are configured in `.github/workflows/security.yml`:

- **CodeQL SAST Analysis**: GitHub static code analysis for JavaScript/TypeScript and Python.
- **NPM Vulnerability Audit**: Scans `web/` and `desktop/` npm dependencies.
- **Python Security Audit**: Runs `bandit` static analysis and `pip-audit` dependency check on `server/`.
- **Rust Crate Audit**: Runs `cargo audit` on `desktop/src-tauri/`.
- **Secret & Token Leak Detection**: Uses `gitleaks` to scan for hardcoded credentials or API keys.

---

## 8. Developer Portal & Telemetry (`dev.prodo.live`)

The developer site is served via Cloudflare Pages and Worker API for developer tooling:

1. **Custom Domain**: In Cloudflare Pages, add `dev.prodo.live` as a Custom Domain pointing to `prodo-live.pages.dev`.
2. **Dev Token Auth**: Access requires authenticating via `/dev/login` using developer credentials.
3. **Telemetry Logs**: All client telemetry dispatches (`/telemetry/log`) are persisted to D1 and inspectable in real-time on `dev.prodo.live`.

---

## 10. Troubleshooting Cloudflare Error 522 (Connection Timed Out)

### Verified Terminal Diagnostic Test Results
- `https://prodo-live.pages.dev` → **HTTP 200 OK** (Pages deployment live & healthy)
- `https://api.prodo.live` → **HTTP 200 OK** (Worker API live & healthy)
- `https://beta.prodo.live` → **HTTP 522** (Connection Timed Out - Cloudflare DNS pointing to unreachable origin IP)

### Cause of Error 522:
In Cloudflare DNS, `beta.prodo.live` resolves to an old origin IP address (`172.67.153.149` / `104.21.3.177`). Cloudflare attempts a TCP handshake to port 443 on that IP address, which times out after 15 seconds.

### Exact 2-Step Fix in Cloudflare Dashboard:

1. **Add Custom Domain in Cloudflare Pages**:
   - Go to **Cloudflare Dashboard** -> **Workers & Pages** -> **`prodo-live`**.
   - Select **Custom Domains** -> Click **Set up a custom domain**.
   - Enter `beta.prodo.live` and click **Continue**.

2. **Update DNS Record in Cloudflare DNS**:
   - Go to **Cloudflare Dashboard** -> Select domain `prodo.live` -> **DNS** -> **Records**.
   - Delete any existing **A/AAAA** records for `beta`.
   - Add/verify a **CNAME** record:
     - **Type**: `CNAME`
     - **Name**: `beta`
     - **Target**: `prodo-live.pages.dev`
     - **Proxy Status**: `Proxied` (Orange Cloud ON)



