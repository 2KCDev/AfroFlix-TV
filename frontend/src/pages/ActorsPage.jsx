import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ActorGrid from '../components/actors/ActorGrid';
import Breadcrumbs from '../components/common/Breadcrumbs';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Pagination from '../components/common/Pagination';
import SearchSuggest from '../components/common/SearchSuggest';
import { useActors } from '../hooks/useFilms';

const ActorsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const page = parseInt(searchParams.get('page') || '1');

  const { data: actorsData, loading } = useActors({
    page,
    limit: 12,
    search: searchParams.get('q') || '',
  });

  const actors = actorsData?.actors || [];
  const totalPages = actorsData?.totalPages || 1;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  const handleSearch = useCallback((term = searchTerm) => {
    const newParams = new URLSearchParams({ page: '1' });
    if (term.trim()) newParams.set('q', term.trim());
    setSearchParams(newParams);
  }, [searchTerm, setSearchParams]);

  return (
    <div className="space-y-8">
      <Breadcrumbs items={[{ label: 'Acteurs' }]} />

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Acteurs AfroFlix.TV</h1>
        <p className="text-gray-600">
          Découvrez les talents du cinéma africain
        </p>
      </div>

      {/* Search Form */}
      <div className="mb-8">
        <SearchSuggest
          value={searchTerm}
          onChange={setSearchTerm}
          onSubmit={handleSearch}
          placeholder="Chercher un acteur..."
          buttonLabel="Rechercher"
          autoSubmit
        />
      </div>

      {/* Actors Grid */}
      {loading ? (
        <LoadingSpinner />
      ) : actors.length > 0 ? (
        <>
          <ActorGrid actors={actors} />
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(newPage) => {
              const params = new URLSearchParams({ page: newPage });
              if (searchTerm) params.set('q', searchTerm);
              setSearchParams(params);
            }}
          />
        </>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-lg font-semibold">Aucun acteur trouvé</p>
        </div>
      )}
    </div>
  );
};

export default ActorsPage;
