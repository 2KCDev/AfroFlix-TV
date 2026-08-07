import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import Breadcrumbs from '../components/common/Breadcrumbs';
import LoadingSpinner from '../components/common/LoadingSpinner';
import FilmCard from '../components/cards/FilmCard';
import SEO from '../components/common/SEO';
import { api } from '../services/api';
import { ensureDirectDetailBackStack } from '../utils/navigation';
import { useLocale } from '../hooks/useLocale';

const ActorDetail = () => {
  const { language } = useLocale();
  const c = language === 'en' ? { missing: 'Actor not found', back: 'Back to actors', actors: 'Actors', biography: 'Biography', noBio: 'No biography available', birth: 'Date of birth', undisclosed: 'Not publicly disclosed', nationality: 'Nationality', filmography: 'Filmography', best: 'Best films', filmsIn: 'films in filmography' } : { missing: 'Acteur non trouvé', back: 'Retour aux acteurs', actors: 'Acteurs', biography: 'Biographie', noBio: 'Pas de biographie disponible', birth: 'Date de naissance', undisclosed: 'Non communiquée publiquement', nationality: 'Nationalité', filmography: 'Filmographie', best: 'Ses meilleurs films', filmsIn: 'films dans la filmographie' };
  const { slug } = useParams();
  const navigate = useNavigate();
  const [actor, setActor] = useState(null);
  const [films, setFilms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ensureDirectDetailBackStack({ detailPath: `/acteurs/${slug}`, listPath: '/acteurs' });
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
        <h2 className="text-2xl font-bold text-gray-900">{c.missing}</h2>
        <button
          onClick={() => navigate('/acteurs')}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          {c.back}
        </button>
      </div>
    );
  }

  const birthDate = actor.birth_date || actor.birthDate;
  const biography = language === 'en' && actor.biography_en?.trim()
    ? actor.biography_en
    : actor.biography;

  return (
    <div className="space-y-8">
      <SEO
        title={`${actor.name} : ${language === 'en' ? 'biography and films' : 'biographie et films'}`}
        description={(biography || `${language === 'en' ? 'Discover the biography and filmography of' : 'Découvrez la biographie et la filmographie de'} ${actor.name}.`).slice(0, 155)}
        image={actor.photo_url || actor.photoUrl}
        type="profile"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: actor.name,
          image: actor.photo_url || actor.photoUrl,
          birthDate,
          description: biography,
        }}
      />
      <Breadcrumbs items={[{ label: c.actors, to: '/acteurs' }, { label: actor.name }]} />

      <button
        onClick={() => navigate('/acteurs')}
        className="flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold"
      >
        <FiArrowLeft size={20} />
        {c.back}
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
              {films.length} {c.filmsIn}
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">{c.biography}</h2>
            <p className="text-justify text-gray-700 leading-relaxed">
              {biography || c.noBio}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">{c.birth}</p>
              <p className="font-semibold text-gray-900">
                {birthDate
                  ? new Date(birthDate).toLocaleDateString(language === 'en' ? 'en-GB' : 'fr-FR')
                  : c.undisclosed}
              </p>
            </div>
            {actor.nationality && (
              <div>
                <p className="text-sm text-gray-600">{c.nationality}</p>
                <p className="font-semibold text-gray-900">{actor.nationality}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filmography */}
      {films.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {c.filmography} ({films.length})
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
            {c.best}
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
