# Cursor Local

This folder is a small **Cursor** workspace: **Cursor rules** live in `.cursor/rules/`, and the **public static site** lives in `website/`.

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

## Create the GitHub repository (reference)

### Option A — GitHub website

1. On GitHub: **New repository** (any name).
2. Leave it **empty** (no README template) if you want a clean first push.
3. Copy the repo URL, then from the repo root:

```bash
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git push -u origin main
```

### Option B — GitHub CLI

```bash
gh auth login
gh repo create YOUR_REPO_NAME --public --source=. --remote=origin --push
```

See [GitHub Pages docs](https://docs.github.com/pages) for custom domains and more.
