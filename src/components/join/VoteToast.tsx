import React from 'react';

interface VoteToastProps {
  toast: {
    type: 'success' | 'error';
    title: string;
    subtitle?: string;
  };
  onDismiss: () => void;
}

export function VoteToast({ toast, onDismiss }: VoteToastProps) {
  return (
    <div
      className={`vote-toast-compact ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}
      role="status"
      onClick={onDismiss}
      title="Click to dismiss"
    >
      <span className="toast-icon" aria-hidden="true">
        {toast.type === 'error' ? '⚠️' : '✓'}
      </span>
      <div className="toast-text-box">
        <strong className="toast-title">{toast.title}</strong>
        {toast.subtitle && <span className="toast-subtitle">{toast.subtitle}</span>}
      </div>
      <button
        type="button"
        className="toast-close-btn"
        aria-label="Dismiss"
        onClick={e => {
          e.stopPropagation();
          onDismiss();
        }}
      >
        ✕
      </button>
      <div className="toast-countdown-bar" aria-hidden="true">
        <div className="toast-countdown-fill" />
      </div>
    </div>
  );
}
