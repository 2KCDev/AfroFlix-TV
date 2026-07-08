import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart } from 'react-icons/fi';
import FilmCard from '../components/cards/FilmCard';
import Breadcrumbs from '../components/common/Breadcrumbs';
import LoadingSpinner from '../components/common/LoadingSpinner';
import SEO from '../components/common/SEO';
import { api } from '../services/api';

const FavoritesPage = () => {
  const [films, setFilms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const data = await api.favorites();
      setFilms(data.films || []);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="space-y-8">
      <SEO
        title="Mes films favoris"
        description="Retrouvez les films AfroFlix.TV sauvegardés dans votre espace personnel."
      />
      <Breadcrumbs items={[{ label: 'Favoris' }]} />

      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <FiHeart className="text-red-600" />
          Mes films favoris
        </h1>
        <p className="text-gray-600">Votre sélection personnelle de films AfroFlix.TV à revoir ou découvrir.</p>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-800">{error}</div>
      ) : films.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {films.map((film) => (
            <FilmCard key={film.id} film={film} />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-10 text-center">
          <p className="text-lg font-semibold text-gray-900 mb-2">Aucun favori pour le moment</p>
          <p className="text-gray-600 mb-6">Ajoutez des films depuis leur fiche pour les retrouver ici.</p>
          <Link to="/films" className="inline-block px-5 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold">
            Explorer les films
          </Link>
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;

