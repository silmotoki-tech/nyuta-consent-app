import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { RotateCcw } from 'lucide-react';
import { allSlidesChecked, uncheckedSlideNumbers } from '../session';

const INK_COLOR = '#24333F';
const fieldClass = 'border-[0.5px] border-nc-line bg-nc-cream p-2.5 rounded-[8px] text-[15px] text-nc-ink';

export default function SignatureScreen({
  session,
  onChange,
  documentDef,
  documentSession,
  onBack,
  onNext,
  onClearSignature,
}) {
  const sigCanvas = useRef({});
  const ready = allSlidesChecked(documentDef, documentSession);
  const missing = uncheckedSlideNumbers(documentDef, documentSession);

  const handleConfirm = () => {
    if (!ready) return;
    if (documentSession.signatureDataUrl) {
      onNext(documentSession.signatureDataUrl);
      return;
    }
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      onChange({ ...session, _signatureNotice: '枠内にご署名ください。' });
      return;
    }
    const dataUrl = sigCanvas.current.getTrimmedCanvas
      ? sigCanvas.current.getTrimmedCanvas().toDataURL('image/png')
      : sigCanvas.current.toDataURL('image/png');
    onNext(dataUrl);
  };

  return (
    <div className="max-w-3xl mx-auto p-5 md:p-8">
      <h1 className="text-[19px] font-medium text-nc-green mb-6">ご署名</h1>

      {!ready ? (
        <p className="text-[14px] text-nc-ink mb-4 rounded-[8px] nc-hairline px-3 py-2.5">
          すべてのスライドを確認するまで署名できません。
          {missing.length ? ` ${missing.map((n) => `${n}枚目`).join('、')}が未確認です。` : ''}
        </p>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="flex flex-col">
          <label className="text-[12px] text-nc-brown mb-1">電話番号</label>
          <input
            type="tel"
            className={fieldClass}
            value={session.phone}
            onChange={(e) => onChange({ ...session, phone: e.target.value, _signatureNotice: '' })}
            placeholder="090-0000-0000"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-[12px] text-nc-brown mb-1">緊急連絡先</label>
          <input
            className={fieldClass}
            value={session.emergencyContact}
            onChange={(e) => onChange({ ...session, emergencyContact: e.target.value })}
            placeholder="090-0000-0000（続柄）"
          />
        </div>
      </div>

      <p className="text-[12px] text-nc-ink-soft mb-3">
        上記の説明を確認したうえで、枠内にご署名ください。
      </p>

      <div className="relative rounded-[10px] border-[0.5px] border-nc-ink bg-nc-cream p-2 mb-6">
        {documentSession.signatureDataUrl ? (
          <div className="nc-sig-guide w-full flex items-center justify-center">
            <img src={documentSession.signatureDataUrl} alt="署名" className="max-h-52" />
          </div>
        ) : (
          <div className="nc-sig-guide overflow-hidden">
            <SignatureCanvas
              ref={sigCanvas}
              penColor={INK_COLOR}
              canvasProps={{ className: 'w-full h-[220px] cursor-crosshair' }}
            />
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            if (documentSession.signatureDataUrl) {
              onClearSignature();
              return;
            }
            sigCanvas.current.clear?.();
          }}
          className="absolute bottom-3 right-3 flex items-center gap-1 text-[12px] text-nc-ink-soft bg-nc-cream px-2 py-1 rounded-[8px] border-[0.5px] border-nc-line"
        >
          <RotateCcw size={12} />
          書き直す
        </button>
      </div>

      {session._signatureNotice ? (
        <p className="text-[13px] text-nc-ink mb-3">{session._signatureNotice}</p>
      ) : null}

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
          onClick={handleConfirm}
          disabled={!ready}
          className={`px-6 py-3 rounded-[8px] text-[15px] ${
            ready ? 'bg-nc-green text-nc-cream' : 'bg-nc-line text-nc-ink-soft'
          }`}
        >
          署名する
        </button>
      </div>
    </div>
  );
}
