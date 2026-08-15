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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 md:p-10 space-y-6"
      >
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 mb-4">
            <Lock size={28} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">にゅうた動物病院</h1>
          <p className="text-gray-500 mt-1">承諾書システム ログイン</p>
        </div>

        <div className="flex flex-col text-left">
          <label className="font-semibold text-gray-700 mb-1" htmlFor="login-email">
            メールアドレス
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="username"
            className="border-2 border-gray-300 p-3 rounded-lg bg-gray-50 text-xl"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="staff@example.com"
          />
        </div>

        <div className="flex flex-col text-left">
          <label className="font-semibold text-gray-700 mb-1" htmlFor="login-password">
            パスワード
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            className="border-2 border-gray-300 p-3 rounded-lg bg-gray-50 text-xl"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <p className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full flex items-center justify-center gap-3 text-white px-6 py-4 rounded-2xl text-xl font-bold shadow-lg transition-all
            ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'}`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" size={24} /> ログイン中...
            </>
          ) : (
            'ログイン'
          )}
        </button>
      </form>
    </div>
  );
}
