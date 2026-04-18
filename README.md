# Static site starter

Minimal HTML + CSS site, ready to host on **GitHub Pages** or any static host.

## Create the GitHub repository

### Option A — GitHub website

1. On GitHub: **New repository** (any name, e.g. `my-static-site`).
2. Leave it **empty** (no README, no .gitignore template) so your first push is clean.
3. Copy the repo URL, then in this folder run:

```bash
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git push -u origin main
```

### Option B — GitHub CLI

If you use [GitHub CLI](https://cli.github.com/) (`gh`), log in once:

```bash
gh auth login
```

Then create the repo from this folder (pick your name):

```bash
gh repo create YOUR_REPO_NAME --public --source=. --remote=origin --push
```

## Enable GitHub Pages

1. Repo **Settings** → **Pages**.
2. **Build and deployment** → Source: **Deploy from a branch**.
3. Branch: **main**, folder **/ (root)** → Save.

After a minute, the site is at `https://YOUR_USER.github.io/YOUR_REPO_NAME/` (unless you use a user/org site repo — see [GitHub Pages docs](https://docs.github.com/pages)).

## Local preview

Open `index.html` in a browser, or from this directory:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.
