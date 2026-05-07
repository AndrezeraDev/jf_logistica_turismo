import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Aplica tema antes do React montar (evita "flash" de tema errado)
try {
  const raw = localStorage.getItem('jf-system-v3');
  if (raw) {
    const parsed = JSON.parse(raw);
    const theme = parsed?.state?.theme;
    if (theme === 'light' || theme === 'dark') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }
} catch {
  /* ignora */
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
