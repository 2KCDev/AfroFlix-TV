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

export const formatDate = (value, locale = 'fr-FR', emptyLabel = 'Non renseigné') => {
  if (!value) return emptyLabel;
  return new Date(value).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const truncateText = (value = '', max = 160) => {
  if (value.length <= max) return value;
  return `${value.slice(0, max).trim()}...`;
};

export const getLocalizedArticleContent = (article, language) => (
  language === 'en' && article?.content_en?.trim()
    ? article.content_en
    : article?.content
);

export const getLocalizedArticleExcerpt = (article, language, maxLength = 0) => {
  const content = getLocalizedArticleContent(article, language) || '';
  const excerpt = language === 'en' && article?.content_en?.trim()
    ? content
    : article?.excerpt || content;

  return maxLength ? excerpt.slice(0, maxLength) : excerpt;
};

export const localizeArticleCategory = (category, language) => {
  if (language !== 'en') return category;

  const translations = {
    Actualités: 'News',
    Classements: 'Rankings',
    Analyses: 'Analysis',
    Conseils: 'Tips',
    Dossiers: 'Features',
    Portraits: 'Profiles',
    Guides: 'Guides',
  };

  return translations[category] || category;
};

export const getImage = (item, fields, fallback) => {
  for (const field of fields) {
    if (item?.[field]) return item[field];
  }
  return fallback;
};

export const publicFilmUrl = (slug) => `/films/${slug}`;
