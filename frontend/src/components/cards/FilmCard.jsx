import React from 'react';
import { Link } from 'react-router-dom';
import { FiStar, FiHeart, FiPlay } from 'react-icons/fi';
import { FiHeart as FiHeartFilled } from 'react-icons/fi';

const FilmCard = ({ film, isFavorited = false, onFavoriteToggle, eager = false }) => {
  const rating = Number(film.average_rating ?? film.averageRating);
  const displayRating = Number.isFinite(rating) && rating > 0 ? rating.toFixed(1) : 'N/A';
  const posterUrl = film.poster_url || film.posterUrl || 'https://via.placeholder.com/300x450?text=No+Image';
  const year = film.year || film.releaseYear || '—';
  const genre = film.genres?.[0]?.name || film.genre || '—';
  
  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-lg bg-white shadow-md transition-all duration-300 hover:shadow-xl">
      {/* Image Container */}
      <Link to={`/films/${film.slug}`} className="block relative overflow-hidden bg-gray-300 aspect-[2/3]">
        <img
          src={posterUrl}
          alt={film.title}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />

        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/20">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-red-600 shadow-lg transition group-hover:scale-110">
            <FiPlay size={26} fill="currentColor" className="ml-1" />
          </span>
        </div>
        
        {/* Rating Badge */}
        <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-lg flex items-center gap-1 text-sm font-bold">
          <FiStar size={14} fill="currentColor" />
          {displayRating}
        </div>

        {/* Views Badge */}
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs font-semibold">
          {film.views || 0} vues
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Title */}
        <Link to={`/films/${film.slug}`}>
          <h3 className="mb-2 min-h-12 break-words font-bold leading-snug text-gray-900 transition hover:text-red-600">
            {film.title}
          </h3>
        </Link>

        {/* Meta */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
          <span>{year}</span>
          <span className="break-words text-right font-semibold text-orange-600">{genre}</span>
        </div>

        {/* Description */}
        <p className="mb-3 line-clamp-1 break-words text-sm text-gray-600">
          {film.description || 'Pas de description disponible'}
        </p>

        {/* Footer */}
        <div className="mt-auto flex items-center gap-2">
          <Link
            to={`/films/${film.slug}`}
            className="flex-grow px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition text-center"
          >
            Voir plus
          </Link>
          {onFavoriteToggle && (
            <button
              onClick={() => onFavoriteToggle(film.id)}
              className="p-2 border-2 border-gray-300 hover:border-red-600 rounded-lg transition"
              title="Ajouter aux favoris"
            >
              {isFavorited ? (
                <FiHeartFilled size={18} className="text-red-600" />
              ) : (
                <FiHeart size={18} className="text-gray-400" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilmCard;
