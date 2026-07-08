import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiEye, FiFile, FiTrendingUp, FiUsers } from 'react-icons/fi';
import ActorGrid from '../components/actors/ActorGrid';
import ArticleCard from '../components/blog/ArticleCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import SEO from '../components/common/SEO';
import FilmGrid from '../components/films/FilmGrid';
import EditorialRequirements from '../components/sections/EditorialRequirements';
import { useActors, useArticles, useFilms, useTrendingFilms } from '../hooks/useFilms';

const Home = () => {
  const { data: popularData, loading: popularLoading } = useFilms({
    page: 1,
    limit: 6,
    sortBy: 'popular',
  });

  const { data: filmsData, loading: filmsLoading } = useFilms({
    page: 1,
    limit: 6,
    sortBy: 'created_at',
  });

  // Fetch trending films (first 6)
  const { data: trendingData, loading: trendingLoading } = useTrendingFilms();

  // Fetch latest articles (first 3)
  const { data: articlesData, loading: articlesLoading } = useArticles({
    page: 1,
    limit: 3,
  });

  const { data: actorsData, loading: actorsLoading } = useActors({
    page: 1,
    limit: 4,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const popular = popularData?.films || [];
  const films = filmsData?.films || [];
  const trending = trendingData?.films || [];
  const articles = articlesData?.articles || [];
  const actors = actorsData?.actors || [];

  return (
    <div className="space-y-16">
      <SEO
        title="Films, acteurs et actualités AfroFlix.TV"
        description="Découvrez les films populaires, les tendances, les acteurs et les articles du cinéma AfroFlix.TV en français."
      />
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 rounded-lg overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')]"></div>
        </div>
        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Bienvenue sur AFROFLIX.TV
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Découvrez les meilleurs films, acteurs et histoires du cinéma africain.
            Une plateforme dédiée à la richesse du AfroFlix.TV.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              to="/films"
              className="px-8 py-3 bg-white text-red-600 font-bold rounded-lg hover:bg-gray-100 transition transform hover:scale-105"
            >
              Explorer les films
            </Link>
            <Link
              to="/actualites"
              className="px-8 py-3 border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-red-600 transition"
            >
              Lire les articles
            </Link>
          </div>
        </div>
      </section>

      <EditorialRequirements />

      {/* Popular Films Section */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <FiEye className="text-red-600" /> Films populaires
            </h2>
            <p className="text-gray-600">
              Les titres les plus consultés par la communauté
            </p>
          </div>
          <Link
            to="/films"
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 font-semibold transition"
          >
            Voir tous <FiArrowRight />
          </Link>
        </div>

        {popularLoading ? (
          <LoadingSpinner />
        ) : popular.length > 0 ? (
          <FilmGrid films={popular} />
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Aucun film disponible pour le moment</p>
          </div>
        )}
      </section>

      {/* Trending Films Section */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <FiTrendingUp className="text-orange-500" /> En tendance
            </h2>
            <p className="text-gray-600">
              Les films les plus regardés et populaires cette semaine
            </p>
          </div>
          <Link
            to="/films?sortBy=trending"
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 font-semibold transition"
          >
            Voir plus <FiArrowRight />
          </Link>
        </div>

        {trendingLoading ? (
          <LoadingSpinner />
        ) : trending.length > 0 ? (
          <FilmGrid films={trending.slice(0, 6)} />
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Aucun film en tendance pour le moment</p>
          </div>
        )}
      </section>

      {/* Latest Films Section */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Derniers films
            </h2>
            <p className="text-gray-600">
              Découvrez les films nouvellement ajoutés à notre plateforme
            </p>
          </div>
          <Link
            to="/films"
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 font-semibold transition"
          >
            Voir tous <FiArrowRight />
          </Link>
        </div>

        {filmsLoading ? (
          <LoadingSpinner />
        ) : films.length > 0 ? (
          <FilmGrid films={films} />
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Aucun film disponible pour le moment</p>
          </div>
        )}
      </section>

      {/* Articles Section */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <FiFile className="text-red-600" /> Blog AfroFlix.TV
            </h2>
            <p className="text-gray-600">
              Les dernières actualités et analyses du cinéma africain
            </p>
          </div>
          <Link
            to="/actualites"
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 font-semibold transition"
          >
            Voir tous les articles <FiArrowRight />
          </Link>
        </div>

        {articlesLoading ? (
          <LoadingSpinner />
        ) : articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard key={article.id || article.slug} article={article} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Aucun article disponible pour le moment</p>
          </div>
        )}
      </section>

      {/* Actors Section */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <FiUsers className="text-red-600" /> Acteurs populaires
            </h2>
            <p className="text-gray-600">
              Explorez les profils et filmographies des talents AfroFlix.TV
            </p>
          </div>
          <Link
            to="/acteurs"
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 font-semibold transition"
          >
            Voir tous <FiArrowRight />
          </Link>
        </div>

        {actorsLoading ? (
          <LoadingSpinner />
        ) : actors.length > 0 ? (
          <ActorGrid actors={actors} />
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Aucun acteur disponible pour le moment</p>
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg text-white text-center">
        <h2 className="text-4xl font-bold mb-4">Rejoignez notre communauté</h2>
        <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
          Créez un compte pour laisser des avis, noter vos films favoris et accéder à du contenu exclusif.
        </p>
        <Link
          to="/auth"
          className="inline-block px-8 py-3 bg-white text-red-600 font-bold rounded-lg hover:bg-gray-100 transition transform hover:scale-105"
        >
          S'inscrire gratuitement
        </Link>
      </section>
    </div>
  );
};

export default Home;
