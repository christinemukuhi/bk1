# Bible Puzzle Maker (free version)

A free, installable web app (PWA) that makes printable Bible puzzles with sticker art and answer keys. Works offline once installed.

**What is in the free version**
- 30 Bible story themes
- 5 puzzle types: word search, crossword, word scramble (letters), verse scramble, fill in the blanks
- 3 age levels (5–7, 8–10, 11–13) that change the difficulty
- Answer key page, US Letter or A4, color or black-and-white stickers
- Verses from the World English Bible

**Not in the free version** (kept for the paid editions): puzzles from any passage in the whole Bible, "My own text" and custom word lists.

## Run it on your computer
```
npm install
npm test        # checks the puzzle engine, all 30 themes and the sticker files
npm run dev     # local dev server
npm run build   # production build into dist/
```

## Publish on GitHub Pages
1. Create a GitHub repository named `bible-puzzles`. If you pick another name, change `base` in `vite.config.js` to `'/your-repo-name/'`.
2. Upload this project and push it to the `main` branch.
3. In the repository, go to Settings, then Pages, and set Source to **GitHub Actions**.
4. Every push now tests, builds and publishes the app at `https://YOUR-USERNAME.github.io/bible-puzzles/`.
5. Open that address on your phone and on a computer, and test the install:
   - Chrome, Edge, Android: an **Install app** button appears in the header.
   - iPhone and iPad: Share, then **Add to Home Screen**.

## Connect it to your landing page
Open `src/config.js` and replace `https://YOUR-LANDING-PAGE-LINK` with your landing page address. A small "More puzzles are on the way" link then appears in the app. Until you change it, that link stays hidden.

## Icons
The app icon is the glowing puzzle piece, cross and open Bible. The original artwork is saved in `design/app-icon-original.png`. All the sizes are in `public/`:
- `icon-192.png` and `icon-512.png`: the installed app icon, with rounded corners
- `icon-maskable-512.png`: a version with extra space around the edge, so Android can crop it to a circle or any shape without cutting anything off
- `apple-touch-icon.png`: the iPhone and iPad home screen icon
- `favicon.ico`, `favicon-16.png`, `favicon-32.png`: the browser tab icon, cropped to the glowing puzzle piece so it stays clear at tiny sizes

To change the icon, replace those files and keep the same names and sizes.

## Where things live
- `src/engine.js`: puzzle engine, no page code (tested by `scripts/test-engine.mjs`)
- `src/app.js`: the interface, worksheet layout and printing
- `src/config.js`: your landing page link
- `src/data/themes.json`: the 30 themes with vocabulary, WEB verses and sticker lists
- `src/data/clues.json`: kid-friendly fallback crossword clues (review and edit these)
- `src/stickers/*.webp`: sticker images
- `src/style.css`: screen and print styles

## Before you share it widely
- The Old Testament text uses "Yahweh" (World English Bible). Decide whether to keep it.
- Confirm the license for the Bible text file and for the sticker artwork you ship, especially if you also sell paid editions.
