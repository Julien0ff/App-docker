import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { Toaster } from 'sonner';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="bottom-right"
      theme="system"
      richColors={false}
      toastOptions={{
        className: 'font-sans text-sm rounded-xl border shadow-lg dark:bg-nothing-card dark:border-nothing-border dark:text-zinc-100 bg-white border-zinc-200 text-zinc-900',
        duration: 3500,
      }}
    />
  </React.StrictMode>
);
