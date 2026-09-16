import React from 'react';
import { documents } from '../../documents';
import { emptySelection } from '../session';

const fieldClass = 'border-[0.5px] border-nc-line bg-nc-cream p-2.5 rounded-[8px] text-[15px] text-nc-ink';
const labelClass = 'text-[12px] text-nc-brown mb-1';

export default function StartScreen({ session, onChange, onNext, notice }) {
  const selectedIds = session.selectedDocumentIds || [];
  const primaryDocument = documents.find((document) => document.id === selectedIds[0]) || null;
  const procedureOptions = primaryDocument?.procedureOptions || [];
  const procedureSelection = session.procedureSelections[primaryDocument?.id] || emptySelection();
  const examDocument = documents.find(
    (document) => selectedIds.includes(document.id) && document.examOptions?.length,
  ) || null;
  const examOptions = examDocument?.examOptions || [];
  const examSelection = session.examSelection || emptySelection();
  const showFastingOption = documents.some(
    (document) => selectedIds.includes(document.id) && document.hasFastingOption,
  );
  const hasDocument = selectedIds.length > 0;

  const toggleDocument = (id, checked) => {
    const nextIds = checked
      ? [...new Set([...selectedIds, id])]
      : selectedIds.filter((value) => value !== id);
    const stillHasFasting = documents.some(
      (document) => nextIds.includes(document.id) && document.hasFastingOption,
    );
    const stillHasExam = documents.some(
      (document) => nextIds.includes(document.id) && document.examOptions?.length,
    );
    const nextSelections = { ...session.procedureSelections };
    if (checked && !nextSelections[id]) {
      nextSelections[id] = emptySelection();
    }
    onChange({
      ...session,
      selectedDocumentIds: nextIds,
      procedureSelections: nextSelections,
      examSelection: stillHasExam ? examSelection : emptySelection(),
      requiresFasting: stillHasFasting ? session.requiresFasting : false,
    });
  };

  const toggleProcedure = (option, checked) => {
    if (!primaryDocument) return;
    const selected = checked
      ? [...new Set([...procedureSelection.selected, option])]
      : procedureSelection.selected.filter((value) => value !== option);
    onChange({
      ...session,
      procedureSelections: {
        ...session.procedureSelections,
        [primaryDocument.id]: { ...procedureSelection, selected },
      },
    });
  };

  const toggleExam = (option, checked) => {
    const selected = checked
      ? [...new Set([...examSelection.selected, option])]
      : examSelection.selected.filter((value) => value !== option);
    onChange({
      ...session,
      examSelection: { ...examSelection, selected },
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
        <p className={labelClass}>書類の選択</p>
        <div className="space-y-1">
          {documents.map((document) => (
            <label key={document.id} className="flex min-h-[48px] items-center gap-3 text-[15px]">
              <input
                type="checkbox"
                checked={selectedIds.includes(document.id)}
                onChange={(e) => toggleDocument(document.id, e.target.checked)}
                className="h-[22px] w-[22px] shrink-0"
              />
              {document.label}
            </label>
          ))}
        </div>
      </section>

      {showFastingOption ? (
        <section className="mb-6">
          <label className="flex min-h-[48px] items-center gap-3 text-[15px]">
            <input
              type="checkbox"
              checked={Boolean(session.requiresFasting)}
              onChange={(e) => onChange({ ...session, requiresFasting: e.target.checked })}
              className="h-[22px] w-[22px] shrink-0"
            />
            絶食あり
          </label>
        </section>
      ) : null}

      {procedureOptions.length ? (
        <section className="mb-6">
          <p className={labelClass}>手術・処置の内容</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {procedureOptions.map((option) => (
              <label key={option} className="flex min-h-[44px] items-center gap-2 text-[15px]">
                <input
                  type="checkbox"
                  checked={procedureSelection.selected.includes(option)}
                  onChange={(e) => toggleProcedure(option, e.target.checked)}
                />
                {option}
              </label>
            ))}
          </div>
          {procedureSelection.selected.includes('その他') ? (
            <input
              className={`${fieldClass} mt-3 w-full`}
              value={procedureSelection.other}
              onChange={(e) => onChange({
                ...session,
                procedureSelections: {
                  ...session.procedureSelections,
                  [primaryDocument.id]: { ...procedureSelection, other: e.target.value },
                },
              })}
              placeholder="その他の内容"
            />
          ) : null}
        </section>
      ) : null}

      {examOptions.length ? (
        <section className="mb-6">
          <p className={labelClass}>実施検査</p>
          <div className="space-y-1">
            {examOptions.map((option) => (
              <label key={option} className="flex min-h-[48px] items-center gap-3 text-[15px]">
                <input
                  type="checkbox"
                  checked={examSelection.selected.includes(option)}
                  onChange={(e) => toggleExam(option, e.target.checked)}
                  className="h-[22px] w-[22px] shrink-0"
                />
                {option}
              </label>
            ))}
          </div>
          {examSelection.selected.includes('その他') ? (
            <input
              className={`${fieldClass} mt-3 w-full`}
              value={examSelection.other}
              onChange={(e) => onChange({
                ...session,
                examSelection: { ...examSelection, other: e.target.value },
              })}
              placeholder="その他の検査内容"
            />
          ) : null}
        </section>
      ) : null}

      {notice ? <p className="text-[13px] text-nc-ink mb-3">{notice}</p> : null}

      <button
        type="button"
        onClick={onNext}
        disabled={!hasDocument}
        className="mt-2 bg-nc-green text-nc-cream px-6 py-3 rounded-[8px] text-[15px] disabled:cursor-not-allowed disabled:opacity-45"
      >
        確認画面へ
      </button>
    </div>
  );
}
