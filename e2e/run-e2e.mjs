// 承諾書アプリのスモークテスト。
// 「書類を選択 → 入力 → サイン → 保存」を実際のブラウザで通しで実行し、
// PDF が生成され、Storage へのアップロード・Firestore への保存・印刷ダイアログ表示まで
// 一連の処理が呼ばれることを確認する。
// Firebase はモックに差し替えてあるため、本番データには一切書き込まない。
//
// 使い方:
//   npx playwright install chromium        # 初回のみ
//   npm run e2e                            # 全書類をテスト
//   npm run e2e -- 胆嚢摘出術               # 書類を指定してテスト
//
// 生成された PDF は e2e/out/ に書き出されるので、目視確認できる。

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(here, '..');
const outDir = path.join(here, 'out');
const PORT = 4177;
const BASE = `http://127.0.0.1:${PORT}`;

const ALL_FORMS = [
  '胆嚢摘出術',
  '軟口蓋切除術',
  '十字靭帯断裂手術',
  '膝蓋骨脱臼整復術',
  '抗がん剤副作用',
  '麻酔および手術における合併症について',
  '麻酔のおはなし',
  '入院・預かり承諾書',
  'ペットホテル承諾書',
  '検査注意事項',
  '一般手術注意事項',
  '循環器診療予約',
];

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: rootDir, stdio: 'inherit', shell: process.platform === 'win32' });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited with ${code}`))));
  });
}

async function waitForServer(url, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // まだ起動していない
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`プレビューサーバーが起動しませんでした: ${url}`);
}

async function testForm(page, label) {
  const errors = [];
  page.removeAllListeners('pageerror');
  page.removeAllListeners('console');
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  // サインのトリミングは失敗しても保存自体は続行するフォールバックがあるため、
  // 警告を拾わないと trim-canvas の読み込み不具合を見逃してしまう。
  page.on('console', (m) => {
    const text = m.text();
    if (text.includes('トリミングに失敗')) errors.push(`トリミング失敗: ${text}`);
  });

  await page.goto(`${BASE}/e2e/index.html`, { waitUntil: 'networkidle' });

  // 1. 書類を選択
  await page.locator('button', { hasText: label }).first().click();
  await page.waitForTimeout(400);

  // 2. 入力
  await page.locator('input[placeholder="動物 太郎"]').fill('動物 太郎');
  await page.locator('input[placeholder="例：ポチ"]').fill('ポチ');
  await page.locator('input[placeholder="12345"]').fill('12345');
  await page.locator('input[type="tel"]').first().fill('090-1111-2222');

  // 選択肢がある書類は最初の選択肢を選ぶ
  const radios = page.locator('input[type="radio"]');
  const seen = new Set();
  for (let i = 0; i < (await radios.count()); i++) {
    const name = await radios.nth(i).getAttribute('name');
    if (name && seen.has(name)) continue;
    if (name) seen.add(name);
    await radios.nth(i).check().catch(() => {});
  }
  const checks = page.locator('input[type="checkbox"]');
  if (await checks.count()) await checks.first().check().catch(() => {});

  // 3. サイン
  const canvas = page.locator('canvas').first();
  await canvas.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  const box = await canvas.boundingBox();
  await page.mouse.move(box.x + 40, box.y + 60);
  await page.mouse.down();
  for (let i = 0; i < 30; i++) {
    await page.mouse.move(box.x + 40 + i * 8, box.y + 60 + Math.sin(i / 3) * 30);
  }
  await page.mouse.up();
  await page.waitForTimeout(300);

  // 4. 保存
  const saveBtn = page.locator('button:has-text("保存して印刷")');
  await saveBtn.scrollIntoViewIfNeeded();
  await saveBtn.click();
  await page.waitForFunction(() => !document.body.innerText.includes('保存中...'), null, { timeout: 120000 });
  // openPrintDialog は 1.5 秒後にも print() を試みるので、それを待つ
  await page.waitForTimeout(2000);

  const result = await page.evaluate(() => ({
    calls: window.__calls.map((c) => c.fn),
    pdfPath: (window.__calls.find((c) => c.fn === 'uploadBytes') || {}).path,
    pdfSize: window.__pdfBlob ? window.__pdfBlob.size : null,
    saved: document.body.innerText.includes('保存しました'),
    failed: document.body.innerText.includes('保存に失敗'),
  }));

  if (result.pdfSize) {
    const bytes = await page.evaluate(async () => Array.from(new Uint8Array(await window.__pdfBlob.arrayBuffer())));
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, `${label}.pdf`), Buffer.from(bytes));
  }

  const expected = ['uploadBytes', 'getDownloadURL', 'addDoc', 'print'];
  const missing = expected.filter((fn) => !result.calls.includes(fn));
  const ok = result.saved && !result.failed && result.pdfSize > 0 && missing.length === 0 && errors.length === 0;

  return { ok, label, ...result, missing, errors };
}

const targets = process.argv.slice(2).length ? process.argv.slice(2) : ALL_FORMS;

console.log('E2E 用のビルドを作成しています...');
await run('npx', ['vite', 'build', '-c', 'vite.e2e.config.js']);

const server = spawn(
  'npx',
  [
    'vite',
    'preview',
    '-c',
    'vite.e2e.config.js',
    '--port',
    String(PORT),
    '--host',
    '127.0.0.1',
    '--outDir',
    'node_modules/.e2e-dist',
  ],
  { cwd: rootDir, stdio: 'ignore', shell: process.platform === 'win32' },
);

let failures = 0;
try {
  await waitForServer(`${BASE}/e2e/index.html`);
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1024, height: 1366 } });

  for (const label of targets) {
    const r = await testForm(page, label);
    if (!r.ok) failures++;
    console.log(
      `${r.ok ? '✓' : '✗'} ${label.padEnd(20)} PDF ${String(r.pdfSize ?? '-').padStart(8)} bytes  ${r.pdfPath ?? ''}` +
        (r.missing.length ? `  未呼び出し: ${r.missing.join(',')}` : '') +
        (r.errors.length ? `  ${r.errors.join(' / ')}` : ''),
    );
  }
  await browser.close();
} finally {
  server.kill();
}

console.log(failures === 0 ? `\nすべて成功 (${targets.length}件)` : `\n${failures}件 失敗`);
process.exit(failures === 0 ? 0 : 1);
