import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { getFormType, getCategoryLabel } from './formTypes';
import { displayOwnerName, displayPetName } from './displayNames';

export default function ConsentSearch({ onBackToForm }) {
  const [consents, setConsents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [error, setError] = useState('');

  const fetchConsents = async (keyword = '', yearMonth = '') => {
    setLoading(true);
    setError('');
    const consentsRef = collection(db, 'consents');
    let q;

    if (keyword) {
      q = query(
        consentsRef,
        where('ownerName', '>=', keyword),
        where('ownerName', '<=', keyword + '\uf8ff'),
        orderBy('ownerName')
      );
    } else if (yearMonth) {
      q = query(consentsRef, where('yearMonth', '==', yearMonth), orderBy('createdAt', 'desc'));
    } else {
      q = query(consentsRef, orderBy('createdAt', 'desc'));
    }

    try {
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));
      setConsents(data);
    } catch (err) {
      console.error('Firestore読み込みエラー:', err);
      setError(`データの読み込みに失敗しました。${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsents();
  }, []);

  const handleSearch = () => {
    fetchConsents(searchTerm, monthFilter);
  };

  return (
    <div className="min-h-screen bg-nc-cream p-5 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between gap-4 mb-6 pb-4 border-b-[0.5px] border-nc-line">
          <div>
            <h1 className="text-[19px] font-medium text-nc-green">承諾書の検索・確認</h1>
            <p className="text-[12px] text-nc-ink-soft mt-1">スタッフ向け。保存済みの記録を確認します。</p>
          </div>
          <button
            onClick={onBackToForm}
            className="text-[13px] text-nc-ink-soft px-3 py-2 rounded-[8px] nc-hairline bg-nc-cream"
          >
            入力画面に戻る
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <input
            type="text"
            className="flex-grow border-[0.5px] border-nc-line bg-nc-cream p-2.5 rounded-[8px] text-[15px] text-nc-ink"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="飼い主様 氏名で検索"
          />
          <input
            type="month"
            className="border-[0.5px] border-nc-line bg-nc-cream p-2.5 rounded-[8px] text-[15px] text-nc-ink"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            title="月で絞り込み（氏名検索がある場合はそちらが優先されます）"
          />
          <button
            onClick={handleSearch}
            className="bg-nc-green text-nc-cream px-5 py-2.5 rounded-[8px] text-[15px]"
          >
            検索
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 text-[13px] text-nc-ink-soft py-16">
            <Loader2 className="animate-spin" size={16} />
            読み込み中...
          </div>
        )}

        {error && (
          <p className="text-[13px] text-nc-ink mb-6" role="alert">
            {error}
          </p>
        )}

        {!loading && consents.length === 0 && !error && (
          <p className="text-[13px] text-nc-ink-soft py-12">該当する承諾書が見つかりませんでした。</p>
        )}

        {!loading && consents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {consents.map((consent) => {
              const formType = getFormType(consent.formTypeId);
              const title = formType?.label ?? consent.formTypeId ?? consent.type ?? '（種類不明）';
              const categoryLabel = getCategoryLabel(consent.category);
              return (
                <div
                  key={consent.id}
                  className="bg-nc-cream p-4 rounded-[8px] nc-hairline flex flex-col justify-between"
                >
                  <div className="mb-4 pb-3 border-b-[0.5px] border-nc-line">
                    <h2 className="text-[16px] font-medium text-nc-ink">{title}</h2>
                    {consent.category && (
                      <p className="text-[12px] text-nc-ink-soft mt-1">{categoryLabel}</p>
                    )}
                  </div>

                  <div className="space-y-1.5 text-[13px] text-nc-ink mb-4">
                    <p>
                      <span className="text-nc-ink-soft">飼い主</span> {displayOwnerName(consent.ownerName)}
                    </p>
                    <p>
                      <span className="text-nc-ink-soft">動物の名前</span> {displayPetName(consent.petName)}
                    </p>
                    {consent.karteNumber ? (
                      <p>
                        <span className="text-nc-ink-soft">カルテ番号</span> {consent.karteNumber}
                      </p>
                    ) : null}
                    <p>
                      <span className="text-nc-ink-soft">日付</span> {consent.date}
                    </p>
                  </div>

                  <a
                    href={consent.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-center bg-nc-green text-nc-cream px-4 py-2.5 rounded-[8px] text-[14px]"
                  >
                    PDFを開く
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
