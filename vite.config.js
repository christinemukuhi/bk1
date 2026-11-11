import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// IMPORTANT: must match your GitHub repo name, e.g. https://USER.github.io/bible-puzzles/
// Change '/bible-puzzles/' if you name the repo something else.
const base = process.env.VITE_BASE || '/bible-puzzles/';

export default defineConfig({
  base,
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'favicon-16.png', 'favicon-32.png', 'apple-touch-icon.png'],
      workbox: { globPatterns: ['**/*.{js,css,html,json,svg,png,webp}'], maximumFileSizeToCacheInBytes: 5 * 1024 * 1024 },
      manifest: {
        name: 'Bible Puzzle Maker',
        short_name: 'Bible Puzzles',
        description: 'Make printable Bible puzzles for kids ages 5 to 13, with answer keys.',
        lang: 'en',
        categories: ['education', 'kids'],
        theme_color: '#1F3A5F',
        background_color: '#EAF2FA',
        display: 'standalone',
        orientation: 'any',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ]
});
