import React from 'react';
import { useLocale } from '../hooks/useLocale';

const LoadingState = ({ label }) => {
  const { t } = useLocale();
  return <div className="py-12 text-center text-gray-600">{label || t('common.loading')}</div>;
};

export default LoadingState;
