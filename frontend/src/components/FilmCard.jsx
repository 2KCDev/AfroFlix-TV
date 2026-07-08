import React from 'react';
import { Link } from 'react-router-dom';

const FilmCard = ({ film }) => (
  <article className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition">
    <Link to={`/films/${film.slug}`}>
      <img
        src={film.poster_url || 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=900&q=80'}
        alt={film.title}
        className="h-56 w-full object-cover bg-gray-200"
        loading="lazy"
      />
    </Link>
    <div className="p-4">
      <div className="text-sm text-gray-500 mb-2">{film.year || 'AfroFlix.TV'} · Note {Number(film.average_rating || 0).toFixed(1)}/5</div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">
        <Link to={`/films/${film.slug}`} className="hover:text-red-600">{film.title}</Link>
      </h3>
      <p className="text-gray-600 text-sm line-clamp-1">{film.description}</p>
    </div>
  </article>
);

export default FilmCard;
