import React from 'react';
import { Link } from 'react-router-dom';

const ArticleCard = ({ article, horizontal = false }) => {
  const image = article.featured_image || article.imageUrl;
  const date = article.published_at || article.created_at || article.createdAt;

  if (horizontal) {
    return (
      <Link
        to={`/actualites/${article.slug}`}
        className="block overflow-hidden rounded-lg border border-gray-200 bg-white transition hover:shadow-lg"
      >
        <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <span className="rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
              {article.category}
            </span>
            <h3 className="mt-3 text-2xl font-bold text-gray-900 transition hover:text-red-600">
              {article.title}
            </h3>
            <p className="mb-4 mt-2 line-clamp-3 text-gray-600">
              {article.excerpt || article.content?.substring(0, 200)}...
            </p>
            <div className="flex gap-4 text-sm text-gray-500">
              <span>{date ? new Date(date).toLocaleDateString('fr-FR') : 'Date à venir'}</span>
              <span>{article.readTime || '5'} min de lecture</span>
            </div>
          </div>
          {image && (
            <div className="md:col-span-1">
              <img
                src={image}
                alt={article.title}
                loading="lazy"
                decoding="async"
                className="h-40 w-full rounded-lg object-cover md:h-full"
              />
            </div>
          )}
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/actualites/${article.slug}`}
      className="group overflow-hidden rounded-lg bg-white shadow-md transition hover:shadow-lg"
    >
      <div className="flex h-40 items-center justify-center bg-red-50 p-6">
        <h3 className="line-clamp-3 text-center text-lg font-bold text-gray-800 transition group-hover:text-red-600">
          {article.title}
        </h3>
      </div>
      <div className="p-4">
        <p className="mb-2 line-clamp-2 text-sm text-gray-600">
          {article.excerpt || article.content?.substring(0, 100)}...
        </p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="font-semibold text-orange-600">{article.category}</span>
          <span>{date ? new Date(date).toLocaleDateString('fr-FR') : 'Date à venir'}</span>
        </div>
      </div>
    </Link>
  );
};

export default ArticleCard;
