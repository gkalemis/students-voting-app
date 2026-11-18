import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LocaleProvider } from './context/LocaleContext';
import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './styles.css';
import './extras.css';

if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && (event.reason.message?.includes('WebSocket') || String(event.reason).includes('WebSocket'))) {
      event.preventDefault();
    }
  });
  window.addEventListener('error', (event) => {
    if (event.message && (event.message.includes('WebSocket') || String(event.error).includes('WebSocket'))) {
      event.preventDefault();
    }
  });
}

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(
    <ErrorBoundary>
      <BrowserRouter>
        <LocaleProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </LocaleProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
