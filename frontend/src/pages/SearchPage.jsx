import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import Breadcrumbs from '../components/common/Breadcrumbs';
import LoadingSpinner from '../components/common/LoadingSpinner';
import FilmCard from '../components/cards/FilmCard';
import SearchSuggest from '../components/common/SearchSuggest';
import { api } from '../services/api';
import { trackEvent } from '../services/analytics';
import { useLocale } from '../hooks/useLocale';
import { getLocalizedArticleExcerpt, localizeArticleCategory } from '../utils/content';

const SearchPage = () => {
  const { language } = useLocale();
  const c = language === 'en' ? { search: 'Search', intro: 'Explore our database of films, actors and articles', placeholder: 'Search for a film, actor or article…', genre: 'Genre', allGenres: 'All genres', year: 'Year', example: 'E.g. 2024', films: 'Films', actors: 'Actors', articles: 'Articles', noResults: 'No results for', tryAgain: 'Try other keywords', start: 'Enter a search term to get started', film: 'film', filmsPlural: 'films' } : { search: 'Recherche', intro: 'Explorez notre base de données de films, acteurs et articles', placeholder: 'Chercher un film, un acteur, un article…', genre: 'Genre', allGenres: 'Tous les genres', year: 'Année', example: 'Ex. 2024', films: 'Films', actors: 'Acteurs', articles: 'Articles', noResults: 'Aucun résultat pour', tryAgain: "Essayez d'autres mots clés", start: 'Entrez un terme de recherche pour commencer', film: 'film', filmsPlural: 'films' };
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [genre, setGenre] = useState(searchParams.get('genre') || '');
  const [year, setYear] = useState(searchParams.get('year') || '');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [genres, setGenres] = useState([]);

  const handleSearch = useCallback(async (term = searchTerm) => {
    const cleanTerm = term.trim();
    if (!cleanTerm && !genre && !year) {
      setResults(null);
      setSearchParams({});
      return;
    }

    setLoading(true);
    try {
      const requests = [];
      if (cleanTerm.length >= 2) requests.push(api.search(cleanTerm, { lang: language }));
      if (genre || year) {
        requests.push(api.films({
          page: 1,
          limit: 24,
          ...(genre && { genre }),
          ...(year && { year }),
        }));
      }

      const responses = await Promise.all(requests);
      const merged = responses.reduce((acc, item) => {
        const films = item.films || item.data || [];
        const actors = item.actors || [];
        const articles = item.articles || [];
        return {
          films: [...acc.films, ...films].filter((film, index, list) => list.findIndex((entry) => entry.id === film.id) === index),
          actors: [...acc.actors, ...actors].filter((actor, index, list) => list.findIndex((entry) => entry.id === actor.id) === index),
          articles: [...acc.articles, ...articles],
        };
      }, { films: [], actors: [], articles: [] });

      setResults(merged);
      if (cleanTerm.length >= 2) trackEvent('search', { search_term: cleanTerm, result_count: merged.films.length + merged.actors.length + merged.articles.length });
      setSearchParams({
        ...(cleanTerm && { q: cleanTerm }),
        ...(genre && { genre }),
        ...(year && { year }),
      });
    } catch (error) {
      console.error('Search error:', error);
      setResults({ films: [], actors: [], articles: [] });
    } finally {
      setLoading(false);
    }
  }, [genre, language, searchTerm, setSearchParams, year]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (searchTerm.trim().length === 0 || searchTerm.trim().length >= 2 || genre || year) {
        handleSearch(searchTerm);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [genre, handleSearch, searchTerm, year]);

  useEffect(() => {
    api.genres()
      .then((res) => setGenres(res.genres || (Array.isArray(res) ? res : [])))
      .catch(() => setGenres([]));
  }, []);

  return (
    <div className="space-y-8">
      <Breadcrumbs items={[{ label: c.search }]} />

      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{c.search}</h1>
        <p className="text-gray-600">
          {c.intro}
        </p>
      </div>

      {/* Search Bar */}
      <div className="space-y-4 mb-8">
        <SearchSuggest
          value={searchTerm}
          onChange={setSearchTerm}
          onSubmit={handleSearch}
          placeholder={c.placeholder}
          inputClassName="text-lg"
          autoFocus
        />
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <label className="block">
            <span className="block text-sm font-semibold text-gray-700 mb-1">{c.genre}</span>
            <select
              value={genre}
              onChange={(event) => setGenre(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">{c.allGenres}</option>
              {genres.map((item) => (
                <option key={item.id} value={item.slug}>{item.name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-sm font-semibold text-gray-700 mb-1">{c.year}</span>
            <input
              type="number"
              min="1900"
              max={new Date().getFullYear() + 2}
              value={year}
              onChange={(event) => setYear(event.target.value)}
              placeholder={c.example}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-red-500"
            />
          </label>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <LoadingSpinner />
      ) : results ? (
        <div className="space-y-12">
          {/* Films Results */}
          {results.films && results.films.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {c.films} ({results.films.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {results.films.map((film) => (
                  <FilmCard key={film.id} film={film} />
                ))}
              </div>
            </div>
          )}

          {/* Actors Results */}
          {results.actors && results.actors.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {c.actors} ({results.actors.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {results.actors.map((actor) => (
                  <Link
                    key={actor.id}
                    to={`/acteurs/${actor.slug}`}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition"
                  >
                    <img
                      src={actor.photo_url || actor.photoUrl || 'https://via.placeholder.com/300x300'}
                      alt={actor.name}
                      className="w-full aspect-square object-cover"
                    />
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900">{actor.name}</h3>
                      <p className="text-sm text-gray-600">
                        {actor.film_count || actor.filmCount || 0} {(actor.film_count || actor.filmCount || 0) === 1 ? c.film : c.filmsPlural}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Articles Results */}
          {results.articles && results.articles.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {c.articles} ({results.articles.length})
              </h2>
              <div className="space-y-4">
                {results.articles.map((article) => (
                  <Link
                    key={article.id}
                    to={`/actualites/${article.slug}`}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition"
                  >
                    <h3 className="font-bold text-lg text-gray-900 mb-2">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 mb-3">
                      {getLocalizedArticleExcerpt(article, language, 150)}...
                    </p>
                    <span className="text-xs bg-red-100 text-red-800 px-3 py-1 rounded">
                      {localizeArticleCategory(article.category, language)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {(!results.films || results.films.length === 0) &&
            (!results.actors || results.actors.length === 0) &&
            (!results.articles || results.articles.length === 0) && (
              <div className="text-center py-16 bg-gray-50 rounded-lg">
                <p className="text-gray-600 text-lg font-semibold">
                  {c.noResults} "{searchTerm}"
                </p>
                <p className="text-gray-500 mt-2">
                  {c.tryAgain}
                </p>
              </div>
            )}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-lg font-semibold">
            {c.start}
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
