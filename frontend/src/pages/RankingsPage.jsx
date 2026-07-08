import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiAward, FiEye, FiStar, FiTrendingUp } from 'react-icons/fi';
import Breadcrumbs from '../components/common/Breadcrumbs';
import LoadingSpinner from '../components/common/LoadingSpinner';
import SEO from '../components/common/SEO';
import { api } from '../services/api';

const RankingRow = ({ film, index, metric }) => (
  <Link
    to={`/films/${film.slug}`}
    className="grid grid-cols-[48px_64px_1fr_auto] gap-4 items-center bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition"
  >
    <div className="text-2xl font-bold text-red-600 text-center">{index + 1}</div>
    <img
      src={film.poster_url || 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=300&q=80'}
      alt={`Affiche ${film.title}`}
      className="h-20 w-14 rounded object-cover bg-gray-200"
      loading="lazy"
    />
    <div className="min-w-0">
      <h3 className="font-bold text-gray-900 truncate">{film.title}</h3>
      <p className="text-sm text-gray-500">{film.year || 'Année inconnue'} · {film.country || 'AfroFlix.TV'}</p>
    </div>
    <div className="text-right">
      <p className="font-bold text-gray-900">{metric}</p>
      <p className="text-xs text-gray-500">score</p>
    </div>
  </Link>
);

const RankingsPage = () => {
  const [films, setFilms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [popular, rated, trending] = await Promise.all([
          api.films({ page: 1, limit: 10, sortBy: 'popular' }),
          api.films({ page: 1, limit: 10, sortBy: 'rated' }),
          api.trending(),
        ]);
        setFilms({
          popular: popular.data || popular.films || [],
          rated: rated.data || rated.films || [],
          trending: trending.data || trending.films || trending || [],
        });
      } finally {
        setLoading(false);
      }
    };
    load();
    window.scrollTo(0, 0);
  }, []);

  const sections = useMemo(() => [
    {
      title: 'Films les plus vus',
      icon: FiEye,
      items: films.popular || [],
      metric: (film) => `${Number(film.views || 0).toLocaleString()} vues`,
    },
    {
      title: 'Films les mieux notés',
      icon: FiStar,
      items: films.rated || [],
      metric: (film) => `${Number(film.average_rating || 0).toFixed(1)}/5`,
    },
    {
      title: 'Tendances AfroFlix.TV',
      icon: FiTrendingUp,
      items: films.trending || [],
      metric: (film) => `${Number(film.views || 0).toLocaleString()} vues`,
    },
  ], [films]);

  return (
    <div className="space-y-8">
      <SEO
        title="Classements AfroFlix.TV"
        description="Top films AfroFlix.TV par vues, notes et tendances pour découvrir les titres les plus populaires."
      />
      <Breadcrumbs items={[{ label: 'Classements' }]} />

      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <FiAward className="text-red-600" />
          Classements AfroFlix.TV
        </h1>
        <p className="text-gray-600">Des classements utiles pour explorer les films les plus consultés, notés et partagés.</p>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <section key={section.title} className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Icon className="text-red-600" />
                  {section.title}
                </h2>
                <div className="space-y-3">
                  {section.items.map((film, index) => (
                    <RankingRow key={`${section.title}-${film.id}`} film={film} index={index} metric={section.metric(film)} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RankingsPage;

