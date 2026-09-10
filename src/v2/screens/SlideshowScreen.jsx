import React from 'react';

export default function SlideshowScreen({
  documentDef,
  documentSession,
  slideIndex,
  onToggleCheck,
  onBack,
  onNext,
}) {
  const slide = documentDef.slides[slideIndex];
  const total = documentDef.slides.length;
  const checked = Boolean(documentSession.slideCheckTimestamps?.[slide.id]);

  return (
    <div className="max-w-5xl mx-auto p-5 md:p-8">
      <div className="flex items-end justify-between mb-4">
        <h1 className="text-[19px] font-medium text-nc-green">{documentDef.label}</h1>
        <p className="text-[13px] text-nc-ink-soft">{slideIndex + 1} / {total}</p>
      </div>

      <div className="rounded-[8px] nc-hairline overflow-hidden bg-white mb-5">
        <img
          src={slide.image}
          alt={`${documentDef.label} ${slideIndex + 1}枚目`}
          className="w-full h-auto block"
        />
      </div>

      <label className="flex items-center gap-2 text-[16px] mb-6">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onToggleCheck(slide.id, e.target.checked)}
        />
        理解しました
      </label>

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
