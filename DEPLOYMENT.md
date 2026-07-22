# Prodo Deployment Guide

This guide explains how to deploy all three components of the Prodo platform:
1. **Frontend Web App** (Cloudflare Pages)
2. **API Backend Worker & D1 Database** (Cloudflare Workers & D1)
3. **Computer Vision Focus Inference Engine** (Modal.com Serverless)

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

### B. Deploy Worker API
Deploy the TypeScript Worker API (`api.prodo.live`) to Cloudflare Workers:

```bash
cd server
npx wrangler deploy
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

Automated builds for **Windows, macOS, Linux, and Native Kotlin Android** are configured in `.github/workflows/build-desktop.yml`.

### A. Supported Build Artifacts
- **Windows**: `.msi` installer & `.exe` executable (`windows-latest`)
- **macOS**: `.dmg` disk image & `.app` bundle (`macos-latest`)
- **Linux**: `.AppImage` & `.deb` package (`ubuntu-22.04`)
- **Android**: `.apk` native Kotlin application package (`ubuntu-22.04`)

### B. Triggering Artifact Builds
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
