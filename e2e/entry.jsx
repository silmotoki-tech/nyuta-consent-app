import '../src/index.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import ConsentForm from '../src/ConsentForm.jsx';
window.__calls = [];
window.__opened = [];
window.open = (url) => { window.__opened.push(url); return { print(){ window.__calls.push({fn:'print'}); }, addEventListener(){} }; };
createRoot(document.getElementById('root')).render(<ConsentForm />);
