import React from 'react';
import FilmCard from '../cards/FilmCard';

const FilmGrid = ({ films = [], columns = 'default' }) => {
  const gridClass = columns === 'dense'
    ? 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
    : 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div className={gridClass}>
      {films.map((film, index) => (
        <FilmCard key={film.id || film.slug} film={film} eager={index === 0} />
      ))}
    </div>
  );
};

export default FilmGrid;
