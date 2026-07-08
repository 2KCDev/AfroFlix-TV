import React from 'react';
import { Link } from 'react-router-dom';

const ArticleCard = ({ article }) => {
  const image = article.featured_image || article.imageUrl;
  const date = article.published_at || article.created_at || article.createdAt;

  return (
    <Link
      to={`/actualites/${article.slug}`}
      className="group rounded-lg overflow-hidden bg-white shadow-md hover:shadow-lg transition-all"
    >
      {image && (
        <div className="bg-gray-300 h-40 overflow-hidden">
          <img
            src={image}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-4">
        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded font-semibold">
          {article.category || 'Article'}
        </span>
        <h3 className="font-bold text-gray-900 group-hover:text-red-600 transition mt-2 line-clamp-2">
          {article.title}
        </h3>
        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
          {article.excerpt || article.content?.substring(0, 100)}...
        </p>
        <div className="flex justify-between items-center text-xs text-gray-500 mt-3">
          <span>{article.readTime || '5'} min</span>
          <span>{date ? new Date(date).toLocaleDateString('fr-FR') : 'Date à venir'}</span>
        </div>
      </div>
    </Link>
  );
};

export default ArticleCard;
