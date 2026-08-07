import React from 'react';
import { FiCheckCircle, FiShield } from 'react-icons/fi';
import { useLocale } from '../../hooks/useLocale';

const AdminCompliance = () => {
  const { language } = useLocale();
  const c = language === 'en'
    ? {
      title: 'AdSense and editorial compliance', intro: 'Operational checklist based on the requirements before a Google AdSense submission.',
      checks: ['Legal pages accessible from the footer', 'Cookie-consent banner with a refusal option', 'No videos hosted on the server: official YouTube embeds only', 'robots.txt blocks /admin and search pages', 'ads.txt available at the public root', 'Film descriptions: target 300 to 500 original words', 'Articles: target at least 600 words and editorial categories', 'Comment moderation enabled before publication', 'Images with alternative text in public components'],
      warningTitle: 'Non-negotiable point', warning: 'If there is any doubt about a video’s source, do not publish the embed. The site must remain an editorial platform with original content, not a streaming platform.',
    }
    : {
      title: 'Conformité AdSense et éditoriale', intro: 'Checklist opérationnelle basée sur le cahier des charges avant soumission Google AdSense.',
      checks: ['Pages légales accessibles depuis le pied de page', 'Bannière de consentement cookies avec refus possible', 'Aucune vidéo hébergée sur le serveur: embeds YouTube officiels uniquement', 'robots.txt bloque /admin et les pages de recherche', 'ads.txt présent à la racine publique', 'Descriptions films: objectif 300 à 500 mots originaux', 'Articles: objectif 600 mots minimum et catégories éditoriales', 'Modération des commentaires active avant publication', 'Images avec textes alternatifs sur les composants publics'],
      warningTitle: 'Point non négociable', warning: "En cas de doute sur l'origine d'une vidéo, ne pas publier l'embed. Le site doit rester une plateforme éditoriale avec contenus originaux, pas une plateforme de streaming.",
    };

  return (
  <section className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <FiShield className="text-red-600" />
        {c.title}
      </h2>
      <p className="text-gray-600">{c.intro}</p>
    </div>

    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {c.checks.map((check) => (
          <div key={check} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <FiCheckCircle className="text-green-600 mt-0.5 flex-shrink-0" size={18} />
            <span className="text-sm text-gray-700">{check}</span>
          </div>
        ))}
      </div>
    </div>

    <div className="bg-orange-50 border border-orange-200 rounded-lg p-5">
      <h3 className="font-bold text-gray-900 mb-2">{c.warningTitle}</h3>
      <p className="text-gray-700 text-sm">
        {c.warning}
      </p>
    </div>
  </section>
  );
};

export default AdminCompliance;
