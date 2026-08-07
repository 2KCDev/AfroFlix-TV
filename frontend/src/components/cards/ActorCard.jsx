import React from 'react';
import { Link } from 'react-router-dom';
import { useLocale } from '../../hooks/useLocale';

const ActorCard = ({ actor, eager = false }) => {
  const { language, t } = useLocale();
  const filmCount = actor.film_count || actor.filmCount || 0;
  const biography = language === 'en' && actor.biography_en?.trim()
    ? actor.biography_en
    : actor.biography;

  return (
    <Link
      to={`/acteurs/${actor.slug}`}
      className="group rounded-lg overflow-hidden bg-white shadow-md hover:shadow-lg transition-all"
    >
      <div className="bg-gray-300 aspect-square overflow-hidden">
        <img
          src={actor.photo_url || actor.photoUrl || 'https://via.placeholder.com/300x300'}
          alt={actor.name}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-900 group-hover:text-red-600 transition mb-1">
          {actor.name}
        </h3>
        <p className="text-sm text-gray-600 mb-2">
          {filmCount} {filmCount === 1 ? t('card.film') : t('card.films')}
        </p>
        <p className="text-xs text-gray-500 line-clamp-2">
          {biography || t('card.noBiography')}
        </p>
      </div>
    </Link>
  );
};

export default ActorCard;
