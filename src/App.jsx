import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { Loader2, LogOut, PenTool, Search } from 'lucide-react';
import ConsentForm from './ConsentForm';
import ConsentSearch from './ConsentSearch';
import Login from './Login';
import { auth } from './firebase';

export default function App() {
  const [user, setUser] = useState(undefined);
  const [currentView, setCurrentView] = useState('form');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  const menuItems = [
    { id: 'form', label: '承諾書 入力', icon: PenTool },
    { id: 'search', label: '履歴を検索', icon: Search },
  ];

  if (user === undefined) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center text-gray-600">
        <Loader2 className="animate-spin mr-3" size={32} />
        ログイン状態を確認しています...
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <nav className="w-20 md:w-64 bg-gray-900 p-3 md:p-6 text-white flex flex-col pt-10">
        <div className="text-center mb-10 hidden md:block border-b border-gray-700 pb-6">
          <h1 className="text-2xl font-bold text-white">にゅうた動物病院</h1>
          <p className="text-sm text-gray-400 mt-1">承諾書システム</p>
        </div>

        <div className="space-y-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex flex-col md:flex-row items-center gap-3 md:gap-4 p-4 md:p-5 rounded-2xl text-lg md:text-xl font-bold transition-all
                  ${isActive
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
              >
                <Icon size={isActive ? 28 : 24} />
                <span className="text-xs md:text-xl md:font-semibold">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-auto space-y-3">
          <button
            onClick={() => signOut(auth)}
            className="w-full flex flex-col md:flex-row items-center gap-2 md:gap-3 p-3 md:p-4 rounded-2xl text-gray-400 hover:bg-gray-800 hover:text-white transition-all"
          >
            <LogOut size={20} />
            <span className="text-xs md:text-base">ログアウト</span>
          </button>
          <div className="text-center text-xs text-gray-600">v1.0 vibe code</div>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto">
        {currentView === 'form' && <ConsentForm />}
        {currentView === 'search' && <ConsentSearch onBackToForm={() => setCurrentView('form')} />}
      </main>
    </div>
  );
}
