import { useState, useEffect } from 'react';
import { api } from '../services/api';

const useRemoteList = (load, normalize, dependencies) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await load();
        if (!active) return;
        setData(normalize(result));
        setError(null);
      } catch (err) {
        if (!active) return;
        // Keep the previous successful result visible. A network incident must
        // never be presented to visitors as an empty catalogue.
        setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();
    return () => { active = false; };
  }, dependencies);

  return { data, loading, error };
};

const normalizePagination = (pagination = {}) => ({
  total: Number(pagination.total || 0),
  page: Number(pagination.page || 1),
  limit: Number(pagination.limit || 12),
  pages: Number(pagination.pages || pagination.totalPages || 1),
});

const normalizeFilmList = (result) => {
  const films = result?.films || result?.data || (Array.isArray(result) ? result : []);
  const pagination = normalizePagination(result?.pagination);

  return {
    ...result,
    films,
    data: films,
    pagination,
    total: pagination.total || films.length,
    totalPages: pagination.pages,
  };
};

const normalizeActorList = (result) => {
  const actors = result?.actors || result?.data || (Array.isArray(result) ? result : []);
  const pagination = normalizePagination(result?.pagination);

  return {
    ...result,
    actors,
    pagination,
    total: pagination.total || actors.length,
    totalPages: pagination.pages,
  };
};

const normalizeArticleList = (result) => {
  const articles = result?.articles || result?.data || (Array.isArray(result) ? result : []);
  const pagination = normalizePagination(result?.pagination);

  return {
    ...result,
    articles,
    pagination,
    total: pagination.total || articles.length,
    totalPages: pagination.pages,
  };
};

const normalizeFilmParams = (params) => {
  const sortMap = {
    created_at: 'latest',
    rating: 'rated',
  };

  return {
    ...params,
    sortBy: sortMap[params.sortBy] || params.sortBy,
  };
};

export const useFilms = (params = {}) => {
  const paramsKey = JSON.stringify(params);
  return useRemoteList(
    () => api.films(normalizeFilmParams(params)),
    normalizeFilmList,
    [paramsKey]
  );
};

export const useTrendingFilms = () => {
  return useRemoteList(() => api.trending(), normalizeFilmList, []);
};

export const useFilmDetail = (slug) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) return;

    const fetchFilm = async () => {
      try {
        setLoading(true);
        const result = await api.film(slug);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFilm();
  }, [slug]);

  return { data, loading, error };
};

export const useActors = (params = {}) => {
  const paramsKey = JSON.stringify(params);
  return useRemoteList(
    () => api.actors({ ...params, search: params.search || params.q, q: undefined }),
    normalizeActorList,
    [paramsKey]
  );
};

export const useArticles = (params = {}) => {
  const paramsKey = JSON.stringify(params);
  return useRemoteList(() => api.articles(params), normalizeArticleList, [paramsKey]);
};
