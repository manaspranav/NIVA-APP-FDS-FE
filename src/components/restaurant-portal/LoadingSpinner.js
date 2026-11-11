import React from 'react';

/**
 * Shared loading spinner component for the Restaurant Partner Portal.
 * Displays a centered spinner with an optional message.
 */
function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mb-3"></div>
      {message && (
        <p className="text-gray-400 text-sm">{message}</p>
      )}
    </div>
  );
}

export default LoadingSpinner;
