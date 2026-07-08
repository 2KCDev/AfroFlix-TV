import { useEffect } from 'react';

const DEFAULT_TITLE = 'AFROFLIX.TV - Films, acteurs et actualités du cinéma africain';
const DEFAULT_DESCRIPTION = 'La plateforme francophone pour découvrir AfroFlix.TV: films, acteurs, critiques, classements et actualités.';

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
  useEffect(() => {
    const fullTitle = title ? `${title} | AFROFLIX.TV` : DEFAULT_TITLE;
    const metaDescription = description || DEFAULT_DESCRIPTION;

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
  }, [title, description, image, type, jsonLd]);

  return null;
};

export default SEO;
