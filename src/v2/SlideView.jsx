import React from 'react';

function parseInlineEm(text) {
  if (!text) return [];
  const parts = [];
  const regex = /<em>(.*?)<\/em>/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <span key={`em-${key}`} className="text-nc-mustard">
        {match[1]}
      </span>,
    );
    key += 1;
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length ? parts : [text];
}

function countMainBlocks(blocks) {
  return (blocks || []).filter((block) => block.type === 'main').length;
}

function MainBlock({ block, mainTextClass }) {
  return (
    <div>
      <p className={`${mainTextClass} font-medium leading-[1.6] text-nc-ink`}>
        {parseInlineEm(block.text)}
      </p>
      {block.notes?.length > 0 ? (
        <div className="mt-4 border-l-2 border-nc-line pl-[18px] space-y-[11px]">
          {block.notes.map((note) => (
            <p key={note} className="text-[15px] leading-[1.8] text-nc-ink-soft">
              {parseInlineEm(note)}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ListBlock({ block }) {
  return (
    <ul className="space-y-[26px]">
      {block.items.map((item) => (
        <li key={item} className="flex gap-[14px]">
          <span
            className="mt-[0.55em] h-[7px] w-[7px] shrink-0 rounded-full bg-nc-brown"
            aria-hidden="true"
          />
          <span className="text-[21px] font-medium leading-[1.6] text-nc-ink">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function DividerBlock() {
  return <div className="my-6 h-[0.5px] bg-nc-line" role="separator" />;
}

function SlideBlocks({ blocks }) {
  const mainCount = countMainBlocks(blocks);
  const mainTextClass = mainCount <= 1 ? 'text-[27px]' : 'text-[21px]';

  return (
    <div className="flex flex-col">
      {blocks.map((block, index) => {
        if (block.type === 'main') {
          return (
            <MainBlock
              key={`main-${block.text}-${index}`}
              block={block}
              mainTextClass={mainTextClass}
            />
          );
        }
        if (block.type === 'list') {
          return <ListBlock key={`list-${index}`} block={block} />;
        }
        if (block.type === 'divider') {
          return <DividerBlock key={`divider-${index}`} />;
        }
        return null;
      })}
    </div>
  );
}

export default function SlideView({
  slide,
  slideIndex,
  totalSlides,
  checked,
  onToggleCheck,
  onNext,
  isLastSlide,
  canProceedToSignature,
}) {
  const emphasis = Boolean(slide.emphasis);

  const handleNext = () => {
    if (isLastSlide && !canProceedToSignature) return;
    onNext();
  };

  return (
    <article className="mx-auto flex min-h-[400px] w-full max-w-[660px] flex-col rounded-[14px] bg-nc-cream px-12 py-10">
      <header className="mb-8 flex items-center gap-3">
        <span
          className={[
            'flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full text-[14px] font-medium',
            emphasis
              ? 'border-[0.5px] border-nc-mustard bg-nc-mustard-bg text-nc-mustard'
              : 'bg-nc-green-soft text-nc-green',
          ].join(' ')}
          aria-hidden="true"
        >
          {slideIndex + 1}
        </span>
        <h2 className="text-[14px] text-nc-brown">{slide.category}</h2>
        <p className="ml-auto text-[11px] text-nc-ink-soft">
          {slideIndex + 1} / {totalSlides}
        </p>
      </header>

      <div className="flex-1">
        <SlideBlocks blocks={slide.blocks} />
      </div>

      <footer className="mt-auto flex items-center justify-between gap-4 border-t border-[0.5px] border-nc-line pt-5">
        <label className="flex min-h-[48px] flex-1 cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onToggleCheck(e.target.checked)}
            className="h-[26px] w-[26px] shrink-0 appearance-none rounded-[6px] border-[1.5px] border-nc-green bg-nc-cream checked:border-nc-green checked:bg-nc-green"
            style={{
              backgroundImage: checked
                ? "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M3.5 8.5L6.5 11.5L12.5 4.5' stroke='%23FBF8F2' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")"
                : 'none',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '14px 14px',
            }}
          />
          <span className="text-[15px] text-nc-ink">理解しました</span>
        </label>

        <button
          type="button"
          onClick={handleNext}
          disabled={isLastSlide && !canProceedToSignature}
          className={[
            'shrink-0 rounded-[8px] px-[30px] py-[11px] text-[14px] font-medium',
            isLastSlide
              ? 'bg-nc-green-soft text-nc-green disabled:cursor-not-allowed disabled:opacity-45'
              : 'bg-nc-green text-nc-cream',
          ].join(' ')}
        >
          {isLastSlide ? '署名へ' : '次へ'}
        </button>
      </footer>
    </article>
  );
}
