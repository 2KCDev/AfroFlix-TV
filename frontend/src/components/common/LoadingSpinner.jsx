import React from 'react';

const LoadingSpinner = ({ fullPage = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-300 border-t-red-600"></div>
      <p className="mt-4 text-gray-600 font-medium">Chargement en cours...</p>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;
