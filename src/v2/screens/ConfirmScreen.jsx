import React from 'react';
import { displayOwnerName, displayPetName } from '../../displayNames';

function procedureText(selection) {
  if (!selection) return '—';
  const selected = selection.selected || [];
  const other = (selection.other || '').trim();
  const labels = selected.map((item) => (item === 'その他' && other ? `その他（${other}）` : item));
  return labels.length ? labels.join('、') : '—';
}

export default function ConfirmScreen({ session, documentDef, onBack, onNext }) {
  const selection = session.procedureSelections[documentDef.id];

  return (
    <div className="max-w-3xl mx-auto p-5 md:p-8">
      <h1 className="text-[19px] font-medium text-nc-green mb-2">本日のご説明</h1>
      <p className="text-[13px] text-nc-ink-soft mb-6">名前や内容の取り違えがないか、この画面で確認します。</p>

      <div className="rounded-[8px] nc-hairline p-5 space-y-3 text-[15px] mb-8">
        <p>飼い主　{displayOwnerName(session.ownerName)}</p>
        <p>動物　{displayPetName(session.petName)}</p>
        <p>日付　{session.date}</p>
        <p>来院時間　{session.visitTime || '—'}</p>
        <p>書類　{documentDef.label}</p>
        <p>内容　{procedureText(selection)}</p>
        {session.foodPortions ? <p>フード持参　{session.foodPortions}回分</p> : null}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-3 rounded-[8px] text-[15px] nc-hairline text-nc-ink"
        >
          戻る
        </button>
        <button
          type="button"
          onClick={onNext}
          className="bg-nc-green text-nc-cream px-6 py-3 rounded-[8px] text-[15px]"
        >
          次へ
        </button>
      </div>
    </div>
  );
}
