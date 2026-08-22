import React, { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import SignatureCanvas from 'react-signature-canvas';
import html2pdf from 'html2pdf.js';
import { Activity, AlertCircle, Calendar, ChevronLeft, Home, Loader2, RotateCcw } from 'lucide-react';
import { db, storage } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  categories,
  formTypes,
  getFormType,
  isSignatureRequired,
} from './formTypes';

const INK_COLOR = '#24333F';

const CATEGORY_ICONS = {
  surgery_explanation: Activity,
  hospitalization: Home,
  reservation: Calendar,
};

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
  resuscitationChoice: '',
};

function NumberBadge({ number }) {
  return (
    <span className="mt-0.5 inline-flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-nc-green-soft text-[12px] text-nc-green">
      {number}
    </span>
  );
}

function SectionHeading({ number, title, children }) {
  return (
    <div className="flex gap-3">
      <NumberBadge number={number} />
      <div className="min-w-0 flex-1">
        {title ? <p className="text-[12px] text-nc-brown mb-2">{title}</p> : null}
        {children}
      </div>
    </div>
  );
}

function PendingNote() {
  return <p className="text-[14px] text-nc-ink-soft leading-[1.9]">準備中です</p>;
}

function Checklist({ items }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, itemIndex) => (
        <li key={itemIndex} className="flex gap-2.5 text-[14px] text-nc-ink leading-[2]">
          <span className="mt-[0.7em] h-[5px] w-[5px] shrink-0 rounded-full bg-nc-brown" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function BlockList({ blocks, startIndex = 1 }) {
  if (!blocks || blocks.length === 0) {
    return <PendingNote />;
  }

  return (
    <div className="space-y-8">
      {blocks.map((block, index) => {
        const number = startIndex + index;
        if (block.type === 'checklist') {
          const items = Array.isArray(block.items) ? block.items.filter(Boolean) : [];
          return (
            <SectionHeading key={`${block.type}-${index}`} number={number} title={block.title}>
              {items.length === 0 ? <PendingNote /> : <Checklist items={items} />}
            </SectionHeading>
          );
        }

        return (
          <SectionHeading key={`${block.type}-${index}`} number={number} title={block.title}>
            {block.body ? (
              <p className="text-[14px] text-nc-ink leading-[1.9] whitespace-pre-wrap">{block.body}</p>
            ) : (
              <PendingNote />
            )}
          </SectionHeading>
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
  const choiceField = selectedFormType?.choiceField || null;
  const choiceValue = choiceField ? formData[choiceField.id] || '' : '';
  const mainBlockCount = selectedFormType?.blocks?.length || 1;
  const choiceNumber = 2 + mainBlockCount;
  const signatureNumber = choiceField ? choiceNumber + 1 : choiceNumber;

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
    if (choiceField && !choiceValue) {
      setSaveNotice(`${choiceField.prompt}を選択してください。`);
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
        ...(choiceField ? { [choiceField.id]: choiceValue } : {}),
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
              const CategoryIcon = CATEGORY_ICONS[cat.id];
              return (
                <section key={cat.id}>
                  <h2 className="flex items-center gap-1.5 text-[12px] text-nc-ink-soft mb-3">
                    {CategoryIcon ? <CategoryIcon size={16} /> : null}
                    {cat.label}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelectFormType(item.id)}
                        className={`p-5 rounded-[9px] text-left nc-hairline flex flex-col ${
                          emphasize ? 'bg-nc-green-soft' : 'bg-nc-cream'
                        }`}
                      >
                        {CategoryIcon ? (
                          <CategoryIcon size={18} className="text-nc-ink-soft mb-2.5" />
                        ) : null}
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

          <section className="mb-8">
            <SectionHeading number={1} title="飼い主・ペット">
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
            </SectionHeading>
          </section>

          <section className="mb-8">
            {(!selectedFormType.blocks || selectedFormType.blocks.length === 0) ? (
              <SectionHeading number={2} title="説明内容">
                <PendingNote />
              </SectionHeading>
            ) : (
              <BlockList blocks={selectedFormType.blocks} startIndex={2} />
            )}

            {selectedFormType.importantPoint && (
              <div className="p-3 rounded-[8px] bg-nc-mustard-bg border-[0.5px] border-nc-mustard mt-8">
                <p className="flex items-center gap-1.5 text-[12px] text-nc-brown mb-1">
                  <AlertCircle size={16} className="text-nc-mustard shrink-0" />
                  ここが大事な点です
                </p>
                <p className="text-[14px] text-nc-ink leading-[1.9] whitespace-pre-wrap">
                  {selectedFormType.importantPoint}
                </p>
              </div>
            )}
          </section>

          {choiceField && (
            <section className="mb-8">
              <SectionHeading number={choiceNumber} title={choiceField.prompt}>
                {choiceField.description ? (
                  <p className="text-[14px] text-nc-ink leading-[1.9] mb-3">{choiceField.description}</p>
                ) : null}
                <div className="space-y-2.5">
                  {choiceField.options.map((option) => (
                    <label key={option} className="flex items-start gap-2.5 text-[14px] text-nc-ink leading-[1.9]">
                      <input
                        type="radio"
                        name={choiceField.id}
                        value={option}
                        checked={choiceValue === option}
                        onChange={() => setFormData({ ...formData, [choiceField.id]: option })}
                        className="mt-1.5 accent-nc-green"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </SectionHeading>
            </section>
          )}

          {needsSignature && (
            <section className="mb-8">
              <SectionHeading number={signatureNumber} title="ご署名">
              {choiceValue ? (
                <p className="text-[14px] text-nc-ink leading-[1.9] mb-3">
                  {choiceField.prompt}：{choiceValue}
                </p>
              ) : null}
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
              </SectionHeading>
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
