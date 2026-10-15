import React from 'react';

const LoadingSpinner = ({ message = 'Loading...', size = 'md' }) => {
  const spinnerClass = size === 'sm' ? 'spinner spinner-sm' : 'spinner';

  return (
    <div className="loading-overlay" role="status" aria-live="polite">
      <div className={spinnerClass}></div>
      {message && <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
