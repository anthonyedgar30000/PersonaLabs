# Persona Labs Chrome Extension MVP

This is a local-only Manifest V3 Chrome extension demo. It detects YouTube video cards and adds color-coded borders using deterministic mock scoring data. There is no AI service, backend, telemetry upload, or network integration.

## Features

- Detects common YouTube video card renderers on Home, Search, channel grids, playlists, and sidebars.
- Applies mock Persona alignment scores with color-coded borders:
  - Green: aligned
  - Yellow: neutral
  - Red: misaligned
- Adds a score badge to each decorated card with top scoring reasons and a hover tooltip.
- Uses a transparent Study Mode heuristic with educational keywords, tutorial indicators, long-form duration, low emotional language, technical terminology, Shorts detection, and outrage/clickbait penalties.
- Popup mode selector:
  - Study
  - Chill
  - Research
  - Bare Metal
- Stores the selected mode in `chrome.storage.local`.
- Bare Metal hides Persona styling without changing YouTube content.

## Local install

1. Open Chrome and go to `chrome://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked**.
4. Select this repository's `extension` directory.
5. Open `https://www.youtube.com`.

## Demo flow

1. Load the extension unpacked.
2. Visit YouTube Home or Search.
3. Open the Persona Labs extension popup.
4. Switch between Study, Chill, and Research to see cards rescored with different border colors.
5. Switch to Bare Metal to hide borders and badges.

## Implementation notes

- `content.js` owns all card detection and mock scoring.
- `content.css` owns card borders and badges.
- `popup.html`, `popup.css`, and `popup.js` own mode selection.
- Study Mode scoring is deterministic and explainable; Chill and Research remain lightweight mock keyword modes.
- In Study Mode, long-form technical tutorials should normally land in the aligned range unless Shorts, clickbait, or high-emotion penalties apply.
