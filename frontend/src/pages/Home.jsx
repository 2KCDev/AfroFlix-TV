import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiEye, FiFile, FiTrendingUp, FiUsers } from 'react-icons/fi';
import ActorGrid from '../components/actors/ActorGrid';
import ArticleCard from '../components/blog/ArticleCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import SEO from '../components/common/SEO';
import FilmGrid from '../components/films/FilmGrid';
import EditorialRequirements from '../components/sections/EditorialRequirements';
import { useActors, useArticles, useFilms, useTrendingFilms } from '../hooks/useFilms';
import { useLocale } from '../hooks/useLocale';

const Home = () => {
  const { language } = useLocale();
  const c = language === 'en' ? {
    seoTitle: 'Films, actors and African cinema news', seoDescription: 'Discover popular films, trends, actors and articles about African cinema on AfroFlix.TV.',
    welcome: 'Welcome to AfroFlix.TV', hero: 'Discover the best films, the most popular actors and the latest African cinema news. AfroFlix.TV shines a light on the works, talent and richness of African cinema.',
    explore: 'Explore films', articles: 'Read articles', popular: 'Popular films', popularText: 'The titles most viewed by the community.', all: 'View all', popularError: 'Popular films are temporarily unavailable. Please try again shortly.', noFilm: 'No films available at the moment.',
    trending: 'Trending', trendingText: 'The most watched and popular films this week.', more: 'View more', trendingError: 'Trending films are temporarily unavailable. Please try again shortly.', noTrending: 'No trending films at the moment.',
    latest: 'Latest films', latestText: 'Discover the films newly added to our platform.', latestError: 'Latest films are temporarily unavailable. Please try again shortly.', blogText: 'Latest news, interviews, reviews and analyses from African cinema.', allArticles: 'View all articles', articlesError: 'Articles are temporarily unavailable. Please try again shortly.', noArticle: 'No articles available at the moment.',
    popularActors: 'Popular actors', actorsText: 'Discover the profiles, careers and filmographies of African cinema actors.', actorsError: 'Actors are temporarily unavailable. Please try again shortly.', noActor: 'No actors available at the moment.', join: 'Join the AfroFlix.TV community', joinText: 'Create your free account to rate your favourite films, save favourites, publish reviews and join the AfroFlix.TV community.', signUp: 'Sign up for free',
  } : {
    seoTitle: 'Films, acteurs et actualités AfroFlix.TV', seoDescription: 'Découvrez les films populaires, les tendances, les acteurs et les articles du cinéma africain sur AfroFlix.TV.',
    welcome: 'Bienvenue sur AfroFlix.TV', hero: 'Découvrez les meilleurs films, les acteurs les plus populaires et les dernières actualités du cinéma africain. AfroFlix.TV met en lumière les œuvres, les talents et la richesse du septième art africain.',
    explore: 'Explorer les films', articles: 'Lire les articles', popular: 'Films populaires', popularText: 'Les titres les plus consultés par la communauté.', all: 'Voir tous', popularError: 'Les films populaires sont momentanément indisponibles. Réessayez dans quelques instants.', noFilm: 'Aucun film disponible pour le moment.',
    trending: 'En tendance', trendingText: 'Les films les plus regardés et populaires cette semaine.', more: 'Voir plus', trendingError: 'Les tendances sont momentanément indisponibles. Réessayez dans quelques instants.', noTrending: 'Aucun film en tendance pour le moment.',
    latest: 'Derniers films', latestText: 'Découvrez les films nouvellement ajoutés à notre plateforme.', latestError: 'Les derniers films sont momentanément indisponibles. Réessayez dans quelques instants.', blogText: 'Les dernières actualités, interviews, critiques et analyses du cinéma africain.', allArticles: 'Voir tous les articles', articlesError: 'Les articles sont momentanément indisponibles. Réessayez dans quelques instants.', noArticle: 'Aucun article disponible pour le moment.',
    popularActors: 'Acteurs populaires', actorsText: 'Découvrez les profils, les carrières et les filmographies des acteurs du cinéma africain.', actorsError: 'Les acteurs sont momentanément indisponibles. Réessayez dans quelques instants.', noActor: 'Aucun acteur disponible pour le moment.', join: 'Rejoignez la communauté AfroFlix.TV', joinText: 'Créez gratuitement votre compte pour noter vos films préférés, enregistrer vos favoris, publier vos critiques et rejoindre la communauté AfroFlix.TV.', signUp: "S'inscrire gratuitement",
  };
  const { data: popularData, loading: popularLoading, error: popularError } = useFilms({
    page: 1,
    limit: 6,
    sortBy: 'popular',
  });

  const { data: filmsData, loading: filmsLoading, error: filmsError } = useFilms({
    page: 1,
    limit: 6,
    sortBy: 'created_at',
  });

  const { data: trendingData, loading: trendingLoading, error: trendingError } = useTrendingFilms();

  const { data: articlesData, loading: articlesLoading, error: articlesError } = useArticles({
    page: 1,
    limit: 3,
  });

  const { data: actorsData, loading: actorsLoading, error: actorsError } = useActors({
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
        title={c.seoTitle}
        description={c.seoDescription}
      />

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 rounded-lg overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')]"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            {c.welcome}
          </h1>

          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto opacity-90">
            {c.hero}
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              to="/films"
              className="px-8 py-3 bg-white text-red-600 font-bold rounded-lg hover:bg-gray-100 transition transform hover:scale-105"
            >
              {c.explore}
            </Link>

            <Link
              to="/actualites"
              className="px-8 py-3 border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-red-600 transition"
            >
              {c.articles}
            </Link>
          </div>
        </div>
      </section>

      <EditorialRequirements />

      {/* Popular Films */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <FiEye className="text-red-600" />
              {c.popular}
            </h2>

            <p className="text-gray-600">
              {c.popularText}
            </p>
          </div>

          <Link
            to="/films"
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 font-semibold transition"
          >
            {c.all}
            <FiArrowRight />
          </Link>
        </div>

        {popularLoading ? (
          <LoadingSpinner />
        ) : popularError ? (
          <ErrorState message={c.popularError} />
        ) : popular.length > 0 ? (
          <FilmGrid films={popular} />
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">
              {c.noFilm}
            </p>
          </div>
        )}
      </section>

      {/* Trending */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <FiTrendingUp className="text-orange-500" />
              {c.trending}
            </h2>

            <p className="text-gray-600">
              {c.trendingText}
            </p>
          </div>

          <Link
            to="/films?sortBy=trending"
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 font-semibold transition"
          >
            {c.more}
            <FiArrowRight />
          </Link>
        </div>

        {trendingLoading ? (
          <LoadingSpinner />
        ) : trendingError ? (
          <ErrorState message={c.trendingError} />
        ) : trending.length > 0 ? (
          <FilmGrid films={trending} />
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">
              {c.noTrending}
            </p>
          </div>
        )}
      </section>

      {/* Latest Films */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {c.latest}
            </h2>

            <p className="text-gray-600">
              {c.latestText}
            </p>
          </div>

          <Link
            to="/films"
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 font-semibold transition"
          >
            {c.all}
            <FiArrowRight />
          </Link>
        </div>

        {filmsLoading ? (
          <LoadingSpinner />
        ) : filmsError ? (
          <ErrorState message={c.latestError} />
        ) : films.length > 0 ? (
          <FilmGrid films={films} />
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">
              {c.noFilm}
            </p>
          </div>
        )}
      </section>
      
            {/* Articles Section */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <FiFile className="text-red-600" />
              Blog AfroFlix.TV
            </h2>

            <p className="text-gray-600">
              {c.blogText}
            </p>
          </div>

          <Link
            to="/actualites"
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 font-semibold transition"
          >
            {c.allArticles}
            <FiArrowRight />
          </Link>
        </div>

        {articlesLoading ? (
          <LoadingSpinner />
        ) : articlesError ? (
          <ErrorState message={c.articlesError} />
        ) : articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard
                key={article.id || article.slug}
                article={article}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">
              {c.noArticle}
            </p>
          </div>
        )}
      </section>

      {/* Actors Section */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <FiUsers className="text-red-600" />
              {c.popularActors}
            </h2>

            <p className="text-gray-600">
              {c.actorsText}
            </p>
          </div>

          <Link
            to="/acteurs"
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 font-semibold transition"
          >
            {c.all}
            <FiArrowRight />
          </Link>
        </div>

        {actorsLoading ? (
          <LoadingSpinner />
        ) : actorsError ? (
          <ErrorState message={c.actorsError} />
        ) : actors.length > 0 ? (
          <ActorGrid actors={actors} />
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">
              {c.noActor}
            </p>
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg text-white text-center">
        <h2 className="text-4xl font-bold mb-4">
          {c.join}
        </h2>

        <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
          {c.joinText}
        </p>

        <Link
          to="/auth"
          className="inline-block px-8 py-3 bg-white text-red-600 font-bold rounded-lg hover:bg-gray-100 transition transform hover:scale-105"
        >
          {c.signUp}
        </Link>
      </section>
    </div>
  );
};

export default Home;
