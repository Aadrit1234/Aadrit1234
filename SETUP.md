# ⚙️ Profile Setup Guide — from zero to animated

Your new profile is **files in this repo**. Nothing is live until you push them to `Aadrit1234/Aadrit1234` on branch `main`.

## 1. Push these files

Copy everything in this workspace into the root of `Aadrit1234/Aadrit1234` (keep the folder structure):

```
README.md
assets/
  neon-banner.svg
  matrix-rain.svg
  side-by-side.svg
  terminal.svg
  hud.svg
  achievements.svg
  footer-wave.svg
.github/workflows/
  snake.yml
  profile-3d.yml
preview.html
```

One-time from the repo folder:

```bash
git add .
git commit -m "feat: cyber/neon animated profile redesign"
git push origin main
```

Then go to the **Actions tab** → the two workflows ("Generate Snake Animation", "Generate 3D Profile") run on push. Approve/run them if GitHub asks (first-time scheduled workflows need enabling in the Actions tab).

## 2. Snake + 3D graph go to the `output` branch

The workflows publish `github-snake.svg`, `github-snake-dark.svg` and the 3D graph (`profile-night-rainbow.svg`) to the **`output` branch**. The README loads them from `raw.githubusercontent.com/Aadrit1234/Aadrit1234/output/...`, so they appear automatically after the first run.

## 3. Verify render

Open https://github.com/Aadrit1234 — you should see the banner, matrix divider, side-by-side card, typing text, HUD, terminal, stats, trophies, skill icons, builds table, snake and 3D graph.

If something shows a broken image:
- **Stats card** uses a community mirror (`github-readme-stats-sigma-five.vercel.app`) because the official instance is frequently paused/503. If the mirror ever dies, re-deploy your own: https://github.com/anuraghazra/github-readme-stats (Deploy-to-Vercel button in its README) and swap the domain in `README.md`.
- **Streak stats, summary cards, quote card, ghchart calendar** — verified live; if one fails, it's a cold start, just wait and reload.
- **Snake / 3D** — run the workflows once manually: Actions → *Generate Snake Animation* → **Run workflow**; same for *Generate 3D Profile*.
- **Custom SVGs** — if one shows as broken, the file didn't push; check it exists at `assets/<name>.svg` on `main`.

## 4. Tweaking

- All custom animations live in `assets/*.svg` — edit and push, they update instantly.
- Typing line list: edit the `lines=` param of the readme-typing-svg URL in `README.md`.
- Colors: the palette is consistent (`#00ffe1`, `#ff2bd6`, `#c314ff`, `#ffd166`, `#00ff9d`) across all SVGs and stats URLs.
- To change the featured repos table: edit `SPOTLIGHTED BUILDS` in `README.md`.

## 5. Security notes

- No tokens or secrets in the repo — workflows use the built-in `GITHUB_TOKEN`.
- All external images are read-only public endpoints; nothing about your account is exposed beyond what's already public.
- Remove this file and `preview.html` from the repo if you want a cleaner tree (they don't render on the profile anyway).
