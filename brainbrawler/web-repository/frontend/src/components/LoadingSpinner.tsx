import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-secondary-500">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
        <p className="text-white text-xl mt-4 font-inter">Caricamento BrainBrawler...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner; 