import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages serves this repo at /BOP-software-view/, so every asset and
// route must live under that base. `npm run build` outputs to dist/, which
// `npm run deploy` pushes to the gh-pages branch via the gh-pages package.
export default defineConfig({
  base: '/BOP-software-view/',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 900,
  },
})
