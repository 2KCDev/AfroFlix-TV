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
      <div
        className="relative flex h-40 items-end overflow-hidden bg-red-50 p-4"
        style={image ? { backgroundImage: `url(${image})`, backgroundPosition: 'center', backgroundSize: 'cover' } : undefined}
      >
        {image && <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10 transition group-hover:from-black/85" />}
        <h3 className={`relative line-clamp-2 font-bold transition ${image ? 'text-white' : 'text-gray-900 group-hover:text-red-600'}`}>
          {article.title}
        </h3>
      </div>
      <div className="p-4">
        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded font-semibold">
          {article.category || 'Article'}
        </span>
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
