import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'afroflix-language';

const translations = {
  fr: {
    'language.label': 'Langue',
    'language.switchTo': 'Passer en anglais',
    'nav.home': 'Accueil',
    'nav.films': 'Films',
    'nav.actors': 'Acteurs',
    'nav.news': 'Actualités',
    'nav.rankings': 'Classements',
    'nav.search': 'Recherche',
    'nav.favorites': 'Mes favoris',
    'nav.administration': 'Administration',
    'nav.login': 'Connexion',
    'nav.logout': 'Déconnexion',
    'footer.description': 'Votre référence pour découvrir le cinéma africain.',
    'footer.navigation': 'Navigation',
    'footer.resources': 'Ressources',
    'footer.legal': 'Légal',
    'footer.reviews': 'Critiques',
    'footer.about': 'À propos',
    'footer.contact': 'Contact',
    'footer.guide': 'Guide AfroFlix.TV',
    'footer.legalNotice': 'Mentions légales',
    'footer.privacy': 'Confidentialité',
    'footer.terms': 'Conditions',
    'footer.cookies': 'Cookies',
    'footer.copyright': "Droits d'auteur",
    'footer.stayInformed': 'Restez informé',
    'footer.newsletterDescription': 'Recevez les dernières actualités d’AfroFlix.TV',
    'footer.email': 'Votre e-mail',
    'footer.subscribe': "S'inscrire aux actualités",
    'footer.newsletterSuccess': 'Votre inscription aux actualités est confirmée.',
    'footer.newsletterError': 'Impossible de confirmer votre inscription pour le moment.',
    'footer.allRightsReserved': 'Tous droits réservés.',
    'footer.privacyPolicy': 'Politique de confidentialité',
    'footer.termsOfUse': "Conditions d'utilisation",
    'common.films': 'Films',
    'card.views': 'vues',
    'card.noDescription': 'Pas de description disponible',
    'card.viewMore': 'Voir plus',
    'card.addFavorite': 'Ajouter aux favoris',
    'card.film': 'film',
    'card.films': 'films',
    'card.noBiography': 'Pas de biographie disponible',
    'card.article': 'Article',
    'card.comingSoon': 'Date à venir',
    'common.loading': 'Chargement en cours…',
    'notFound.title': 'Page non trouvée',
    'notFound.description': "Désolé, la page que vous recherchez n'existe pas. Elle a peut-être été supprimée ou l’URL est incorrecte.",
    'notFound.search': 'Rechercher un film ou un acteur',
    'notFound.home': "Retour à l'accueil",
    'notFound.films': 'Voir les films',
    'notFound.brokenLink': 'Vous avez trouvé un lien cassé?',
    'notFound.report': 'Nous le signaler',
    'search.placeholder': 'Rechercher par mots clés…',
    'search.actor': 'Acteur',
  },
  en: {
    'language.label': 'Language',
    'language.switchTo': 'Switch to French',
    'nav.home': 'Home',
    'nav.films': 'Films',
    'nav.actors': 'Actors',
    'nav.news': 'News',
    'nav.rankings': 'Rankings',
    'nav.search': 'Search',
    'nav.favorites': 'My favourites',
    'nav.administration': 'Administration',
    'nav.login': 'Sign in',
    'nav.logout': 'Sign out',
    'footer.description': 'Your reference for discovering African cinema.',
    'footer.navigation': 'Navigation',
    'footer.resources': 'Resources',
    'footer.legal': 'Legal',
    'footer.reviews': 'Reviews',
    'footer.about': 'About',
    'footer.contact': 'Contact',
    'footer.guide': 'AfroFlix.TV guide',
    'footer.legalNotice': 'Legal notice',
    'footer.privacy': 'Privacy',
    'footer.terms': 'Terms',
    'footer.cookies': 'Cookies',
    'footer.copyright': 'Copyright',
    'footer.stayInformed': 'Stay informed',
    'footer.newsletterDescription': 'Get the latest news from AfroFlix.TV',
    'footer.email': 'Your email address',
    'footer.subscribe': 'Subscribe to news',
    'footer.newsletterSuccess': 'Your news subscription has been confirmed.',
    'footer.newsletterError': 'We could not confirm your subscription at the moment.',
    'footer.allRightsReserved': 'All rights reserved.',
    'footer.privacyPolicy': 'Privacy policy',
    'footer.termsOfUse': 'Terms of use',
    'common.films': 'Films',
    'card.views': 'views',
    'card.noDescription': 'No description available',
    'card.viewMore': 'View more',
    'card.addFavorite': 'Add to favourites',
    'card.film': 'film',
    'card.films': 'films',
    'card.noBiography': 'No biography available',
    'card.article': 'Article',
    'card.comingSoon': 'Coming soon',
    'common.loading': 'Loading…',
    'notFound.title': 'Page not found',
    'notFound.description': 'Sorry, the page you are looking for does not exist. It may have been removed or the URL is incorrect.',
    'notFound.search': 'Search for a film or an actor',
    'notFound.home': 'Back to home',
    'notFound.films': 'View films',
    'notFound.brokenLink': 'Did you find a broken link?',
    'notFound.report': 'Let us know',
    'search.placeholder': 'Search by keyword…',
    'search.actor': 'Actor',
  },
};

export const LocaleContext = createContext();

export function LocaleProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const savedLanguage = window.localStorage.getItem(STORAGE_KEY);
    return savedLanguage === 'en' ? 'en' : 'fr';
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const toggleLanguage = useCallback(() => {
    setLanguage((currentLanguage) => (currentLanguage === 'fr' ? 'en' : 'fr'));
  }, []);

  const value = useMemo(() => ({
    language,
    setLanguage,
    toggleLanguage,
    t: (key) => translations[language][key] || translations.fr[key] || key,
  }), [language, toggleLanguage]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
