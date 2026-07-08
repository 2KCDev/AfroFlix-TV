import React from 'react';
import { FiShield } from 'react-icons/fi';

const EditorialRequirements = () => (
  <section className="rounded-lg border border-green-200 bg-green-50 p-5">
    <div className="flex gap-3">
      <FiShield className="mt-1 shrink-0 text-green-700" size={22} />
      <div>
        <h2 className="text-lg font-bold text-gray-900">Engagement éditorial et droits d’auteur</h2>
        <p className="mt-2 text-sm leading-6 text-gray-700">
          AFROFLIX.TV publie des contenus originaux en français, ne diffuse aucun fichier vidéo piraté et privilégie
          uniquement les bandes-annonces, extraits ou liens officiellement publiés par les ayants droit.
        </p>
      </div>
    </div>
  </section>
);

export default EditorialRequirements;
