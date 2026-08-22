import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import base from './vite.config.js'

// 本番ビルドには一切影響しない、E2E スモークテスト専用のビルド設定。
// Firebase (Firestore / Storage) をモックに差し替え、ログインを介さずに
// ConsentForm だけを描画して「入力→サイン→保存→PDF生成→印刷」を通しで検証する。
// 出力先を node_modules 配下にしているのは、Tailwind のクラス走査対象から外し
// 本番の CSS に混入させないため。
const rootDir = path.dirname(fileURLToPath(import.meta.url))
export default defineConfig({
  ...base,
  base: '/',
  resolve: {
    alias: {
      ...base.resolve.alias,
      'firebase/firestore': path.resolve(rootDir, 'e2e/mock-firestore.js'),
      'firebase/storage': path.resolve(rootDir, 'e2e/mock-storage.js'),
    },
  },
  build: { outDir: 'node_modules/.e2e-dist', emptyOutDir: true, rollupOptions: { input: { index: path.resolve(rootDir, 'e2e/index.html') } } },
})
