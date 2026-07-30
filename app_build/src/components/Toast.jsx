import React from 'react';

export default function Toast({ toast }) {
  if (!toast) return null;

  return (
    <div className={`toast ${toast.type}`}>
      <span>{toast.type === 'error' ? '❌' : toast.type === 'success' ? '✅' : 'ℹ️'} {toast.message}</span>
    </div>
  );
}
