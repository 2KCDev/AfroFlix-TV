import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronRight } from 'react-icons/fi';
import { useLocale } from '../../hooks/useLocale';

const Breadcrumbs = ({ items = [] }) => {
  const { language, t } = useLocale();
  const crumbs = [{ label: t('nav.home'), to: '/' }, ...items];

  useEffect(() => {
    const id = 'breadcrumb-structured-data';
    document.getElementById(id)?.remove();

    const origin = window.location.origin;
    const script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: crumbs.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.label,
        item: item.to ? `${origin}${item.to}` : window.location.href,
      })),
    });
    document.head.appendChild(script);

    return () => document.getElementById(id)?.remove();
  }, [language, JSON.stringify(items)]);

  return (
    <nav aria-label={language === 'fr' ? "Fil d'Ariane" : 'Breadcrumb'} className="text-sm text-gray-500">
      <ol className="flex flex-wrap items-center gap-1">
        {crumbs.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1">
            {index > 0 && <FiChevronRight size={14} />}
            {item.to ? (
              <Link to={item.to} className="hover:text-red-600">
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-800 font-medium">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
