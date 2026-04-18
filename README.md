# github-practice

This folder is one Git repository inside the local **`all-devs`** container (sibling to `_shell-*` templates). It is **not** the same as opening `all-devs` itself in the editor.

**Cursor rules** live in `.cursor/rules/`. The **public static site** lives in `website/`.

## Site (in `website/`)

The HTML, CSS, and JS for the GitHub Pages site are in the `website/` directory.

### Local preview

```bash
cd website
python3 -m http.server 8080
```

Open `http://localhost:8080`.

### GitHub Pages

This repo deploys the `website/` folder using **GitHub Actions** (see `.github/workflows/deploy-pages.yml`). In the repo on GitHub: **Settings → Pages → Build and deployment** should use **GitHub Actions** as the source.

After pushes to `main`, the workflow uploads that folder as the site.

## Supabase (backend)

1. Create a free project at [https://supabase.com](https://supabase.com) (new organization is fine).
2. In the dashboard: **Project Settings → API keys**. Copy **Project URL** and the **publishable** key (`sb_publishable_...`, safe for browsers). Do not use **secret** keys in the website folder (they bypass RLS and must stay server-side only).
3. **Local preview:** from `website/`, copy the example config and edit:

```bash
cd website
cp supabase-config.example.js supabase-config.js
```

Replace `YOUR_PROJECT_REF` and `YOUR_SUPABASE_PUBLISHABLE_KEY` in `supabase-config.js`. That file stays on your machine (it is gitignored). The code still accepts the legacy **anon** JWT export name `supabaseAnonKey` if you have an older local file.

4. **GitHub Pages:** add [repository secrets](https://docs.github.com/actions/security-guides/using-secrets-in-github-actions) `SUPABASE_URL` and **`SUPABASE_PUBLISHABLE_KEY`** with the same values. Until you rotate, the workflow also accepts the legacy secret name **`SUPABASE_ANON_KEY`**. The deploy job writes `supabase-config.js` with `supabasePublishableKey`. Protect data with [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security) on every table; the publishable key is public to anyone who loads your site.

5. Open the site and check the **Backend** box: it should say Supabase is connected after secrets are set and a deploy has run.

Use `@supabase/supabase-js` from `website/js/supabase-client.js` (ES module + `esm.sh`) for queries. Never put the **service_role** key in the website folder.

## Supabase VS Code extension (Cursor)

This workspace recommends the official **Supabase** extension so Cursor prompts you to install it when you open the folder (see `.vscode/extensions.json`).

1. Install the extension when prompted, or open **Extensions** and install **Supabase** (`supabase.vscode-supabase-extension`).
2. Install the **[Supabase CLI](https://supabase.com/docs/guides/cli/getting-started)** on your machine (`brew install supabase` on macOS is typical).
3. From the repo root, link your hosted project when you are ready: `supabase link` (uses your Supabase account; see CLI docs).
4. Use **`supabase db pull`** to sync remote schema into `supabase/migrations`, then the extension can inspect tables and migrations locally.

The extension focuses on **local CLI + schema/migrations**; the hosted dashboard is still where org and billing live.

## Create the GitHub repository (reference)

### Option A: GitHub website

1. On GitHub: **New repository** (any name).
2. Leave it **empty** (no README template) if you want a clean first push.
3. Copy the repo URL, then from the repo root:

```bash
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git push -u origin main
```

### Option B: GitHub CLI

```bash
gh auth login
gh repo create YOUR_REPO_NAME --public --source=. --remote=origin --push
```

See [GitHub Pages docs](https://docs.github.com/pages) for custom domains and more.
