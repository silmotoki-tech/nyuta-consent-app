import { formatCheckedAt } from './session';

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('画像の読み込みに失敗しました。'));
    image.src = src;
  });
}

export async function composeRecordImage({
  ownerName,
  petName,
  date,
  visitTime,
  documentLabel,
  slides,
  slideCheckTimestamps,
  signatureDataUrl,
  explainerStaff,
  scheduleEntryStaff,
}) {
  const width = 1600;
  const height = 560;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#FBF8F2';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#E4E0D4';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);

  ctx.fillStyle = '#3F6B2C';
  ctx.font = '600 28px "Hiragino Sans", sans-serif';
  ctx.fillText('確認記録', 40, 52);

  ctx.fillStyle = '#24333F';
  ctx.font = '22px "Hiragino Sans", sans-serif';
  const summary = [
    `${documentLabel}`,
    `飼い主：${ownerName}　様`,
    `動物：${petName}　ちゃん`,
    `日付：${date}　来院：${visitTime || '—'}`,
    `説明した獣医師：${explainerStaff || '—'}`,
    `予定表に記入した人：${scheduleEntryStaff || '—'}`,
  ];
  summary.forEach((line, index) => {
    ctx.fillText(line, 40, 100 + index * 34);
  });

  ctx.font = '20px "Hiragino Sans", sans-serif';
  ctx.fillStyle = '#6b4834';
  ctx.fillText('各スライドの確認時刻', 40, 330);
  ctx.fillStyle = '#24333F';
  slides.forEach((slide, index) => {
    const stamp = formatCheckedAt(slideCheckTimestamps?.[slide.id]);
    ctx.fillText(`${index + 1}枚目　${stamp || '未確認'}`, 40, 368 + index * 32);
  });

  if (signatureDataUrl) {
    const signature = await loadImage(signatureDataUrl);
    const boxX = 980;
    const boxY = 70;
    const boxW = 560;
    const boxH = 420;
    ctx.strokeStyle = '#24333F';
    ctx.strokeRect(boxX, boxY, boxW, boxH);
    ctx.fillStyle = '#5B6975';
    ctx.font = '18px "Hiragino Sans", sans-serif';
    ctx.fillText('ご署名', boxX, boxY - 12);

    const scale = Math.min((boxW - 24) / signature.width, (boxH - 24) / signature.height);
    const drawW = signature.width * scale;
    const drawH = signature.height * scale;
    ctx.drawImage(
      signature,
      boxX + (boxW - drawW) / 2,
      boxY + (boxH - drawH) / 2,
      drawW,
      drawH,
    );
  }

  return canvas.toDataURL('image/png');
}
