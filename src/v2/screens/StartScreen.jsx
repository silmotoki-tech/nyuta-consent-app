import React from 'react';
import { documents } from '../../documents';

const fieldClass = 'border-[0.5px] border-nc-line bg-nc-cream p-2.5 rounded-[8px] text-[15px] text-nc-ink';
const labelClass = 'text-[12px] text-nc-brown mb-1';

export default function StartScreen({ session, onChange, onNext, notice }) {
  const selection = session.procedureSelections.ippan_shujutsu || { selected: [], other: '' };

  const toggleDocument = (id, checked) => {
    const nextIds = checked
      ? [...new Set([...session.selectedDocumentIds, id])]
      : session.selectedDocumentIds.filter((value) => value !== id);
    onChange({ ...session, selectedDocumentIds: nextIds });
  };

  const toggleProcedure = (option, checked) => {
    const selected = checked
      ? [...new Set([...selection.selected, option])]
      : selection.selected.filter((value) => value !== option);
    onChange({
      ...session,
      procedureSelections: {
        ...session.procedureSelections,
        ippan_shujutsu: { ...selection, selected },
      },
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-5 md:p-8">
      <h1 className="text-[19px] font-medium text-nc-green mb-6 pb-3 border-b-[0.5px] border-nc-line">
        スタート
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="flex flex-col">
          <label className={labelClass}>飼い主氏名</label>
          <div className="flex items-center gap-2">
            <input
              className={`${fieldClass} w-[10em]`}
              value={session.ownerName}
              onChange={(e) => onChange({ ...session, ownerName: e.target.value })}
              placeholder="動物 太郎"
            />
            <span className="text-[15px] shrink-0">様</span>
          </div>
        </div>
        <div className="flex flex-col">
          <label className={labelClass}>動物の名前</label>
          <div className="flex items-center gap-2">
            <input
              className={`${fieldClass} w-[10em]`}
              value={session.petName}
              onChange={(e) => onChange({ ...session, petName: e.target.value })}
              placeholder="例：ポチ"
            />
            <span className="text-[15px] shrink-0">ちゃん</span>
          </div>
        </div>
        <div className="flex flex-col">
          <label className={labelClass}>日付</label>
          <input
            type="date"
            className={fieldClass}
            value={session.date}
            onChange={(e) => onChange({ ...session, date: e.target.value })}
          />
        </div>
        <div className="flex flex-col">
          <label className={labelClass}>来院時間</label>
          <input
            type="time"
            className={fieldClass}
            value={session.visitTime}
            onChange={(e) => onChange({ ...session, visitTime: e.target.value })}
          />
        </div>
        <div className="flex flex-col">
          <label className={labelClass}>フード持参（回分）</label>
          <input
            className={`${fieldClass} w-[8em]`}
            value={session.foodPortions}
            onChange={(e) => onChange({ ...session, foodPortions: e.target.value })}
            placeholder="例：2"
          />
        </div>
      </div>

      <section className="mb-6">
        <p className={labelClass}>書類</p>
        <div className="space-y-2">
          {documents.map((document) => (
            <label key={document.id} className="flex items-center gap-2 text-[15px]">
              <input
                type="checkbox"
                checked={session.selectedDocumentIds.includes(document.id)}
                onChange={(e) => toggleDocument(document.id, e.target.checked)}
              />
              {document.label}
            </label>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <p className={labelClass}>手術・処置の内容</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {documents[0].procedureOptions.map((option) => (
            <label key={option} className="flex items-center gap-2 text-[15px]">
              <input
                type="checkbox"
                checked={selection.selected.includes(option)}
                onChange={(e) => toggleProcedure(option, e.target.checked)}
              />
              {option}
            </label>
          ))}
        </div>
        {selection.selected.includes('その他') ? (
          <input
            className={`${fieldClass} mt-3 w-full`}
            value={selection.other}
            onChange={(e) => onChange({
              ...session,
              procedureSelections: {
                ...session.procedureSelections,
                ippan_shujutsu: { ...selection, other: e.target.value },
              },
            })}
            placeholder="その他の内容"
          />
        ) : null}
      </section>

      {notice ? <p className="text-[13px] text-nc-ink mb-3">{notice}</p> : null}

      <button
        type="button"
        onClick={onNext}
        className="bg-nc-green text-nc-cream px-6 py-3 rounded-[8px] text-[15px]"
      >
        確認画面へ
      </button>
    </div>
  );
}
