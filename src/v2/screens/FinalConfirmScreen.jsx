import React from 'react';
import { STAFF_NAMES } from '../staff';

const fieldClass = 'border-[0.5px] border-nc-line bg-nc-cream p-2.5 rounded-[8px] text-[15px] text-nc-ink';

export default function FinalConfirmScreen({
  documentSession,
  onChangeDocumentSession,
  onBack,
  onSave,
  isSaving,
  notice,
}) {
  const ready = Boolean(
    documentSession.explainerStaff
    && documentSession.scheduleEntryStaff
    && documentSession.scheduleEntryChecked,
  );

  return (
    <div className="max-w-3xl mx-auto p-5 md:p-8">
      <h1 className="text-[19px] font-medium text-nc-green mb-2">最終確認</h1>
      <p className="text-[13px] text-nc-ink-soft mb-6">署名後、スタッフが記入します。</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div className="flex flex-col">
          <label className="text-[12px] text-nc-brown mb-1">説明した獣医師</label>
          <select
            className={fieldClass}
            value={documentSession.explainerStaff}
            onChange={(e) => onChangeDocumentSession({ ...documentSession, explainerStaff: e.target.value })}
          >
            <option value="">選択してください</option>
            {STAFF_NAMES.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-[12px] text-nc-brown mb-1">予定表に記入した人</label>
          <select
            className={fieldClass}
            value={documentSession.scheduleEntryStaff}
            onChange={(e) => onChangeDocumentSession({ ...documentSession, scheduleEntryStaff: e.target.value })}
          >
            <option value="">選択してください</option>
            {STAFF_NAMES.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 text-[15px] mb-8">
        <input
          type="checkbox"
          checked={documentSession.scheduleEntryChecked}
          onChange={(e) => onChangeDocumentSession({
            ...documentSession,
            scheduleEntryChecked: e.target.checked,
          })}
        />
        予定表に記入した
      </label>

      {notice ? <p className="text-[13px] text-nc-ink mb-3">{notice}</p> : null}

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
          onClick={onSave}
          disabled={!ready || isSaving}
          className={`px-6 py-3 rounded-[8px] text-[15px] ${
            ready && !isSaving ? 'bg-nc-green text-nc-cream' : 'bg-nc-line text-nc-ink-soft'
          }`}
        >
          {isSaving ? '保存中...' : '保存して印刷'}
        </button>
      </div>
    </div>
  );
}
