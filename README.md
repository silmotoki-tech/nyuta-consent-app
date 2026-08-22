# にゅうた動物病院 承諾書システム

院内の承諾書を iPad 上で入力・サイン・PDF 化し、印刷と Firebase への月別保存を行う業務アプリ。

公開URL: https://silmotoki-tech.github.io/nyuta-consent-app/

## 開発

```bash
npm install
npm run dev        # 開発サーバー
npm run build      # 本番ビルド
npm run preview    # ビルド結果を本番同様に確認
npm run lint       # oxlint
npm run deploy     # ビルドして GitHub Pages に反映
```

## E2E スモークテスト

「書類を選択 → 入力 → サイン → 保存」を実ブラウザで通しで実行し、PDF 生成・
Storage へのアップロード・Firestore への保存・印刷ダイアログの表示までを確認する。
Firebase はモックに差し替えているので、本番データには書き込まない。

```bash
npx playwright install chromium   # 初回のみ
npm run e2e                       # 全12書類をテスト
npm run e2e -- 胆嚢摘出術          # 書類を指定
```

生成された PDF は `e2e/out/` に出力されるので、レイアウトを目視確認できる。

## 依存パッケージの注意点

`trim-canvas`（`react-signature-canvas` が署名のトリミングに使う）は、
main が webpack UMD 形式の minified ファイルのため、Vite / Rollup の CJS interop で
`default` が二重にラップされてしまう。その状態で `getTrimmedCanvas()` を呼ぶと
`(0 , X.default) is not a function` になり、保存処理全体が失敗する。

`vite.config.js` で素の ESM ソース（`trim-canvas/index.es6`）に直接エイリアスして回避している。
このエイリアスを外すと同じ不具合が再発するので注意。
