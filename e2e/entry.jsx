import '../src/index.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import ConsentForm from '../src/ConsentForm.jsx';
window.__calls = [];
window.__opened = [];
// window.open('', '_blank') で先に空のウィンドウを開き、後から
// printWindow.location.href = pdfUrl で URL を差し込む実装をモックする。
window.open = () => {
  const win = {
    closed: false,
    print() {
      window.__calls.push({ fn: 'print' });
    },
    addEventListener() {},
    close() {
      win.closed = true;
    },
  };
  let href = '';
  Object.defineProperty(win, 'location', {
    get() {
      return { href };
    },
    set(value) {
      href = typeof value === 'string' ? value : value.href;
      window.__opened.push(href);
    },
  });
  return win;
};
createRoot(document.getElementById('root')).render(<ConsentForm />);
