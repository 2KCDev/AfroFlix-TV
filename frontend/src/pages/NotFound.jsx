import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiHome, FiArrowRight } from 'react-icons/fi';
import SearchSuggest from '../components/common/SearchSuggest';
import { useLocale } from '../hooks/useLocale';

const NotFound = () => {
  const { t } = useLocale();
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-8 max-w-lg">
        <div className="space-y-2">
          <h1 className="text-7xl font-bold text-red-600">404</h1>
          <h2 className="text-3xl font-bold text-gray-900">{t('notFound.title')}</h2>
        </div>

        <p className="text-gray-600 text-lg">
          {t('notFound.description')}
        </p>

        <SearchSuggest
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder={t('notFound.search')}
        />

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition"
          >
            <FiHome size={20} />
            {t('notFound.home')}
          </Link>
          <Link
            to="/films"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-red-600 text-red-600 font-bold rounded-lg hover:bg-red-50 transition"
          >
            {t('notFound.films')}
            <FiArrowRight size={20} />
          </Link>
        </div>

        <div className="pt-8">
          <p className="text-gray-500 text-sm">
            {t('notFound.brokenLink')}
            <Link to="/contact" className="text-red-600 hover:text-red-700 font-semibold ml-1">
              {t('notFound.report')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
