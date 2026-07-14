import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import Breadcrumbs from '../components/common/Breadcrumbs';
import LoadingSpinner from '../components/common/LoadingSpinner';
import FilmCard from '../components/cards/FilmCard';
import SEO from '../components/common/SEO';
import { api } from '../services/api';

const ActorDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [actor, setActor] = useState(null);
  const [films, setFilms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActor = async () => {
      try {
        const data = await api.actor(slug);
        setActor(data);
        if (data.filmography) setFilms(data.filmography);
      } catch (error) {
        console.error('Error fetching actor:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActor();
    window.scrollTo(0, 0);
  }, [slug]);

  if (loading) return <LoadingSpinner fullPage />;
  if (!actor) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-gray-900">Acteur non trouvé</h2>
        <button
          onClick={() => navigate('/acteurs')}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retour aux acteurs
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SEO
        title={`${actor.name} : biographie et films`}
        description={(actor.biography || `Découvrez la biographie et la filmographie de ${actor.name}.`).slice(0, 155)}
        image={actor.photo_url || actor.photoUrl}
        type="profile"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: actor.name,
          image: actor.photo_url || actor.photoUrl,
          birthDate: actor.birth_date || actor.birthDate,
          description: actor.biography,
        }}
      />
      <Breadcrumbs items={[{ label: 'Acteurs', to: '/acteurs' }, { label: actor.name }]} />

      <button
        onClick={() => navigate('/acteurs')}
        className="flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold"
      >
        <FiArrowLeft size={20} />
        Retour aux acteurs
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Photo */}
        <div>
          <img
            src={actor.photo_url || actor.photoUrl || 'https://via.placeholder.com/300x400'}
            alt={actor.name}
            className="w-full rounded-lg shadow-lg"
          />
        </div>

        {/* Info */}
        <div className="md:col-span-2 space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{actor.name}</h1>
            <p className="text-gray-600 text-lg">
              {films.length} film{films.length !== 1 ? 's' : ''} dans la filmographie
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Biographie</h2>
            <p className="text-justify text-gray-700 leading-relaxed">
              {actor.biography || 'Pas de biographie disponible'}
            </p>
          </div>

          {(actor.birth_date || actor.birthDate) && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Date de naissance</p>
                <p className="font-semibold text-gray-900">
                  {new Date(actor.birth_date || actor.birthDate).toLocaleDateString('fr-FR')}
                </p>
              </div>
              {actor.nationality && (
                <div>
                  <p className="text-sm text-gray-600">Nationalité</p>
                  <p className="font-semibold text-gray-900">{actor.nationality}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Filmography */}
      {films.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Filmographie ({films.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {films.map((film) => (
              <FilmCard key={film.id} film={film} />
            ))}
          </div>
        </div>
      )}

      {(actor.best_films || []).length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Ses meilleurs films
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {actor.best_films.map((film) => (
              <FilmCard key={film.id} film={film} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActorDetail;
