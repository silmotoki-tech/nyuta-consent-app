import React from 'react';
import SlideView from '../SlideView';
import { allSlidesChecked } from '../session';

export default function SlideshowScreen({
  documentDef,
  documentSession,
  session,
  slides,
  slideIndex,
  onToggleCheck,
  onBack,
  onNext,
  notice,
}) {
  const slide = slides[slideIndex];
  const total = slides.length;
  const checked = Boolean(documentSession.slideCheckTimestamps?.[slide?.id]);
  const isLastSlide = slideIndex === total - 1;
  const canProceedToSignature = allSlidesChecked(documentDef, documentSession, session);

  if (!slide) return null;

  return (
    <div className="mx-auto max-w-5xl p-5 md:p-8">
      <h1 className="mb-6 text-[19px] font-medium text-nc-green">{documentDef.label}</h1>

      <SlideView
        slide={slide}
        slideIndex={slideIndex}
        totalSlides={total}
        checked={checked}
        onToggleCheck={(value) => onToggleCheck(slide.id, value)}
        onNext={onNext}
        isLastSlide={isLastSlide}
        canProceedToSignature={canProceedToSignature}
      />

      {notice ? (
        <p className="mt-4 rounded-[8px] nc-hairline px-3 py-2.5 text-[14px] text-nc-ink">
          {notice}
        </p>
      ) : null}

      {isLastSlide && !canProceedToSignature ? (
        <p className="mt-4 text-[13px] text-nc-ink-soft">
          すべてのスライドで「理解しました」にチェックを入れると署名へ進めます。
        </p>
      ) : null}

      <div className="mt-6">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[48px] rounded-[8px] px-5 py-3 text-[15px] nc-hairline text-nc-ink"
        >
          戻る
        </button>
      </div>
    </div>
  );
}
