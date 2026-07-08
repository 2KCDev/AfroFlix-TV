import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiHome, FiArrowRight } from 'react-icons/fi';
import SearchSuggest from '../components/common/SearchSuggest';

const NotFound = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-8 max-w-lg">
        <div className="space-y-2">
          <h1 className="text-7xl font-bold text-red-600">404</h1>
          <h2 className="text-3xl font-bold text-gray-900">Page non trouvée</h2>
        </div>

        <p className="text-gray-600 text-lg">
          Désolé, la page que vous recherchez n'existe pas. Elle a peut-être été supprimée ou l'URL est incorrecte.
        </p>

        <SearchSuggest
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Rechercher un film ou un acteur"
          buttonLabel="Rechercher"
        />

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition"
          >
            <FiHome size={20} />
            Retour à l'accueil
          </Link>
          <Link
            to="/films"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-red-600 text-red-600 font-bold rounded-lg hover:bg-red-50 transition"
          >
            Voir les films
            <FiArrowRight size={20} />
          </Link>
        </div>

        <div className="pt-8">
          <p className="text-gray-500 text-sm">
            Vous avez trouvé un lien cassé? 
            <Link to="/contact" className="text-red-600 hover:text-red-700 font-semibold ml-1">
              Nous le signaler
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
