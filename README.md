# Brave Homepage

This is a minimal custom homepage you can use in Brave. It includes:

- A Google search bar that submits queries to Google.
- A pinned GitHub profile for `faizanfatmi` (click to open profile).

# Brave Homepage (Material UI)

This is a Material-inspired custom homepage for Brave containing:

- A Google search bar
- A digital clock widget
- A weather widget (uses Open-Meteo, no API key required)
- A pinned GitHub profile for `faizanfatmi`

Files:

- `index.html` — main page
- `styles.css` — Material-like styles
- `script.js` — clock, weather, and small UX behaviors

How to use

Option A — Open locally and set as Brave **Home** button address (Windows):

1. Move the `homepage` folder to a path you prefer (example: `C:\Users\You\Sites\homepage`).
2. In Brave settings → Appearance → enable **Show home button** and set the custom web address to:

```
file:///C:/Users/You/Sites/homepage/index.html
```

(If your path has spaces, replace spaces with `%20`.)

Option B — Serve locally and use `http://localhost` address:

From the `homepage` folder run (PowerShell / CMD):

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000` and set that as Brave's home address.

Weather notes

- The page uses Open-Meteo to fetch current weather by coordinates.
- It attempts to use the browser's geolocation API; if denied or unavailable it falls back to Karachi coordinates (you can change this in `script.js`).

If you want, I can:

- Add multiple pinned links and let you edit them via the UI.
- Add icons for weather conditions or switch to a different weather API.
- Bundle everything into a single self-contained `index.html` for easy installation.
