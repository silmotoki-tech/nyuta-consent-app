import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  base: '/nyuta-consent-app/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      'html2pdf.js': path.resolve(rootDir, 'node_modules/html2pdf.js/src/index.js'),
    },
  },
  optimizeDeps: {
    include: ['html2canvas', 'html2pdf.js'],
  },
})
