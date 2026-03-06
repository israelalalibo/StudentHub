# Deploying E-com on Poseidon

This guide covers copying the project to Poseidon via the file manager and running it with environment variables in `~/.bash_profile` (as recommended by your school’s tech team).

---

## 1. What to copy (and what to exclude)

**Copy the whole E-com project folder**, but **do not copy** these (they are large, generated, or secret):

| Exclude | Reason |
|--------|--------|
| `node_modules/` | Very large; reinstall on Poseidon with `npm install`. |
| `ini.env` / `.env` / any `*.env` | Secrets; you will set env vars in `~/.bash_profile` instead. |
| `.git/` | Optional. Exclude if you want a smaller copy; include if you want version history on Poseidon. |
| `uploads/` | Local upload cache; not needed (app uses `./uploads` on Poseidon and writes temp files there). |
| `logs/`, `*.log` | Log files; not needed. |
| `dist/`, `build/`, `temp/` | Build/temp artifacts; not needed. |

**Optimal approach:**

- **Option A – File manager:** In your file manager, copy the entire `E-com` folder, then on Poseidon delete the excluded items above (especially `node_modules/` and any `*.env` / `ini.env`) after the copy.
- **Option B – Zip and exclude (if you can create a zip):** Create a zip of `E-com` excluding `node_modules`, `ini.env`, `.env`, `.git`, `uploads`, `logs`. Upload the zip to Poseidon and unzip there. Then run `npm install` (see below).

**Be aware:**

- Poseidon is likely **Linux** (case-sensitive). Filenames must match exactly (e.g. `server.js` not `Server.js`).
- **Line endings:** If you edit files on Windows and see odd errors on Poseidon, convert line endings to Unix (LF). Many editors have “CRLF” → “LF” or “Line ending: Unix”.

---

## 2. Environment variables on Poseidon (using `~/.bash_profile`)

Your tech contact said: use the **bash** shell and put environment variables in **`~/.bash_profile`** in your home directory.

1. **Check your shell (after SSH):**
   ```bash
   echo $SHELL
   ```
   If you see `/bin/bash`, use `~/.bash_profile` as below.

2. **Create or edit `~/.bash_profile`:**
   ```bash
   nano ~/.bash_profile
   ```
   (or use another editor: `vim`, `vi`, etc.)

3. **Add exports for the E-com app.** Use your real values (no quotes needed for simple values; use quotes if a value contains spaces):

   ```bash
   # E-com / StudentHub
   export PORT=3000
   export SUPABASE_URL=https://bfpaawywaljnfudynnke.supabase.co
   export SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
   export STRIPE_SECRET_KEY=your_stripe_secret_key_here
   export STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
   export SITE_URL=https://your-poseidon-url-or-domain
   export GOOGLE_API_KEY=your_google_or_gemini_api_key_here
   ```

   Notes:

   - **SUPABASE_SERVICE_ROLE_KEY** – From Supabase: Project → Settings → API → `service_role` (keep secret).
   - **STRIPE_*** – From Stripe Dashboard (API keys, Webhooks).
   - **SITE_URL** – Full URL where the app will be accessed (e.g. `https://poseidon.school.edu/~yourusername/ecom` or whatever Poseidon uses). Required for Stripe redirects and links.
   - **GOOGLE_API_KEY** – Used for Gemini (AI Book Valuator) and possibly Google Books; the app also checks `GEMINI_API_KEY`, so you can use `export GEMINI_API_KEY=...` instead if you prefer.

4. **Do not set `VERCEL`.** On Poseidon the app is not on Vercel, so the server will use `./uploads` for temporary product images (and will listen on `PORT`).

5. **Load the new variables** (for the current session):
   ```bash
   source ~/.bash_profile
   ```
   New SSH sessions will load it automatically.

6. **Verify (optional):**
   ```bash
   echo $SUPABASE_URL
   echo $PORT
   ```

---

## 3. After copying the project: install and run

1. **Go to the project directory** (adjust path to where you pasted E-com):
   ```bash
   cd ~/E-com
   ```
   or e.g. `cd ~/public_html/E-com` if that’s where you put it.

2. **Install dependencies** (required; do not rely on copied `node_modules`):
   ```bash
   npm install
   ```

3. **Create uploads directory** (so product image uploads work):
   ```bash
   mkdir -p uploads
   ```

4. **Start the server:**
   ```bash
   npm start
   ```
   or:
   ```bash
   node server.js
   ```
   The app uses `PORT` from the environment (e.g. 3000). If Poseidon assigns a port, set it in `~/.bash_profile`, e.g. `export PORT=8080`, then `source ~/.bash_profile` and run again.

5. **Long-running run (optional).** If you need it to keep running after you disconnect:
   - Use something like `tmux` or `screen`, or
   - A process manager (e.g. `pm2`) if available on Poseidon.

---

## 4. Summary checklist

- [ ] Copy E-com to Poseidon (exclude `node_modules`, `ini.env` / `.env`, optionally `.git`, `uploads`, logs).
- [ ] Add all required env vars to `~/.bash_profile` and run `source ~/.bash_profile`.
- [ ] In the project directory: `npm install`, `mkdir -p uploads`, `npm start`.
- [ ] Set `SITE_URL` to the real URL users will use to access the app.
- [ ] If the app is behind a reverse proxy or different port, set `PORT` accordingly and ensure `SITE_URL` matches how users reach the app.

---

## 5. Troubleshooting

### "Cannot find module 'node:events'" (or similar `node:...` errors)

Poseidon’s Node.js is older than Node 18. **Express 5** uses the `node:` protocol and requires Node 18+, so it fails. The project pins **Express 4.18.2** and uses an **overrides** entry so only Express 4 is installed.

**Fix (do this on Poseidon):**

1. **Copy the latest `package.json`** from your project to Poseidon so it has `"express": "4.18.2"` and the `"overrides"` block. Overwrite the existing file under `~/public_html/E-com/`.

2. **Remove existing install and reinstall** so `node_modules` uses Express 4, not 5:
   ```bash
   cd ~/public_html/E-com
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Confirm Express 4 is installed** (optional):
   ```bash
   npm list express
   ```
   You should see `express@4.18.2`. If you see `5.x`, `package.json` on Poseidon is still old — copy it again and repeat from step 2.

4. **Start the app:**
   ```bash
   npm start
   ```

If `npm install` fails with an error about `overrides` (old npm on Poseidon), edit `package.json` on Poseidon and remove the `"overrides": { "express": "4.18.2" }` block. Keeping `"express": "4.18.2"` in `dependencies` is enough.

This error can also appear for other packages that use `node:...` on old Node; pinning Express and reinstalling fixes the usual case. If another package fails the same way, ask IT whether Node 18+ is available (e.g. via `nvm`).

### "Unexpected token '.'" (optional chaining)

Optional chaining (`?.`) is not supported on older Node. The codebase has been updated to avoid it so the app runs on Poseidon.

### 404 on sign-in or other API calls (e.g. POST /signin)

**Symptom:** The browser shows `404 Not Found` for `/signin` (or other API routes), and the response is HTML from **Apache**, not JSON from your app.

**Cause:** You’re opening the site on **port 80** (e.g. `http://randi-kishinev.poseidon.salford.ac.uk`). That is served by **Apache**. Your Node app is running on a different port (e.g. 3000). The frontend uses relative URLs like `/signin`, so the request goes to Apache (port 80), which has no `/signin` route and returns its default 404 page. The Node app never receives the request.

**Fix (use the Node port):**

1. Open the app using the **same port** your Node server uses, for example:
   - `http://randi-kishinev.poseidon.salford.ac.uk:3000`
   (Replace `3000` with your `PORT` if you set something else in `~/.bash_profile`.)
2. Use that URL for everything: bookmark it, share it, and set `SITE_URL` in `~/.bash_profile` to that URL (including the port), e.g.:
   ```bash
   export SITE_URL=http://randi-kishinev.poseidon.salford.ac.uk:3000
   ```

Then sign-in and all API calls will go to Node and work.

**If port 80 is required (no port in the URL):** Apache must be configured to **reverse-proxy** to your Node app (e.g. forward `http://.../` to `http://127.0.0.1:3000/`). That is usually done by IT or in the server’s Apache config (e.g. `ProxyPass` / `ProxyPassReverse`). Ask your tech contact whether student accounts can enable this or if they can set it up for your subdomain.

---

## 6. Env vars quick reference

| Variable | Required | Purpose |
|----------|----------|--------|
| `SUPABASE_URL` | Yes | Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-side). |
| `STRIPE_SECRET_KEY` | Yes for payments | Stripe API secret key. |
| `STRIPE_WEBHOOK_SECRET` | Yes for webhooks | Stripe webhook signing secret. |
| `SITE_URL` | Yes for Stripe/links | Public base URL of the app. |
| `PORT` | No (default 3000) | Port the Node server listens on. |
| `GOOGLE_API_KEY` or `GEMINI_API_KEY` | No (optional) | For AI Book Valuator / Google APIs. |

Your `ini.env` file locally is the same as these exports; on Poseidon you replace it with `~/.bash_profile` as described above.

**Note:** The project uses Express 4.18.2 in `package.json` so it runs on Poseidon’s older Node. Locally you can still use Node 18+ with Express 4 (it works fine).
