import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Loader2, Lock } from 'lucide-react';
import { auth } from './firebase';

function authErrorMessage(error) {
  const code = error?.code || '';
  switch (code) {
    case 'auth/invalid-email':
      return 'メールアドレスの形式が正しくありません。';
    case 'auth/user-disabled':
      return 'このアカウントは無効になっています。';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
      return 'メールアドレスまたはパスワードが正しくありません。';
    case 'auth/too-many-requests':
      return '試行回数が多すぎます。しばらくしてから再度お試しください。';
    case 'auth/network-request-failed':
      return '通信に失敗しました。ネットワークを確認してください。';
    case 'auth/operation-not-allowed':
      return 'メール/パスワードのログインが有効になっていません。管理者に連絡してください。';
    case 'auth/invalid-api-key':
    case 'auth/api-key-not-valid':
      return 'アプリの設定が正しくありません。管理者に連絡してください。';
    default:
      return `ログインに失敗しました。${code || error?.message ? `（${code || error.message}）` : ''}`;
  }
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError('メールアドレスとパスワードを入力してください。');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-nc-cream flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-nc-cream rounded-[10px] nc-hairline p-8 md:p-10 space-y-6"
      >
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-[8px] bg-nc-green-soft text-nc-green mb-4">
            <Lock size={22} />
          </div>
          <h1 className="text-[19px] font-medium text-nc-green">にゅうた動物病院</h1>
          <p className="text-[12px] text-nc-ink-soft mt-1">承諾書システム ログイン</p>
        </div>

        <div className="flex flex-col text-left">
          <label className="text-[12px] text-nc-brown mb-1" htmlFor="login-email">
            メールアドレス
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="username"
            className="border-[0.5px] border-nc-line p-2.5 rounded-[8px] bg-nc-cream text-[15px] text-nc-ink"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="staff@example.com"
          />
        </div>

        <div className="flex flex-col text-left">
          <label className="text-[12px] text-nc-brown mb-1" htmlFor="login-password">
            パスワード
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            className="border-[0.5px] border-nc-line p-2.5 rounded-[8px] bg-nc-cream text-[15px] text-nc-ink"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-[13px] text-nc-ink border-[0.5px] border-nc-line rounded-[8px] px-3 py-2.5" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-[8px] text-[15px]
            ${isSubmitting ? 'bg-nc-line text-nc-ink-soft' : 'bg-nc-green text-nc-cream'}`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" size={16} /> ログイン中...
            </>
          ) : (
            'ログイン'
          )}
        </button>
      </form>
    </div>
  );
}
