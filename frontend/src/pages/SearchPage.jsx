import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import Breadcrumbs from '../components/common/Breadcrumbs';
import LoadingSpinner from '../components/common/LoadingSpinner';
import FilmCard from '../components/cards/FilmCard';
import SEO from '../components/common/SEO';
import SearchSuggest from '../components/common/SearchSuggest';
import { api } from '../services/api';

const SearchPage = () => {
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
      if (cleanTerm.length >= 2) requests.push(api.search(cleanTerm));
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
  }, [genre, searchTerm, setSearchParams, year]);

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
      <SEO
        title="Recherche AfroFlix.TV"
        description="Rechercher un film, un acteur, un genre ou une année dans la base AfroFlix.TV."
      />
      <Breadcrumbs items={[{ label: 'Recherche' }]} />

      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Recherche</h1>
        <p className="text-gray-600">
          Explorez notre base de données de films, acteurs et articles
        </p>
      </div>

      {/* Search Bar */}
      <div className="space-y-4 mb-8">
        <SearchSuggest
          value={searchTerm}
          onChange={setSearchTerm}
          onSubmit={handleSearch}
          placeholder="Chercher un film, un acteur, un article..."
          inputClassName="text-lg"
          autoFocus
          buttonLabel="Rechercher"
        />
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <label className="block">
            <span className="block text-sm font-semibold text-gray-700 mb-1">Genre</span>
            <select
              value={genre}
              onChange={(event) => setGenre(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Tous les genres</option>
              {genres.map((item) => (
                <option key={item.id} value={item.slug}>{item.name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-sm font-semibold text-gray-700 mb-1">Année</span>
            <input
              type="number"
              min="1900"
              max={new Date().getFullYear() + 2}
              value={year}
              onChange={(event) => setYear(event.target.value)}
              placeholder="Ex. 2024"
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
                Films ({results.films.length})
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
                Acteurs ({results.actors.length})
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
                        {actor.film_count || actor.filmCount || 0} film(s)
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
                Articles ({results.articles.length})
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
                      {article.excerpt || article.content?.substring(0, 150)}...
                    </p>
                    <span className="text-xs bg-red-100 text-red-800 px-3 py-1 rounded">
                      {article.category}
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
                  Aucun résultat pour "{searchTerm}"
                </p>
                <p className="text-gray-500 mt-2">
                  Essayez d'autres mots clés
                </p>
              </div>
            )}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-lg font-semibold">
            Entrez un terme de recherche pour commencer
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
