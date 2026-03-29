# Naturkartan.ax

Interactive map for parks and outdoor areas in Aland, built as a static web app.

## Overview

Naturkartan.ax includes:

- Interactive Leaflet map with park markers.
- Park list, category filters, and search.
- UI translations (SV, EN, FI).
- User contribution flow for suggesting edits and new parks.
- Local admin interface for reviewing and maintaining park data.
- GitHub Pages deployment with GitHub Actions.

## Tech Stack

- HTML, CSS, vanilla JavaScript.
- Leaflet for maps.
- OpenStreetMap tiles.
- localStorage for local persistence.
- ImgBB API for optional photo upload in contributions.

## Project Files

- `index.html`: Main map app entry page.
- `app.js`: Core map logic, markers, filters, i18n rendering.
- `parks-data.js`: Default parks dataset and category config.
- `translations.js`: UI and content translations.
- `contribute.js`: Contribution modal and submission handling.
- `admin.html`: Admin page for editing parks/contributions.
- `admin.js`: Admin logic and local data management.
- `styles.css`: Main styling.
- `config.example.js`: Template for local configuration.
- `config.js`: Local config (gitignored).

## Local Development

### 1. Configure local API key

Copy the example config:

```bash
cp config.example.js config.js
```

Then set your ImgBB API key in `config.js`:

```js
window.ALAND_CONFIG = {
	imgbbApiKey: 'YOUR_IMGBB_API_KEY',
};
```

Notes:

- `config.js` is gitignored and should never be committed.
- If no valid key is present, photo upload is skipped.

### 2. Serve locally

Any static server works. Example with Node:

```bash
npx serve .
```

Then open the local URL shown in terminal.

## Data Model and Persistence

- Default parks are loaded from `parks-data.js`.
- Admin edits are saved to localStorage key `aland_parks`.
- User contributions are stored in localStorage key `aland_contributions`.
- Selected language is stored in localStorage key `aland_lang`.

Because persistence is browser-local, data does not automatically sync between devices.

## Admin Workflow

1. Open `admin.html` in the browser.
2. Add, edit, reposition, or delete parks.
3. Changes are saved to localStorage.
4. Review contributions and apply accepted changes.

If needed, export or copy data from admin tools and commit curated updates to `parks-data.js`.

## GitHub Pages Deployment

This repository includes a deploy workflow at `.github/workflows/deploy.yml`.

### Required setup

1. Push this project to a GitHub repository.
2. In repository settings, add secret:
	 - Name: `IMGBB_API_KEY`
	 - Value: your ImgBB API key
3. In Settings -> Pages, set Source to `GitHub Actions`.

### Deploy behavior

- Workflow runs on push to `main`.
- It writes `config.js` from the repository secret.
- It uploads the site and deploys to GitHub Pages.

Site URL format:

```text
https://<github-username>.github.io/<repository-name>/
```

## Troubleshooting

- Deployment fails: check Actions logs for `Deploy to GitHub Pages`.
- Site 404: confirm Pages source is set to `GitHub Actions`.
- Upload errors: verify `IMGBB_API_KEY` secret value is valid.
- Local changes not visible: hard refresh browser cache.

## License

Add your preferred license information here.