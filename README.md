# PARTCONCEPTS project page

Static project page for *PARTCONCEPTS: A Unified Mechanism for Fine-Grained Part
Localization and Generation* (double-blind submission). Plain HTML/CSS/JS, no
build step.

## Publish it on GitHub Pages

1. Create a new GitHub repo (public). If it's named `<username>.github.io`, the
   site is served at the root; any other name works too and is served at
   `https://<username>.github.io/<repo-name>/`.
2. From this folder:
   ```bash
   git init
   git add .
   git commit -m "Initial project page"
   git branch -M main
   git remote add origin https://github.com/<username>/<repo-name>.git
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages → Build and deployment → Source → Deploy from
   a branch**, pick `main` / `(root)`, save. The page goes live at the URL
   above within a minute or two.

## Before sharing the link

- Author/affiliation fields are intentionally anonymized ("Anonymous
  Author(s)" / "Anonymous Institution") for double-blind review — do not
  fill these in until after the review period. The Code and arXiv buttons
  are still placeholders (`btn disabled` in `index.html`) — wire them up
  once those exist.
- `paper.pdf` is a local copy of the submitted PDF (~30MB). It's excluded
  from the repo via `.gitignore` and nothing currently links to it — add it
  back and point a "Paper (PDF)" button at it (or at arXiv/OpenReview
  instead) once you want that link live.

## Structure

```
index.html            all page content
assets/css/style.css   design tokens (light + dark via prefers-color-scheme) and layout
assets/js/main.js      BibTeX copy button, back-to-top button, gallery carousels
assets/img/            figures cropped from the paper PDF
assets/video/          hero teaser video
paper.pdf              local copy of the paper (gitignored, not currently linked)
```

Figures were cropped directly from the paper's rendered PDF pages (not the
paper's own embedded raster assets), so they include the paper's original
vector-drawn labels/arrows/captions baked in as pixels.
