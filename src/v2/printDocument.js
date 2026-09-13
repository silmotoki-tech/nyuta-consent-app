import { displayOwnerName, displayPetName } from '../displayNames';
import { formatCheckedAt, visibleContentItems, visibleSlides } from './session';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function procedureLabel(selection) {
  if (!selection) return '—';
  const selected = selection.selected || [];
  const other = (selection.other || '').trim();
  const labels = selected.map((item) => (item === 'その他' && other ? `その他（${other}）` : item));
  return labels.length ? labels.join('、') : '—';
}

function itemText(text, foodPortions) {
  if (!text.includes('＿＿＿')) return text;
  const filled = String(foodPortions || '').trim();
  return filled ? text.replace('＿＿＿', filled) : text;
}

export function buildPrintHtml({
  session,
  documentDef,
  documentSession,
  recordImageDataUrl,
}) {
  const checks = visibleSlides(documentDef, session)
    .map((slide, index) => {
      const stamp = formatCheckedAt(documentSession.slideCheckTimestamps?.[slide.id]);
      return `<li>${index + 1}枚目：${escapeHtml(stamp || '未確認')}</li>`;
    })
    .join('');

  const items = visibleContentItems(documentDef.fullText.items, session)
    .map((item) => `<li>${escapeHtml(itemText(item.text, session.foodPortions))}</li>`)
    .join('');
  const footnotes = visibleContentItems(documentDef.fullText.footnotes, session)
    .map((item) => `<li>${escapeHtml(item.text)}</li>`)
    .join('');

  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(documentDef.label)}</title>
  <style>
    @page { size: A4; margin: 12mm; }
    html, body {
      margin: 0;
      background: #fff;
      color: #24333F;
      font-family: "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif;
    }
    body { padding: 8px 10px; }
    h1 { font-size: 18px; color: #3F6B2C; margin: 0 0 8px; }
    .meta { font-size: 12px; line-height: 1.7; margin-bottom: 10px; }
    .notice {
      font-size: 11px;
      line-height: 1.6;
      background: #EFF3E8;
      padding: 8px 10px;
      margin-bottom: 10px;
    }
    h2 { font-size: 13px; margin: 12px 0 6px; color: #6b4834; }
    ol, ul { margin: 0 0 8px; padding-left: 1.2em; }
    li { font-size: 11px; line-height: 1.65; }
    .record { width: 100%; margin-top: 10px; }
    .foot { font-size: 10px; color: #5B6975; margin-top: 8px; }
  </style>
</head>
<body>
  <h1>にゅうた動物病院　${escapeHtml(documentDef.label)}</h1>
  <div class="meta">
    飼い主：${escapeHtml(displayOwnerName(session.ownerName))}<br />
    動物：${escapeHtml(displayPetName(session.petName))}<br />
    日付：${escapeHtml(session.date)}　来院時間：${escapeHtml(session.visitTime || '—')}<br />
    内容：${escapeHtml(procedureLabel(session.procedureSelections?.[documentDef.id]))}<br />
    電話：${escapeHtml(session.phone || '—')}　緊急連絡先：${escapeHtml(session.emergencyContact || '—')}
  </div>
  <div class="notice">${escapeHtml(documentDef.fullText.noticeBar)}</div>
  <h2>お願い・注意事項</h2>
  <ol>${items}</ol>
  <h2>補足</h2>
  <ul>${footnotes}</ul>
  <h2>確認記録</h2>
  <ul>${checks}</ul>
  <p class="foot">説明した獣医師：${escapeHtml(documentSession.explainerStaff || '—')}　／　予定表に記入した人：${escapeHtml(documentSession.scheduleEntryStaff || '—')}　／　スライド版：${escapeHtml(documentDef.slideVersion)}</p>
  ${recordImageDataUrl ? `<img class="record" src="${recordImageDataUrl}" alt="確認記録付き署名" />` : ''}
</body>
</html>`;
}

export function openPrintWindow(html) {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer');
  if (!printWindow) return false;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  const tryPrint = () => {
    try {
      printWindow.focus();
      printWindow.print();
    } catch (error) {
      console.error('印刷ダイアログの起動に失敗しました:', error);
    }
  };
  printWindow.addEventListener('load', tryPrint);
  setTimeout(tryPrint, 400);
  return true;
}
