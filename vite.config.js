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
      // trim-canvas@0.1.2 の main (build/index.js) は webpack UMD の minified 版で、
      // Vite/Rollup の CJS interop が __esModule を検出できず default が二重ラップされる。
      // その結果 react-signature-canvas の getTrimmedCanvas() 内で
      // 「(0 , X.default) is not a function」となり保存が失敗する。
      // 素の ESM ソース (index.es6) を直接参照させて回避する。
      'trim-canvas': path.resolve(rootDir, 'node_modules/trim-canvas/index.es6'),
    },
  },
  optimizeDeps: {
    include: ['html2canvas', 'html2pdf.js'],
  },
})
