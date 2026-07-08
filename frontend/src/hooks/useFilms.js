import { useState, useEffect } from 'react';
import { api } from '../services/api';

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
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFilms = async () => {
      try {
        setLoading(true);
        const result = await api.films(normalizeFilmParams(params));
        setData(normalizeFilmList(result));
        setError(null);
      } catch (err) {
        setError(err.message);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchFilms();
  }, [JSON.stringify(params)]);

  return { data, loading, error };
};

export const useTrendingFilms = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setLoading(true);
        const result = await api.trending();
        setData(normalizeFilmList(result));
        setError(null);
      } catch (err) {
        setError(err.message);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, []);

  return { data, loading, error };
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
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchFilm();
  }, [slug]);

  return { data, loading, error };
};

export const useActors = (params = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchActors = async () => {
      try {
        setLoading(true);
        const result = await api.actors({
          ...params,
          search: params.search || params.q,
          q: undefined,
        });
        setData(normalizeActorList(result));
        setError(null);
      } catch (err) {
        setError(err.message);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchActors();
  }, [JSON.stringify(params)]);

  return { data, loading, error };
};

export const useArticles = (params = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const result = await api.articles(params);
        setData(normalizeArticleList(result));
        setError(null);
      } catch (err) {
        setError(err.message);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [JSON.stringify(params)]);

  return { data, loading, error };
};
