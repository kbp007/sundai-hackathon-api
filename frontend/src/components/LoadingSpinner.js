import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ size = 'default', text = 'Loading...' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    default: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-sundai-600`} />
      {text && (
        <p className="mt-4 text-gray-600 font-medium">{text}</p>
      )}
    </div>
  );
};

export default LoadingSpinner; 