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
      <div className="min-h-screen bg-nc-cream flex items-center justify-center text-nc-ink-soft text-sm">
        <Loader2 className="animate-spin mr-2" size={18} />
        ログイン状態を確認しています...
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="flex min-h-screen bg-nc-cream">
      <nav className="w-20 md:w-56 bg-nc-cream p-3 md:p-5 flex flex-col pt-8 nc-hairline border-r-[0.5px] border-nc-line">
        <div className="mb-8 hidden md:block pb-5 border-b-[0.5px] border-nc-line">
          <h1 className="text-[19px] font-medium text-nc-green leading-snug">にゅうた動物病院</h1>
          <p className="text-[12px] text-nc-ink-soft mt-1">承諾書システム</p>
        </div>

        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex flex-col md:flex-row items-center gap-2 md:gap-3 p-3 md:px-3 md:py-2.5 rounded-[8px] text-left
                  ${isActive
                    ? 'bg-nc-green-soft text-nc-green'
                    : 'text-nc-ink-soft'}`}
              >
                <Icon size={18} />
                <span className="text-[11px] md:text-[14px]">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-auto space-y-3">
          <button
            onClick={() => signOut(auth)}
            className="w-full flex flex-col md:flex-row items-center gap-2 p-3 rounded-[8px] text-nc-ink-soft"
          >
            <LogOut size={16} />
            <span className="text-[11px] md:text-[13px]">ログアウト</span>
          </button>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto">
        {currentView === 'form' && <ConsentForm />}
        {currentView === 'search' && <ConsentSearch onBackToForm={() => setCurrentView('form')} />}
      </main>
    </div>
  );
}
