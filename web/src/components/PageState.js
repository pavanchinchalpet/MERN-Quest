import React from 'react';

export function PageSpinner({ message = 'Loading content...', compact = false }) {
  return (
    <div className={`flex w-full items-center justify-center ${compact ? 'min-h-[30vh]' : 'min-h-[60vh]'}`}>
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-dark-border border-t-brand-primary" />
        {message ? <p className="text-sm font-medium text-text-secondary">{message}</p> : null}
      </div>
    </div>
  );
}

export function PageError({ message, actionLabel = 'Try again', onAction }) {
  return (
    <div className="w-full py-8">
      <div className="glass-card border-brand-danger/30 bg-brand-danger/5 p-6 text-brand-danger">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider">Something went wrong</p>
            <p className="mt-2 text-sm font-medium">{message || 'Unable to load this page right now.'}</p>
          </div>
          {onAction ? (
            <button type="button" onClick={onAction} className="btn-secondary whitespace-nowrap">
              {actionLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
