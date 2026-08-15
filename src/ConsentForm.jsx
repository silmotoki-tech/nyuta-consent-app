import React, { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import SignatureCanvas from 'react-signature-canvas';
import html2pdf from 'html2pdf.js';
import { Save, Loader2, RotateCcw, ChevronLeft, Printer } from 'lucide-react';
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

// 本文の文言は別フェーズで作り込むため、今はダミーのプレースホルダーを表示する。
const PLACEHOLDER_BODY_TEXT =
  '（仮の本文）本項目には正式な説明文言が入ります。現在はダミーテキストです。動作確認後、実際の文言に差し替えます。';

// ファイル名・Storageパス用のタイムスタンプ（例: 20260815-1432）を生成
function formatTimestamp(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
}

// サイン画像のデコード完了を待つ。img.decode() が使えない環境では onload にフォールバックする。
function decodeImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('署名画像の読み込みに失敗しました。'));
    img.src = dataUrl;
    if (typeof img.decode === 'function') {
      img.decode().then(() => resolve(img)).catch(() => {
        // decode 失敗時は onload 側の解決を待つ
      });
    }
  });
}

const initialFormData = {
  ownerName: '',
  petName: '',
  date: new Date().toISOString().split('T')[0],
};

export default function ConsentForm() {
  const sigCanvas = useRef({});
  const formRef = useRef(null);

  const [step, setStep] = useState('select'); // 'select' | 'input'
  const [selectedFormTypeId, setSelectedFormTypeId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [capturedSignature, setCapturedSignature] = useState(null);
  const [formData, setFormData] = useState(initialFormData);

  const selectedFormType = selectedFormTypeId ? getFormType(selectedFormTypeId) : null;
  const needsSignature = selectedFormType ? isSignatureRequired(selectedFormType.category) : true;
  const attachedDocs = selectedFormType
    ? selectedFormType.attachmentIds.map(getAttachment).filter(Boolean)
    : [];

  const handleSelectFormType = (formTypeId) => {
    setSelectedFormTypeId(formTypeId);
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

  // 保存成功後、生成したPDFを新規タブで開いて印刷ダイアログを呼ぶ
  // （iPad Safari上でAirPrintを含むネイティブの印刷シートを出すため）
  const openPrintDialog = (pdfUrl) => {
    const printWindow = window.open(pdfUrl, '_blank');
    if (!printWindow) {
      alert('印刷用のウィンドウを開けませんでした。ポップアップブロックの設定をご確認ください。');
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
    // PDFの読み込みでloadイベントが発火しないブラウザ向けのフォールバック
    setTimeout(tryPrint, 1500);
  };

  // PDFを生成してFirebaseに保存する関数
  const handleGenerateAndSave = async () => {
    if (needsSignature && sigCanvas.current.isEmpty()) {
      alert('飼い主様のサインをお願いします。');
      return;
    }
    if (!formData.ownerName || !formData.petName) {
      alert('氏名とペットのお名前を入力してください。');
      return;
    }

    setIsSaving(true);

    try {
      // サインをPNG画像として確定し、PDF化対象のDOMに<img>として反映させる。
      // （サイン入力用canvasはPDF化時に data-html2canvas-ignore で除外されるため、
      //   代わりにこの確定済み画像がPDFに含まれるようにする）
      if (needsSignature) {
        const dataUrl = sigCanvas.current.getTrimmedCanvas
          ? sigCanvas.current.getTrimmedCanvas().toDataURL('image/png')
          : sigCanvas.current.toDataURL('image/png');
        // flushSync は <img> のDOM挿入までは同期化するが、画像デコード完了は保証しない。
        // iPadの負荷状況で「PDF化した瞬間だけ署名が空白」になるのを防ぐため、
        // デコード完了を待ってから state に反映し、その後 PDF 化する。
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

      console.log('PDF生成開始...');
      const pdfBlob = await html2pdf().set(opt).from(formRef.current).output('blob');
      console.log('PDF生成完了');

      console.log('Storageへアップロード開始...');
      const storageRef = ref(storage, pdfPath);
      await uploadBytes(storageRef, pdfBlob);
      const downloadURL = await getDownloadURL(storageRef);
      console.log('Storageアップロード完了。URL:', downloadURL);

      console.log('Firestoreへ保存開始...');
      await addDoc(collection(db, 'consents'), {
        formTypeId: selectedFormType.id,
        category: selectedFormType.category,
        ownerName: formData.ownerName,
        petName: formData.petName,
        date: formData.date,
        yearMonth,
        pdfPath,
        pdfUrl: downloadURL,
        createdAt: serverTimestamp(),
      });
      console.log('Firestore保存完了');

      openPrintDialog(downloadURL);

      alert('保存が完了しました。印刷ダイアログを開きます。');

      handleBackToSelect();
    } catch (error) {
      console.error('保存エラーの詳細:', error);
      alert(`保存に失敗しました。Firebaseの設定（ルール）を確認してください。\nエラー: ${error.message}`);
      setCapturedSignature(null);
    } finally {
      setIsSaving(false);
    }
  };

  if (step === 'select') {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">承諾書の種類を選択してください</h1>
          <div className="space-y-10">
            {categories.map((cat) => {
              const items = formTypes.filter((f) => f.category === cat.id);
              if (items.length === 0) return null;
              return (
                <section key={cat.id}>
                  <h2 className="text-lg md:text-xl font-bold text-gray-700 mb-4 border-b-2 border-gray-300 pb-2">
                    {cat.label}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelectFormType(item.id)}
                        className="bg-white p-6 rounded-2xl shadow hover:shadow-lg hover:bg-blue-50 border border-gray-100 text-left transition-all"
                      >
                        <span className="text-lg md:text-xl font-semibold text-gray-900">{item.label}</span>
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
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={handleBackToSelect}
          disabled={isSaving}
          className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 font-medium mb-4"
          data-html2canvas-ignore
        >
          <ChevronLeft size={20} />
          書類を選び直す
        </button>

        <div className="bg-white p-6 md:p-10 shadow-lg rounded-xl" ref={formRef}>
          <h1 className="text-2xl md:text-3xl font-bold text-center mb-8 border-b-2 border-gray-800 pb-4 text-gray-900">
            {selectedFormType.label}
          </h1>

          <div className="space-y-6 mb-8 text-lg">
            {/* 氏名・ペット名 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <label className="font-semibold text-gray-700 mb-1">飼い主様 氏名</label>
                <input
                  type="text"
                  className="border-2 border-gray-300 p-3 rounded-lg bg-gray-50 text-xl"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  placeholder="動物 太郎"
                />
              </div>
              <div className="flex flex-col">
                <label className="font-semibold text-gray-700 mb-1">ペットのお名前 (カルテNo.)</label>
                <input
                  type="text"
                  className="border-2 border-gray-300 p-3 rounded-lg bg-gray-50 text-xl"
                  value={formData.petName}
                  onChange={(e) => setFormData({ ...formData, petName: e.target.value })}
                  placeholder="ポチ (12345)"
                />
              </div>
            </div>

            {/* 日付 */}
            <div className="flex flex-col w-full md:w-1/2">
              <label className="font-semibold text-gray-700 mb-1">日付</label>
              <input
                type="date"
                className="border-2 border-gray-300 p-3 rounded-lg bg-gray-50 text-xl"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>

          {/* 本文エリア（仮テキスト） */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="leading-relaxed text-gray-800 text-base md:text-lg">{PLACEHOLDER_BODY_TEXT}</p>
          </div>

          {/* 添付書類エリア（仮テキスト） */}
          {attachedDocs.map((att) => (
            <div key={att.id} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-bold text-gray-800 mb-2">{att.label}</h3>
              <p className="leading-relaxed text-gray-800 text-base md:text-lg">{PLACEHOLDER_BODY_TEXT}</p>
            </div>
          ))}

          {/* サインエリア（予約案内カテゴリでは署名欄を省略） */}
          {needsSignature && (
            <div className="mb-10 relative border-2 border-gray-300 rounded-xl bg-white p-2">
              <label className="absolute -top-3 left-4 bg-white px-2 text-sm font-semibold text-gray-600">
                ご署名（iPadに直接サインしてください）
              </label>

              {capturedSignature ? (
                // 確定済みの署名画像。PDF化の対象となるため data-html2canvas-ignore は付けない
                <div className="w-full h-60 flex items-center justify-center">
                  <img src={capturedSignature} alt="署名" className="max-h-56" />
                </div>
              ) : (
                // サイン入力用キャンバス。PDF化の際はここだけ除外する
                <div data-html2canvas-ignore>
                  <SignatureCanvas
                    ref={sigCanvas}
                    penColor="black"
                    canvasProps={{ className: 'w-full h-60 rounded-lg cursor-crosshair' }}
                  />
                  <button
                    onClick={clearSignature}
                    className="absolute bottom-3 right-3 flex items-center gap-1.5 text-sm text-red-600 bg-white px-3 py-1.5 rounded-full border border-red-200 shadow-sm hover:bg-red-50"
                  >
                    <RotateCcw size={16} />
                    書き直す
                  </button>
                </div>
              )}
            </div>
          )}

          {/* アクションボタン（PDF化されるときは非表示にする設定） */}
          <div className="mt-12 flex justify-center" data-html2canvas-ignore>
            <button
              onClick={handleGenerateAndSave}
              disabled={isSaving}
              className={`flex items-center gap-3 text-white px-10 py-5 rounded-2xl text-2xl font-bold shadow-lg transition-all
                ${isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'}`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="animate-spin" size={28} /> 保存中...
                </>
              ) : (
                <>
                  <Save size={28} /> PDFを作成して保存・印刷
                </>
              )}
            </button>
          </div>
          <p className="text-center text-sm text-gray-400 mt-3" data-html2canvas-ignore>
            <Printer size={14} className="inline -mt-0.5 mr-1" />
            保存後、自動的に印刷ダイアログが開きます
          </p>
        </div>
      </div>
    </div>
  );
}
