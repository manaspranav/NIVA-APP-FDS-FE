import React from 'react';

/**
 * Shared error banner component for the Restaurant Partner Portal.
 * Displays a red error message with a retry button.
 *
 * @param {string} message - The error message to display
 * @param {function} onRetry - Callback invoked when the user taps "Retry"
 */
function ErrorBanner({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="mx-4 my-4 bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm text-red-700">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-sm font-medium text-red-600 hover:text-red-800 underline focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 rounded"
              aria-label="Retry failed action"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ErrorBanner;
