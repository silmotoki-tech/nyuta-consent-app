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
      // 氏名で絞り込んだ場合、Firestore の制約で ownerName 順にしか
      // 取得できないため、常に日付の降順になるようここで並べ替える。
      data.sort((a, b) => b.createdAt - a.createdAt);
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
          <div className="divide-y divide-nc-line">
            {consents.map((consent) => {
              const formType = getFormType(consent.formTypeId);
              const title = formType?.label ?? consent.formTypeId ?? consent.type ?? '（種類不明）';
              const categoryLabel = getCategoryLabel(consent.category);
              const docLabel = title + (consent.category ? `（${categoryLabel}）` : '');
              // ラベル文字（「カルテ番号:」「氏名:」等）は付けない。
              // カルテ番号・氏名の開始位置だけは全行で揃うよう、
              // 日付とカルテ番号を固定幅の列にしている。それより後ろ
              // （動物の名前・書類名・PDFリンク）は単純に横へ並べるだけで、
              // 位置は揃えない。
              return (
                <p
                  key={consent.id}
                  className="py-1.5 text-[13px] text-nc-ink whitespace-nowrap overflow-x-auto flex items-baseline"
                >
                  <span className="inline-block w-[92px] shrink-0">{consent.date}</span>
                  <span className="inline-block w-[64px] shrink-0">{consent.karteNumber || ''}</span>
                  <span>
                    {displayOwnerName(consent.ownerName)}　{displayPetName(consent.petName)}　{docLabel}
                    {'　'}
                    <a
                      href={consent.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-nc-green underline"
                    >
                      PDFを開く
                    </a>
                  </span>
                </p>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
