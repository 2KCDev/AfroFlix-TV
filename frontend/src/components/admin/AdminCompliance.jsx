import React from 'react';
import { FiCheckCircle, FiShield } from 'react-icons/fi';

const checks = [
  'Pages légales accessibles depuis le pied de page',
  'Bannière de consentement cookies avec refus possible',
  'Aucune vidéo hébergée sur le serveur: embeds YouTube officiels uniquement',
  'robots.txt bloque /admin et les pages de recherche',
  'ads.txt présent à la racine publique',
  'Descriptions films: objectif 300 à 500 mots originaux',
  'Articles: objectif 600 mots minimum et catégories éditoriales',
  'Modération des commentaires active avant publication',
  'Images avec textes alternatifs sur les composants publics',
];

const AdminCompliance = () => (
  <section className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <FiShield className="text-red-600" />
        Conformité AdSense et éditoriale
      </h2>
      <p className="text-gray-600">Checklist opérationnelle basée sur le cahier des charges avant soumission Google AdSense.</p>
    </div>

    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {checks.map((check) => (
          <div key={check} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <FiCheckCircle className="text-green-600 mt-0.5 flex-shrink-0" size={18} />
            <span className="text-sm text-gray-700">{check}</span>
          </div>
        ))}
      </div>
    </div>

    <div className="bg-orange-50 border border-orange-200 rounded-lg p-5">
      <h3 className="font-bold text-gray-900 mb-2">Point non négociable</h3>
      <p className="text-gray-700 text-sm">
        En cas de doute sur l'origine d'une vidéo, ne pas publier l'embed. Le site doit rester une plateforme éditoriale avec contenus originaux, pas une plateforme de streaming.
      </p>
    </div>
  </section>
);

export default AdminCompliance;

