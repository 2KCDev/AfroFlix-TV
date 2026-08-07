import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ActorGrid from '../components/actors/ActorGrid';
import Breadcrumbs from '../components/common/Breadcrumbs';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Pagination from '../components/common/Pagination';
import SearchSuggest from '../components/common/SearchSuggest';
import ErrorState from '../components/ErrorState';
import { useListScrollRestoration } from '../utils/navigation';
import { useActors } from '../hooks/useFilms';
import { useLocale } from '../hooks/useLocale';

const ActorsPage = () => {
  const { language } = useLocale();
  const c = language === 'en'
    ? { actors: 'Actors', title: 'AfroFlix.TV actors', subtitle: 'Discover the talents of African cinema', search: 'Search for an actor…', error: 'Actors cannot be loaded at the moment. Please try again shortly.', none: 'No actors found' }
    : { actors: 'Acteurs', title: 'Acteurs AfroFlix.TV', subtitle: 'Découvrez les talents du cinéma africain', search: 'Chercher un acteur…', error: 'Impossible de charger les acteurs pour le moment. Réessayez dans quelques instants.', none: 'Aucun acteur trouvé' };
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const page = parseInt(searchParams.get('page') || '1');

  const { data: actorsData, loading, error } = useActors({
    page,
    limit: 12,
    search: searchParams.get('q') || '',
  });
  useListScrollRestoration(!loading);

  const actors = actorsData?.actors || [];
  const totalPages = actorsData?.totalPages || 1;

  const handleSearch = useCallback((term = searchTerm) => {
    const newParams = new URLSearchParams({ page: '1' });
    if (term.trim()) newParams.set('q', term.trim());
    setSearchParams(newParams);
  }, [searchTerm, setSearchParams]);

  return (
    <div className="space-y-8">
      <Breadcrumbs items={[{ label: c.actors }]} />

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{c.title}</h1>
        <p className="text-gray-600">
          {c.subtitle}
        </p>
      </div>

      {/* Search Form */}
      <div className="mb-8">
        <SearchSuggest
          value={searchTerm}
          onChange={setSearchTerm}
          onSubmit={handleSearch}
          placeholder={c.search}
          autoSubmit
        />
      </div>

      {/* Actors Grid */}
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorState message={c.error} />
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
          <p className="text-gray-600 text-lg font-semibold">{c.none}</p>
        </div>
      )}
    </div>
  );
};

export default ActorsPage;
