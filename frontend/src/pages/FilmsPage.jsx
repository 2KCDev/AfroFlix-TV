import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { FiFilter, FiX } from 'react-icons/fi';
import Breadcrumbs from '../components/common/Breadcrumbs';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Pagination from '../components/common/Pagination';
import SEO from '../components/common/SEO';
import SearchSuggest from '../components/common/SearchSuggest';
import FilmGrid from '../components/films/FilmGrid';
import ErrorState from '../components/ErrorState';
import { useFilms } from '../hooks/useFilms';
import { api } from '../services/api';
import { useListScrollRestoration } from '../utils/navigation';
import { useLocale } from '../hooks/useLocale';

const FilmsPage = () => {
  const { language } = useLocale();
  const c = language === 'en' ? {
    films: 'Films', collection: 'Discover a collection of', africanFilms: 'African cinema films', filters: 'Filters', reset: 'Reset', search: 'Search by keyword', searchPlaceholder: 'Title, actor, director, country…', sort: 'Sort', recent: 'Most recent first', trending: 'Trending', rated: 'Top rated', genre: 'Genre', allGenres: 'All genres', year: 'Year', allYears: 'All years', error: 'Films cannot be loaded at the moment. Please try again shortly.', none: 'No films found', adjust: 'Try changing your filters',
  } : {
    films: 'Films', collection: 'Découvrez une collection de', africanFilms: 'films du cinéma africain', filters: 'Filtres', reset: 'Réinitialiser', search: 'Recherche par mots clés', searchPlaceholder: 'Titre, acteur, réalisateur, pays…', sort: 'Tri', recent: "Récents d'abord", trending: 'En tendance', rated: 'Mieux notés', genre: 'Genre', allGenres: 'Tous les genres', year: 'Année', allYears: 'Toutes les années', error: 'Impossible de charger les films pour le moment. Réessayez dans quelques instants.', none: 'Aucun film trouvé', adjust: 'Essayez de modifier vos filtres',
  };
  const { genre: genreSlugFromRoute } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [genres, setGenres] = useState([]);
  const [keywordTerm, setKeywordTerm] = useState(searchParams.get('q') || '');
  
  // Get parameters from URL
  const page = parseInt(searchParams.get('page') || '1');
  const sortBy = searchParams.get('sortBy') || 'created_at';
  const q = searchParams.get('q') || '';
  const genre = genreSlugFromRoute || searchParams.get('genre') || '';
  const year = searchParams.get('year') || '';
  const activeGenre = genres.find((g) => g.slug === genre || g.name === genre);

  // Fetch films with current parameters
  const params = {
    page,
    limit: 12,
    sortBy,
    ...(q && { q }),
    ...(genre && { genre }),
    ...(year && { year: parseInt(year) }),
  };

  const { data: filmsData, loading, error } = useFilms(params);
  useListScrollRestoration(!loading);
  const films = filmsData?.films || [];
  const totalPages = filmsData?.totalPages || 1;

  // Fetch genres for filter
  useEffect(() => {
    api.genres()
      .then((res) => setGenres(res.genres || (Array.isArray(res) ? res : [])))
      .catch((err) => console.error('Error fetching genres:', err));
  }, []);

  useEffect(() => {
    setKeywordTerm(q);
  }, [q]);

  const handleFilterChange = useCallback((filterKey, filterValue) => {
    const newParams = new URLSearchParams(searchParams);
    if (filterValue) {
      newParams.set(filterKey, filterValue);
    } else {
      newParams.delete(filterKey);
    }
    newParams.set('page', '1'); // Reset to first page
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  const handleClearFilters = () => {
    setSearchParams(new URLSearchParams([['sortBy', 'created_at']]));
  };

  const handleKeywordSearch = useCallback((term) => {
    handleFilterChange('q', term.trim());
  }, [handleFilterChange]);

  const years = Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="space-y-8">
      {activeGenre?.description && (
        <SEO
          title={`Films AfroFlix.TV ${activeGenre.name}`}
          description={activeGenre.description}
        />
      )}
      <Breadcrumbs
        items={[
          { label: c.films, to: '/films' },
          ...(activeGenre ? [{ label: activeGenre.name }] : []),
        ]}
      />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {activeGenre ? `${c.films} AfroFlix.TV ${activeGenre.name}` : `${c.films} AfroFlix.TV`}
        </h1>
        <p className="text-gray-600">
          {c.collection} {filmsData?.total || 0} {c.africanFilms}
        </p>
        {activeGenre?.description && (
          <p className="mt-4 max-w-3xl text-gray-700 leading-relaxed">
            {activeGenre.description}
          </p>
        )}
      </div>

      <div>
        <main className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold"
            >
              <FiFilter size={18} />
              {c.filters}
            </button>
            {(q || genre || year || sortBy !== 'created_at') && (
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 font-semibold"
              >
                <FiX size={18} />
                {c.reset}
              </button>
            )}
          </div>

          {showFilters && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-4">
                <label className="mb-2 block font-bold text-gray-900">{c.search}</label>
                <SearchSuggest
                  value={keywordTerm}
                  onChange={setKeywordTerm}
                  onSubmit={handleKeywordSearch}
                  placeholder={c.searchPlaceholder}
                  autoSubmit
                />
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div>
                <label className="block font-bold text-gray-900 mb-2">{c.sort}</label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    handleFilterChange('sortBy', e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                >
                  <option value="created_at">{c.recent}</option>
                  <option value="trending">{c.trending}</option>
                  <option value="rating">{c.rated}</option>
                  <option value="title">A-Z</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-900 mb-2">{c.genre}</label>
                <select
                  value={genre}
                  onChange={(e) => {
                    handleFilterChange('genre', e.target.value);
                    setShowFilters(false);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                >
                  <option value="">{c.allGenres}</option>
                  {genres.map((g) => (
                    <option key={g.id} value={g.slug}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-900 mb-2">{c.year}</label>
                <select
                  value={year}
                  onChange={(e) => {
                    handleFilterChange('year', e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                >
                  <option value="">{c.allYears}</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              </div>
            </div>
          )}

          {/* Films Grid */}
          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <ErrorState message={c.error} />
          ) : films.length > 0 ? (
            <>
              <FilmGrid films={films} columns="dense" />
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(newPage) => {
                  const newParams = new URLSearchParams(searchParams);
                  newParams.set('page', newPage);
                  setSearchParams(newParams);
                }}
              />
            </>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-lg font-semibold">{c.none}</p>
              <p className="text-gray-500 mt-2">{c.adjust}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default FilmsPage;
