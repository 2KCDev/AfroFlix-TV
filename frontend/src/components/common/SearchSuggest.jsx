import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';
import { api } from '../../services/api';

const typeLabels = {
  film: 'Film',
  actor: 'Acteur',
  article: 'Article',
};

const itemPath = (item) => {
  if (item.type === 'actor') return `/acteurs/${item.slug}`;
  if (item.type === 'article') return `/actualites/${item.slug}`;
  return `/films/${item.slug}`;
};

const normalizeResults = (results) => [
  ...(results?.films || []).map((item) => ({ ...item, type: 'film', label: item.title })),
  ...(results?.actors || []).map((item) => ({ ...item, type: 'actor', label: item.name })),
  ...(results?.articles || []).map((item) => ({ ...item, type: 'article', label: item.title })),
].filter((item) => item.slug && item.label);

const SearchSuggest = ({
  value,
  onChange,
  onSubmit,
  placeholder = 'Rechercher par mots clés...',
  autoFocus = false,
  inputClassName = '',
  autoSubmit = false,
}) => {
  const navigate = useNavigate();
  const [liveResults, setLiveResults] = useState([]);
  const [focused, setFocused] = useState(false);
  const onSubmitRef = useRef(onSubmit);
  const term = value.trim();
  const showSuggestions = focused && liveResults.length > 0;

  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);

  useEffect(() => {
    if (term.length < 2) {
      setLiveResults([]);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      api.search(term)
        .then((results) => setLiveResults(normalizeResults(results).slice(0, 6)))
        .catch(() => setLiveResults([]));
    }, 300);

    return () => window.clearTimeout(timer);
  }, [term]);

  useEffect(() => {
    if (!autoSubmit || !onSubmitRef.current) return undefined;

    const timer = window.setTimeout(() => {
      if (term.length === 0 || term.length >= 2) onSubmitRef.current(value);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [autoSubmit, term, value]);

  const suggestionsId = useMemo(() => `search-suggestions-${Math.random().toString(36).slice(2)}`, []);

  const submit = (event) => {
    event.preventDefault();
    if (onSubmit) {
      onSubmit(value);
      return;
    }
    if (term) navigate(`/recherche?q=${encodeURIComponent(term)}`);
  };

  return (
    <form onSubmit={submit} className="w-full">
      <div className="relative min-w-0 flex-grow">
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 150)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          aria-autocomplete="list"
          aria-controls={suggestionsId}
          className={`w-full rounded-lg border-2 border-red-600 px-4 py-3 pl-10 outline-none focus:ring-2 focus:ring-red-500 ${inputClassName}`}
        />
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-red-600" size={22} />
        {showSuggestions && (
          <div id={suggestionsId} className="absolute left-0 right-0 top-full z-30 mt-2 rounded-lg border border-gray-200 bg-white shadow-lg">
            {liveResults.map((item) => (
              <Link
                key={`${item.type}-${item.id}`}
                to={itemPath(item)}
                className="block px-4 py-3 text-sm hover:bg-red-50"
              >
                <span className="font-semibold text-gray-900">{item.label}</span>
                <span className="ml-2 text-gray-500">{typeLabels[item.type]}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </form>
  );
};

export default SearchSuggest;
