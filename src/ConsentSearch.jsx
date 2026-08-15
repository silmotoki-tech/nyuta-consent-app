import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { FileText, Search, Loader2, CalendarDays, Key, PawPrint, Tag } from 'lucide-react';
import { getFormType, getCategoryLabel } from './formTypes';

export default function ConsentSearch({ onBackToForm }) {
  const [consents, setConsents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [error, setError] = useState('');

  // 最初にデータを全部読み込む、または検索時に読み込む関数
  const fetchConsents = async (keyword = '', yearMonth = '') => {
    setLoading(true);
    setError('');
    const consentsRef = collection(db, 'consents');
    let q;

    if (keyword) {
      // 飼い主名で前方一致検索（Firestoreの簡易検索機能を使用）
      q = query(
        consentsRef, 
        where('ownerName', '>=', keyword),
        where('ownerName', '<=', keyword + '\uf8ff'),
        orderBy('ownerName')
      );
    } else if (yearMonth) {
      // 月別（yearMonth）で絞り込み、新しい順に取得
      q = query(consentsRef, where('yearMonth', '==', yearMonth), orderBy('createdAt', 'desc'));
    } else {
      // 検索ワードがない場合は、日付が新しい順に取得
      q = query(consentsRef, orderBy('createdAt', 'desc'));
    }

    try {
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // serverTimestampは初回取得時nullの場合があるため安全に扱う
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));
      setConsents(data);
    } catch (error) {
      console.error("Firestore読み込みエラー:", error);
      setError(`データの読み込みに失敗しました。ルールを確認してください。Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 画面が表示された時にデータを読み込む
  useEffect(() => {
    fetchConsents();
  }, []);

  // 検索ボタンを押した時の処理（氏名検索を優先し、なければ月別絞り込み）
  const handleSearch = () => {
    fetchConsents(searchTerm, monthFilter);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* ヘッダーエリア */}
        <div className="flex items-center justify-between mb-8 bg-white p-5 rounded-2xl shadow">
          <div className='flex items-center gap-3'>
             <FileText className='text-green-600' size={32}/>
             <h1 className="text-3xl font-bold text-gray-900">承諾書の検索・確認</h1>
          </div>
          <button 
            onClick={onBackToForm}
            className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg text-lg font-medium hover:bg-gray-300"
          >
            ← 入力画面に戻る
          </button>
        </div>

        {/* 検索バーエリア */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 bg-white p-5 rounded-2xl shadow">
          <input 
            type="text" 
            className="flex-grow border-2 border-gray-300 p-4 rounded-xl text-xl bg-gray-50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="飼い主様 氏名で検索..."
          />
          <input
            type="month"
            className="border-2 border-gray-300 p-4 rounded-xl text-xl bg-gray-50"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            title="月で絞り込み（氏名検索がある場合はそちらが優先されます）"
          />
          <button 
            onClick={handleSearch}
            className="flex items-center gap-3 bg-green-600 text-white px-8 py-4 rounded-xl text-xl font-bold hover:bg-green-700 shadow"
          >
            <Search size={24} />
            検索
          </button>
        </div>

        {/* 状態表示 */}
        {loading && (
          <div className="flex items-center justify-center gap-3 text-2xl text-gray-600 py-20">
            <Loader2 className="animate-spin" size={36} />
            データを読み込み中...
          </div>
        )}

        {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-xl text-lg mb-8" role="alert">
                <strong className="font-bold">エラー: </strong>
                <span className="block sm:inline">{error}</span>
            </div>
        )}

        {/* 検索結果（グリッド表示） */}
        {!loading && consents.length === 0 && !error && (
          <p className="text-center text-xl text-gray-500 py-20 bg-white rounded-2xl">該当する承諾書が見つかりませんでした。</p>
        )}

        {!loading && consents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {consents.map(consent => {
              const formType = getFormType(consent.formTypeId);
              const title = formType?.label ?? consent.formTypeId ?? consent.type ?? '（種類不明）';
              const categoryLabel = getCategoryLabel(consent.category);
              return (
              <div key={consent.id} className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all border border-gray-100 flex flex-col justify-between">
                <div>
                    <div className="mb-4 border-b pb-3">
                      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                      {consent.category && (
                        <p className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                          <Tag size={14} /> {categoryLabel}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-3 text-lg mb-6 text-gray-700">
                        <p className="flex items-center gap-2"><Key className="text-gray-400" size={20}/> 飼い主: <span className='font-semibold text-gray-900'>{consent.ownerName}</span></p>
                        <p className="flex items-center gap-2"><PawPrint className="text-gray-400" size={20}/> ペット: <span className='font-semibold text-gray-900'>{consent.petName}</span></p>
                        <p className="flex items-center gap-2"><CalendarDays className="text-gray-400" size={20}/> 日付: <span className='font-semibold text-gray-900'>{consent.date}</span></p>
                    </div>
                </div>

                <a 
                  href={consent.pdfUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full text-center flex items-center justify-center gap-2.5 bg-blue-600 text-white px-5 py-3.5 rounded-xl text-lg font-semibold hover:bg-blue-700 shadow"
                >
                  <FileText size={20} />
                  PDFを開く (AirPrint対応)
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