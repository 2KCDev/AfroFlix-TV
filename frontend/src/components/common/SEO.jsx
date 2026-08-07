import { useEffect } from 'react';
import { useLocale } from '../../hooks/useLocale';

const defaults = {
  fr: {
    title: 'AFROFLIX.TV - Films, acteurs et actualités du cinéma africain',
    description: 'La plateforme francophone pour découvrir AfroFlix.TV : films, acteurs, critiques, classements et actualités.',
  },
  en: {
    title: 'AFROFLIX.TV - African cinema films, actors and news',
    description: 'Your platform for discovering African cinema: films, actors, reviews, rankings and news.',
  },
};

const setMeta = (name, content, property = false) => {
  const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(property ? 'property' : 'name', name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
};

const SEO = ({ title, description, image, type = 'website', jsonLd }) => {
  const { language } = useLocale();
  const fallback = defaults[language] || defaults.fr;

  useEffect(() => {
    const fullTitle = title ? `${title} | AFROFLIX.TV` : fallback.title;
    const metaDescription = description || fallback.description;

    document.title = fullTitle;
    setMeta('description', metaDescription);
    setMeta('og:title', fullTitle, true);
    setMeta('og:description', metaDescription, true);
    setMeta('og:type', type, true);
    setMeta('twitter:card', image ? 'summary_large_image' : 'summary');

    if (image) {
      setMeta('og:image', image, true);
      setMeta('twitter:image', image);
    }

    const id = 'structured-data';
    document.getElementById(id)?.remove();
    if (jsonLd) {
      const script = document.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
  }, [title, description, image, type, jsonLd, fallback]);

  return null;
};

export default SEO;
