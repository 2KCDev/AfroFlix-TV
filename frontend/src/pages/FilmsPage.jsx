import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { FiFilter, FiX } from 'react-icons/fi';
import Breadcrumbs from '../components/common/Breadcrumbs';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Pagination from '../components/common/Pagination';
import SEO from '../components/common/SEO';
import SearchSuggest from '../components/common/SearchSuggest';
import FilmGrid from '../components/films/FilmGrid';
import { useFilms } from '../hooks/useFilms';
import { api } from '../services/api';

const FilmsPage = () => {
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

  const { data: filmsData, loading } = useFilms(params);
  const films = filmsData?.films || [];
  const totalPages = filmsData?.totalPages || 1;

  // Fetch genres for filter
  useEffect(() => {
    api.genres()
      .then((res) => setGenres(res.genres || (Array.isArray(res) ? res : [])))
      .catch((err) => console.error('Error fetching genres:', err));
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

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
          { label: 'Films', to: '/films' },
          ...(activeGenre ? [{ label: activeGenre.name }] : []),
        ]}
      />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {activeGenre ? `Films AfroFlix.TV ${activeGenre.name}` : 'Films AfroFlix.TV'}
        </h1>
        <p className="text-gray-600">
          Découvrez une collection de {filmsData?.total || 0} films du cinéma africain
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
              Filtres
            </button>
            {(q || genre || year || sortBy !== 'created_at') && (
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 font-semibold"
              >
                <FiX size={18} />
                Réinitialiser
              </button>
            )}
          </div>

          {showFilters && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-4">
                <label className="mb-2 block font-bold text-gray-900">Recherche par mots clés</label>
                <SearchSuggest
                  value={keywordTerm}
                  onChange={setKeywordTerm}
                  onSubmit={handleKeywordSearch}
                  placeholder="Titre, acteur, réalisateur, pays..."
                  autoSubmit
                />
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div>
                <label className="block font-bold text-gray-900 mb-2">Tri</label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    handleFilterChange('sortBy', e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                >
                  <option value="created_at">Récents d'abord</option>
                  <option value="trending">En tendance</option>
                  <option value="rating">Mieux notés</option>
                  <option value="title">A-Z</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-900 mb-2">Genre</label>
                <select
                  value={genre}
                  onChange={(e) => {
                    handleFilterChange('genre', e.target.value);
                    setShowFilters(false);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                >
                  <option value="">Tous les genres</option>
                  {genres.map((g) => (
                    <option key={g.id} value={g.slug}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-900 mb-2">Année</label>
                <select
                  value={year}
                  onChange={(e) => {
                    handleFilterChange('year', e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                >
                  <option value="">Toutes les années</option>
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
              <p className="text-gray-600 text-lg font-semibold">Aucun film trouvé</p>
              <p className="text-gray-500 mt-2">Essayez de modifier vos filtres</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default FilmsPage;
