import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiEdit3 } from 'react-icons/fi';
import Breadcrumbs from '../components/common/Breadcrumbs';
import LoadingSpinner from '../components/common/LoadingSpinner';
import SEO from '../components/common/SEO';
import { api } from '../services/api';
import { formatDate, truncateText } from '../utils/content';

const ReviewsPage = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [analyses, rankings] = await Promise.all([
          api.articles({ category: 'Analyses', limit: 10 }),
          api.articles({ category: 'Classements', limit: 10 }),
        ]);
        setArticles([...(analyses.articles || []), ...(rankings.articles || [])]);
      } finally {
        setLoading(false);
      }
    };
    load();
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="space-y-8">
      <SEO
        title="Critiques et analyses AfroFlix.TV"
        description="Critiques, analyses et sélections éditoriales pour mieux comprendre les films AfroFlix.TV."
      />
      <Breadcrumbs items={[{ label: 'Critiques' }]} />

      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <FiEdit3 className="text-red-600" />
          Critiques AfroFlix.TV
        </h1>
        <p className="text-gray-600">Analyses originales, classements éditoriaux et conseils pour choisir vos prochains films.</p>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {articles.map((article) => (
            <Link
              key={article.id}
              to={`/actualites/${article.slug}`}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition"
            >
              <img
                src={article.featured_image || 'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=900&q=80'}
                alt={article.title}
                className="h-48 w-full object-cover bg-gray-200"
                loading="lazy"
              />
              <div className="p-5">
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded font-semibold">{article.category}</span>
                <h2 className="text-xl font-bold text-gray-900 mt-3 mb-2">{article.title}</h2>
                <p className="text-gray-600 text-sm mb-4">{truncateText(article.content, 180)}</p>
                <p className="text-xs text-gray-500">{formatDate(article.published_at || article.created_at)}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-10 text-center">
          <p className="font-semibold text-gray-900">Aucune critique publiée pour le moment.</p>
          <p className="text-gray-600 mt-2">Les analyses apparaîtront ici dès publication dans le blog.</p>
        </div>
      )}
    </div>
  );
};

export default ReviewsPage;
