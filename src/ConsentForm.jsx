import React, { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import SignatureCanvas from 'react-signature-canvas';
import html2pdf from 'html2pdf.js';
import { Loader2, RotateCcw, ChevronLeft } from 'lucide-react';
import { db, storage } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  categories,
  formTypes,
  getFormType,
  getAttachment,
  isSignatureRequired,
} from './formTypes';

const INK_COLOR = '#24333F';
const CIRCLED_NUMBERS = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳';

function circledNumber(index) {
  return CIRCLED_NUMBERS[index] ?? `${index + 1}.`;
}

function formatTimestamp(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
}

function decodeImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('署名画像の読み込みに失敗しました。'));
    img.src = dataUrl;
    if (typeof img.decode === 'function') {
      img.decode().then(() => resolve(img)).catch(() => {});
    }
  });
}

const initialFormData = {
  ownerName: '',
  petName: '',
  phone: '',
  emergencyContact: '',
  date: new Date().toISOString().split('T')[0],
};

function SectionLabel({ number, children }) {
  return (
    <p className="text-[12px] text-nc-brown mb-2">
      {number} {children}
    </p>
  );
}

function PendingNote() {
  return <p className="text-[14px] text-nc-ink-soft leading-[1.9]">準備中です</p>;
}

function BlockList({ blocks, startIndex = 0 }) {
  if (!blocks || blocks.length === 0) {
    return <PendingNote />;
  }

  return (
    <div className="space-y-5">
      {blocks.map((block, index) => {
        const number = circledNumber(startIndex + index);
        if (block.type === 'checklist') {
          const items = Array.isArray(block.items) ? block.items.filter(Boolean) : [];
          return (
            <div key={`${block.type}-${index}`}>
              {block.title && <SectionLabel number={number}>{block.title}</SectionLabel>}
              {items.length === 0 ? (
                <PendingNote />
              ) : (
                <ul className="space-y-1">
                  {items.map((item, itemIndex) => (
                    <li key={itemIndex} className="text-[14px] text-nc-ink leading-[1.9]">
                      ・{item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        }

        return (
          <div key={`${block.type}-${index}`}>
            {block.title && <SectionLabel number={number}>{block.title}</SectionLabel>}
            {block.body ? (
              <p className="text-[14px] text-nc-ink leading-[1.9] whitespace-pre-wrap">{block.body}</p>
            ) : (
              <PendingNote />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ConsentForm() {
  const sigCanvas = useRef({});
  const formRef = useRef(null);

  const [step, setStep] = useState('select');
  const [selectedFormTypeId, setSelectedFormTypeId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState('');
  const [capturedSignature, setCapturedSignature] = useState(null);
  const [formData, setFormData] = useState(initialFormData);

  const selectedFormType = selectedFormTypeId ? getFormType(selectedFormTypeId) : null;
  const needsSignature = selectedFormType ? isSignatureRequired(selectedFormType.category) : true;
  const attachedDocs = selectedFormType
    ? selectedFormType.attachmentIds.map(getAttachment).filter(Boolean)
    : [];
  const mainBlockCount = selectedFormType?.blocks?.length || 1;
  const signatureNumber = circledNumber(1 + mainBlockCount);

  const handleSelectFormType = (formTypeId) => {
    setSelectedFormTypeId(formTypeId);
    setSaveNotice('');
    setStep('input');
  };

  const handleBackToSelect = () => {
    setStep('select');
    setSelectedFormTypeId(null);
    setFormData(initialFormData);
    setCapturedSignature(null);
    if (sigCanvas.current.clear) sigCanvas.current.clear();
  };

  const clearSignature = () => {
    sigCanvas.current.clear();
  };

  const openPrintDialog = (pdfUrl) => {
    const printWindow = window.open(pdfUrl, '_blank');
    if (!printWindow) {
      setSaveNotice('保存しました。印刷用のウィンドウを開けませんでした。');
      return;
    }
    const tryPrint = () => {
      try {
        printWindow.print();
      } catch (e) {
        console.error('印刷ダイアログの起動に失敗しました:', e);
      }
    };
    printWindow.addEventListener('load', tryPrint);
    setTimeout(tryPrint, 1500);
  };

  const handleGenerateAndSave = async () => {
    if (needsSignature && sigCanvas.current.isEmpty()) {
      setSaveNotice('飼い主様のサインをお願いします。');
      return;
    }
    if (!formData.ownerName || !formData.petName) {
      setSaveNotice('氏名とペットのお名前を入力してください。');
      return;
    }

    setIsSaving(true);
    setSaveNotice('');

    try {
      if (needsSignature) {
        const dataUrl = sigCanvas.current.getTrimmedCanvas
          ? sigCanvas.current.getTrimmedCanvas().toDataURL('image/png')
          : sigCanvas.current.toDataURL('image/png');
        await decodeImage(dataUrl);
        flushSync(() => setCapturedSignature(dataUrl));
      }

      const now = new Date();
      const yearMonth = (formData.date || now.toISOString().split('T')[0]).slice(0, 7);
      const fileName = `${formatTimestamp(now)}_${formData.petName}_${selectedFormType.label}.pdf`;
      const pdfPath = `consents/${yearMonth}/${fileName}`;

      const opt = {
        margin: [10, 10],
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      };

      const pdfBlob = await html2pdf().set(opt).from(formRef.current).output('blob');
      const storageRef = ref(storage, pdfPath);
      await uploadBytes(storageRef, pdfBlob);
      const downloadURL = await getDownloadURL(storageRef);

      await addDoc(collection(db, 'consents'), {
        formTypeId: selectedFormType.id,
        category: selectedFormType.category,
        ownerName: formData.ownerName,
        petName: formData.petName,
        phone: formData.phone,
        emergencyContact: formData.emergencyContact,
        date: formData.date,
        yearMonth,
        pdfPath,
        pdfUrl: downloadURL,
        createdAt: serverTimestamp(),
      });

      openPrintDialog(downloadURL);
      setSaveNotice('保存しました');
      handleBackToSelect();
    } catch (error) {
      console.error('保存エラーの詳細:', error);
      setSaveNotice(`保存に失敗しました。${error.message}`);
      setCapturedSignature(null);
    } finally {
      setIsSaving(false);
    }
  };

  if (step === 'select') {
    return (
      <div className="min-h-screen bg-nc-cream p-5 md:p-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-[19px] font-medium text-nc-green mb-1">承諾書の種類を選択</h1>
          <p className="text-[12px] text-nc-ink-soft mb-6">スタッフ向け。書類を選ぶと説明・サイン画面に進みます。</p>
          {saveNotice && (
            <p className="text-[13px] text-nc-ink mb-6">{saveNotice}</p>
          )}
          <div className="space-y-8">
            {categories.map((cat) => {
              const items = formTypes.filter((f) => f.category === cat.id);
              if (items.length === 0) return null;
              const emphasize = cat.id === 'surgery_explanation';
              return (
                <section key={cat.id}>
                  <h2 className="text-[12px] text-nc-ink-soft mb-3">{cat.label}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelectFormType(item.id)}
                        className={`p-4 rounded-[8px] text-left nc-hairline ${
                          emphasize ? 'bg-nc-green-soft' : 'bg-nc-cream'
                        }`}
                      >
                        <span className="text-[15px] text-nc-ink">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nc-cream p-5 md:p-8">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={handleBackToSelect}
          disabled={isSaving}
          className="flex items-center gap-1 text-[12px] text-nc-ink-soft mb-4"
          data-html2canvas-ignore
        >
          <ChevronLeft size={14} />
          書類を選び直す
        </button>

        <div className="bg-nc-cream p-5 md:p-8 rounded-[8px] nc-hairline" ref={formRef}>
          <h1 className="text-[19px] font-medium text-nc-green mb-6 pb-3 border-b-[0.5px] border-nc-line">
            {selectedFormType.label}
          </h1>

          <section className="mb-7">
            <SectionLabel number={circledNumber(0)}>飼い主・ペット</SectionLabel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-[12px] text-nc-brown mb-1">飼い主様 氏名</label>
                <input
                  type="text"
                  className="border-[0.5px] border-nc-line bg-nc-cream p-2.5 rounded-[8px] text-[15px] text-nc-ink"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  placeholder="動物 太郎"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-[12px] text-nc-brown mb-1">ペットのお名前 (カルテNo.)</label>
                <input
                  type="text"
                  className="border-[0.5px] border-nc-line bg-nc-cream p-2.5 rounded-[8px] text-[15px] text-nc-ink"
                  value={formData.petName}
                  onChange={(e) => setFormData({ ...formData, petName: e.target.value })}
                  placeholder="ポチ (12345)"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-[12px] text-nc-brown mb-1">電話番号</label>
                <input
                  type="tel"
                  className="border-[0.5px] border-nc-line bg-nc-cream p-2.5 rounded-[8px] text-[15px] text-nc-ink"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="090-0000-0000"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-[12px] text-nc-brown mb-1">緊急連絡先</label>
                <input
                  type="text"
                  className="border-[0.5px] border-nc-line bg-nc-cream p-2.5 rounded-[8px] text-[15px] text-nc-ink"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  placeholder="090-0000-0000（続柄）"
                />
              </div>
            </div>
            <div className="flex flex-col w-full md:w-1/2 mt-4">
              <label className="text-[12px] text-nc-brown mb-1">日付</label>
              <input
                type="date"
                className="border-[0.5px] border-nc-line bg-nc-cream p-2.5 rounded-[8px] text-[15px] text-nc-ink"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </section>

          <section className="mb-7">
            {(!selectedFormType.blocks || selectedFormType.blocks.length === 0) ? (
              <>
                <SectionLabel number={circledNumber(1)}>説明内容</SectionLabel>
                <PendingNote />
              </>
            ) : (
              <BlockList blocks={selectedFormType.blocks} startIndex={1} />
            )}

            {selectedFormType.importantPoint && (
              <div className="p-3 rounded-[8px] bg-nc-mustard-bg border-[0.5px] border-nc-mustard mt-4">
                <p className="text-[12px] text-nc-brown mb-1">ここが大事な点です</p>
                <p className="text-[14px] text-nc-ink leading-[1.9] whitespace-pre-wrap">
                  {selectedFormType.importantPoint}
                </p>
              </div>
            )}

            {attachedDocs.map((att) => (
              <div key={att.id} className="mt-6 pt-4 border-t-[0.5px] border-nc-line">
                <h3 className="text-[12px] text-nc-brown mb-3">{att.label}</h3>
                <BlockList blocks={att.blocks} startIndex={0} />
              </div>
            ))}
          </section>

          {needsSignature && (
            <section className="mb-8">
              <SectionLabel number={signatureNumber}>ご署名</SectionLabel>
              <p className="text-[12px] text-nc-ink-soft mb-3">
                上記の説明を確認したうえで、枠内にご署名ください。
              </p>
              <div className="relative rounded-[10px] border-[0.5px] border-nc-ink bg-nc-cream p-2">
                {capturedSignature ? (
                  <div className="nc-sig-guide w-full flex items-center justify-center">
                    <img src={capturedSignature} alt="署名" className="max-h-52" />
                  </div>
                ) : (
                  <div data-html2canvas-ignore>
                    <div className="nc-sig-guide overflow-hidden">
                      <SignatureCanvas
                        ref={sigCanvas}
                        penColor={INK_COLOR}
                        canvasProps={{ className: 'w-full h-[220px] cursor-crosshair' }}
                      />
                    </div>
                    <button
                      onClick={clearSignature}
                      className="absolute bottom-3 right-3 flex items-center gap-1 text-[12px] text-nc-ink-soft bg-nc-cream px-2 py-1 rounded-[8px] border-[0.5px] border-nc-line"
                    >
                      <RotateCcw size={12} />
                      書き直す
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

          <div className="mt-8" data-html2canvas-ignore>
            {saveNotice && (
              <p className="text-[13px] text-nc-ink mb-3">{saveNotice}</p>
            )}
            <button
              onClick={handleGenerateAndSave}
              disabled={isSaving}
              className={`w-full md:w-auto px-6 py-3 rounded-[8px] text-[15px]
                ${isSaving ? 'bg-nc-line text-nc-ink-soft' : 'bg-nc-green text-nc-cream'}`}
            >
              {isSaving ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="animate-spin" size={16} /> 保存中...
                </span>
              ) : (
                '保存して印刷'
              )}
            </button>
            <p className="text-[12px] text-nc-ink-soft mt-2">保存後、印刷ダイアログが開きます。</p>
          </div>
        </div>
      </div>
    </div>
  );
}
