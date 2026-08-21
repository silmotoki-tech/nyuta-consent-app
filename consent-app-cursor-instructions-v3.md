# nyuta-consent-app 次の実装指示 v3

デザイン適用（トークン反映）は完了。今回は本文コンテンツを流し込むための
スキーマ変更と、共通入力欄の追加を行う。まだ実際の文言は入れない
（次のフェーズで対応）。今回はあくまで「型」を正しく作ることが目的。

---

## 1. `formTypes.js` のスキーマ変更

### 1-1. `blocks` の導入（本文構造）
これまでの `bodyPlaceholder: true` を廃止し、`blocks` 配列に置き換える。
`blocks` は2種類のみ：

- `paragraph`：説明文（目的・内容・術後の経過など）
- `checklist`：箇条書き（注意事項・合併症・条項など）

```js
{
  id: 'gallbladder_removal',
  label: '胆嚢摘出術',
  category: 'surgery_explanation',
  importantPoint: null, // 次フェーズで文言を入れる。今は null でよい
  blocks: [
    { type: 'paragraph', title: '適応', body: '' },
    { type: 'paragraph', title: '手術の内容', body: '' },
    { type: 'checklist', title: '手術中および術後の注意事項', items: [] },
  ],
  attachmentIds: ['anesthesia_complications'],
}
```

`attachments` 配列（共通添付書類）も同様に `bodyPlaceholder` を廃止し、
`blocks` 形式に統一する。

### 1-2. `importantPoint` の個別化
これまで全書類共通で表示されていた固定の重要ポイント文言
（`PLACEHOLDER_IMPORTANT_TEXT`）を廃止し、`formTypes.js` 側の
`importantPoint` フィールド（書類ごとに設定、今は `null`）を参照する形にする。
`null` の場合は「ここが大事な点です」枠自体を表示しない。

### 1-3. 既存の全書類タイプ・添付書類を新スキーマに書き換え
`bodyPlaceholder: true` を使っている箇所をすべて `blocks: []`（空配列）に
置き換える。中身は次フェーズで埋めるため、今回は構造だけ用意すればよい。

---

## 2. `ConsentForm.jsx` の表示ロジック変更

- `blocks` を上から順にレンダリングする
  - `type: 'paragraph'` → タイトル＋本文の段落表示（既存のセクション見出し
    スタイル①②③を踏襲。番号は配列のインデックスから自動採番でよい）
  - `type: 'checklist'` → タイトル＋箇条書き（`items` を `<ul>` で表示、
    先頭に「・」等の簡素なマーカー）
- `importantPoint` が `null` でない場合のみ、既存の「ここが大事な点です」
  枠を表示する
- `blocks` が空配列（まだ文言未設定）の場合は、「準備中です」等の
  分かりやすいプレースホルダー表示にしておく（本番投入前に気づけるように）

---

## 3. 共通入力欄の追加（電話番号・緊急連絡先）

### 3-1. 入力フォーム
既存の「飼い主名・ペット名・日付」に加え、以下をすべてのカテゴリ共通で
追加する。

- 電話番号（`phone`）
- 緊急連絡先（`emergencyContact`）

住所・お預かり期間は今回は追加しない。

### 3-2. Firestore
`consents` コレクションの保存データに `phone` / `emergencyContact` を追加する。

```js
{
  formTypeId: "...",
  category: "...",
  ownerName: "...",
  petName: "...",
  phone: "...",            // 追加
  emergencyContact: "...", // 追加
  date: "...",
  yearMonth: "...",
  pdfPath: "...",
  pdfUrl: "...",
  createdAt: serverTimestamp(),
}
```

### 3-3. PDF出力
承諾書PDFの適当な位置（署名欄の近く、飼い主名・ペット名と並べる形が
自然）に、電話番号・緊急連絡先を表示する。

---

## 完了の定義（このフェーズ）
- [ ] `formTypes.js` の全書類タイプ・添付書類が `blocks` 形式になっている
- [ ] `importantPoint` が書類ごとの個別フィールドになっている（今は `null` でよい）
- [ ] `ConsentForm.jsx` が `blocks`（paragraph/checklist）を正しく描画する
- [ ] 電話番号・緊急連絡先の入力欄が追加され、Firestore・PDFに反映される
- [ ] `blocks` が空の書類は「準備中」等の分かりやすい表示になる

このフェーズが完了したら、次は実際の文言（紙の承諾書の内容）を
`blocks` に流し込む作業に進む。
