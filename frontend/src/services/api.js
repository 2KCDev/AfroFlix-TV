const configuredApiBase = import.meta.env.VITE_API_URL || '/api';
const API_BASE = (() => {
  if (typeof window === 'undefined') return configuredApiBase;

  try {
    const apiUrl = new URL(configuredApiBase, window.location.origin);
    const isAfroflixFrontend = ['afroflix-tv.com', 'www.afroflix-tv.com'].includes(window.location.hostname);
    if (isAfroflixFrontend && apiUrl.hostname === 'api.afroflix-tv.com') {
      return '/api';
    }
  } catch (err) {
    return configuredApiBase;
  }

  return configuredApiBase;
})();
const GET_CACHE = new Map();
const DEFAULT_GET_CACHE_TTL = 30000;

// Token management
const getToken = () => localStorage.getItem('token');
const setToken = (token) => localStorage.setItem('token', token);
const removeToken = () => localStorage.removeItem('token');

const queryString = (params = {}) => {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );
  const query = new URLSearchParams(clean).toString();
  return query ? `?${query}` : '';
};

async function request(path, options = {}) {
  const { cacheTtl, ...fetchOptions } = options;
  const method = fetchOptions.method || 'GET';
  const cacheKey = `${method}:${path}`;
  const isFormData = fetchOptions.body instanceof FormData;

  if (method === 'GET' && cacheTtl) {
    const cached = GET_CACHE.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
  }

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(fetchOptions.headers || {}),
  };

  // Add token if available
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...fetchOptions,
      headers,
    });

    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      // Handle 401 - token expired/invalid
      if (response.status === 401) {
        removeToken();
        window.dispatchEvent(new Event('auth:logout'));
      }
      throw new Error(data.error || `Erreur ${response.status}`);
    }
    if (method === 'GET' && cacheTtl) {
      GET_CACHE.set(cacheKey, {
        data,
        expires: Date.now() + cacheTtl,
      });
    }

    return data;
  } catch (error) {
    console.error(`[API Error] ${path}:`, error.message);
    throw error;
  }
}

export const api = {
  // Auth
  register: (email, password, username) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, username }),
    }),
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  forgotPassword: (email) =>
    request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  resetPassword: (token, password) =>
    request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),
  profile: () => request('/auth/me'),
  logout: () => {
    removeToken();
    window.dispatchEvent(new Event('auth:logout'));
  },

  // Films
  films: (params = {}) => 
    request(`/films${queryString(params)}`, { cacheTtl: DEFAULT_GET_CACHE_TTL }),
  trending: () => request('/films/trending', { cacheTtl: DEFAULT_GET_CACHE_TTL }),
  film: (slug) => request(`/films/${slug}`, { cacheTtl: 15000 }),
  recordView: (filmId) =>
    request(`/films/${filmId}/views`, { method: 'POST' }),
  search: (q) =>
    request(`/films/search?q=${encodeURIComponent(q)}`),
  directors: () => request('/films/directors/list', { cacheTtl: 300000 }),

  // Actors
  actors: (params = {}) =>
    request(`/actors${queryString(params)}`, { cacheTtl: DEFAULT_GET_CACHE_TTL }),
  actor: (slug) => request(`/actors/${slug}`, { cacheTtl: 15000 }),

  // Articles
  articles: (params = {}) =>
    request(`/articles${queryString(params)}`, { cacheTtl: DEFAULT_GET_CACHE_TTL }),
  article: (slug) => request(`/articles/${slug}`, { cacheTtl: 15000 }),

  // Genres
  genres: () => request('/genres', { cacheTtl: 300000 }),
  genreFilms: (genre, params = {}) =>
    request(`/genres/${genre}/films${queryString(params)}`),

  // Comments
  comments: (filmId, params = {}) =>
    request(`/comments/${filmId}${queryString(params)}`),
  submitComment: (filmId, content, author = {}) =>
    request(`/comments/${filmId}/comment`, {
      method: 'POST',
      body: JSON.stringify({
        content,
        author_name: author.name,
        author_email: author.email,
      }),
    }),
  reportComment: (commentId) =>
    request(`/comments/${commentId}/report`, { method: 'POST' }),

  // Ratings
  submitRating: (filmId, rating) =>
    request(`/ratings/${filmId}`, {
      method: 'POST',
      body: JSON.stringify({ rating_value: rating }),
    }),
  getRatingStats: (filmId) =>
    request(`/ratings/${filmId}/stats`),
  getUserRating: (filmId) =>
    request(`/ratings/${filmId}/user`),

  // Favorites
  favorites: () => request('/favorites'),
  addFavorite: (filmId) =>
    request(`/favorites/${filmId}`, { method: 'POST' }),
  removeFavorite: (filmId) =>
    request(`/favorites/${filmId}`, { method: 'DELETE' }),
  checkFavorite: (filmId) =>
    request(`/favorites/${filmId}/is-favorite`),

  // Admin
  adminStats: () => request('/admin/stats'),
  adminFilms: (params = {}) =>
    request(`/films/manage/list${queryString(params)}`),
  adminActors: (params = {}) =>
    request(`/actors/manage/list${queryString(params)}`),
  adminArticles: (params = {}) =>
    request(`/articles/manage/list${queryString(params)}`),
  adminGenres: (params = {}) =>
    request(`/genres/manage/list${queryString(params)}`),
  adminUsers: (params = {}) =>
    request(`/admin/users${queryString(params)}`),
  updateUserRole: (userId, role) =>
    request(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),
  createUser: (payload) =>
    request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateUser: (userId, payload) =>
    request(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  updateAdminProfile: (payload) =>
    request('/admin/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteUser: (userId) =>
    request(`/admin/users/${userId}`, { method: 'DELETE' }),
  getModerationQueue: (params = {}) =>
    request(`/comments/moderation/queue${queryString(params)}`),
  approveComment: (commentId) =>
    request(`/comments/${commentId}/approve`, { method: 'PUT' }),
  rejectComment: (commentId) =>
    request(`/comments/${commentId}/reject`, { method: 'PUT' }),
  uploadImage: (file, type = 'misc') => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', type);
    return request('/uploads/image', {
      method: 'POST',
      body: formData,
    });
  },
  uploadPoster: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return request('/uploads/poster', {
      method: 'POST',
      body: formData,
    });
  },
  createFilm: (payload) =>
    request('/films', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateFilm: (filmId, payload) =>
    request(`/films/${filmId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteFilm: (filmId) =>
    request(`/films/${filmId}`, { method: 'DELETE' }),
  restoreFilm: (filmId) =>
    request(`/films/${filmId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'published' }),
    }),
  createActor: (payload) =>
    request('/actors', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateActor: (actorId, payload) =>
    request(`/actors/${actorId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteActor: (actorId) =>
    request(`/actors/${actorId}`, { method: 'DELETE' }),
  restoreActor: (actorId) =>
    request(`/actors/${actorId}/restore`, { method: 'PUT' }),
  createArticle: (payload) =>
    request('/articles', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateArticle: (articleId, payload) =>
    request(`/articles/${articleId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteArticle: (articleId) =>
    request(`/articles/${articleId}`, { method: 'DELETE' }),
  restoreArticle: (articleId) =>
    request(`/articles/${articleId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'published' }),
    }),
  articleCategories: () => request('/articles/categories', { cacheTtl: 300000 }),
  contact: (payload) =>
    request('/contact', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  subscribeNewsletter: (email) =>
    request('/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email, source: 'footer' }),
    }),
  createGenre: (payload) =>
    request('/genres', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateGenre: (genreId, payload) =>
    request(`/genres/${genreId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteGenre: (genreId) =>
    request(`/genres/${genreId}`, { method: 'DELETE' }),
  restoreGenre: (genreId) =>
    request(`/genres/${genreId}/restore`, { method: 'PUT' }),
};

export { getToken, setToken, removeToken };
