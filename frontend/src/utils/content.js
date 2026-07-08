export const normalizeListResponse = (response, key) => {
  const items = response?.[key] || response?.data || [];
  const pagination = response?.pagination || {};

  return {
    items,
    total: pagination.total || response?.total || items.length,
    page: pagination.page || response?.page || 1,
    limit: pagination.limit || response?.limit || items.length || 12,
    pages: pagination.pages || response?.totalPages || 1,
  };
};

export const formatDate = (value) => {
  if (!value) return 'Non renseigné';
  return new Date(value).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const truncateText = (value = '', max = 160) => {
  if (value.length <= max) return value;
  return `${value.slice(0, max).trim()}...`;
};

export const getImage = (item, fields, fallback) => {
  for (const field of fields) {
    if (item?.[field]) return item[field];
  }
  return fallback;
};

export const publicFilmUrl = (slug) => `/films/${slug}`;

