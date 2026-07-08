import React from 'react';

const LoadingState = ({ label = 'Chargement...' }) => (
  <div className="py-12 text-center text-gray-600">{label}</div>
);

export default LoadingState;
