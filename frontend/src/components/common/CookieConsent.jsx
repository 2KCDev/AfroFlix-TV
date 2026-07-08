import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'afroflix.tv_cookie_consent';
const CONSENT_VERSION = 2;
const DETAILS_EVENT = 'cookie-consent:open';
const CONSENT_CHANGED_EVENT = 'cookie-consent:changed';
const AUTH_LOGIN_EVENT = 'auth:login';
const DEFAULT_PREFERENCES = {
  analytics: false,
  ads: false,
};

const categories = [
  {
    key: 'essential',
    title: 'Cookies essentiels',
    description: 'Connexion, sécurité, préférences de consentement et bon fonctionnement de la plateforme.',
    required: true,
  },
  {
    key: 'analytics',
    title: 'Mesure d’audience',
    description: 'Statistiques anonymisées pour comprendre les pages consultées et améliorer les performances.',
  },
  {
    key: 'ads',
    title: 'Publicité personnalisée',
    description: 'Prépare l’affichage de publicités et la mesure publicitaire, uniquement après votre accord.',
  },
];

const readStoredConsent = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    if (parsed.version !== CONSENT_VERSION) return null;

    return {
      analytics: Boolean(parsed.analytics),
      ads: Boolean(parsed.ads),
      choice: parsed.choice,
      savedAt: parsed.savedAt,
    };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

const publishConsent = (payload) => {
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: payload }));
};

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);

  useEffect(() => {
    const stored = readStoredConsent();
    if (stored) {
      setPreferences({
        analytics: stored.analytics,
        ads: stored.ads,
      });
      publishConsent({ ...stored, essential: true });
    } else {
      setVisible(true);
    }

    const openPreferences = () => {
      setVisible(true);
      setCustomizing(true);
    };

    const openAfterLoginIfNeeded = () => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
        setCustomizing(false);
      }
    };

    window.addEventListener(DETAILS_EVENT, openPreferences);
    window.addEventListener(AUTH_LOGIN_EVENT, openAfterLoginIfNeeded);
    return () => {
      window.removeEventListener(DETAILS_EVENT, openPreferences);
      window.removeEventListener(AUTH_LOGIN_EVENT, openAfterLoginIfNeeded);
    };
  }, []);

  const saveChoice = (choice, overrides = preferences) => {
    const payload = {
      version: CONSENT_VERSION,
      choice,
      essential: true,
      analytics: choice === 'accepted' ? true : overrides.analytics,
      ads: choice === 'accepted' ? true : overrides.ads,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setPreferences({
      analytics: payload.analytics,
      ads: payload.ads,
    });
    publishConsent(payload);
    setVisible(false);
    setCustomizing(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3 sm:px-5 sm:pb-5" role="region" aria-label="Préférences cookies">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-lg border border-gray-200 bg-white shadow-2xl">
        <div className="grid gap-0 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="p-5 sm:p-6">
            <div className="mb-3 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-normal text-red-700">Confidentialité</p>
                <h2 className="mt-1 text-xl font-bold text-gray-950">Gestion des cookies</h2>
              </div>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">RGPD</span>
            </div>
            <p className="text-sm leading-6 text-gray-700">
              AFROFLIX.TV utilise les cookies essentiels au fonctionnement du site. Les cookies de mesure
              d’audience et de publicité ne sont activés qu’après votre accord. Vous pouvez accepter, refuser
              ou ajuster vos choix à tout moment depuis la <Link to="/cookies" className="font-semibold text-red-700 hover:text-red-800">politique des cookies</Link>.
            </p>
          </div>

          {customizing && (
            <div className="border-t border-gray-200 bg-gray-50 p-5 lg:border-l lg:border-t-0">
              <div className="grid gap-3">
                {categories.map((category) => (
                  <label
                    key={category.key}
                    className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3"
                  >
                    <input
                      type="checkbox"
                      checked={category.required ? true : preferences[category.key]}
                      disabled={category.required}
                      onChange={(event) => setPreferences((current) => ({
                        ...current,
                        [category.key]: event.target.checked,
                      }))}
                      className="mt-1 h-4 w-4 accent-red-600"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-gray-950">{category.title}</span>
                      <span className="block text-xs leading-5 text-gray-600">{category.description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {!customizing && (
            <div className="border-t border-gray-200 bg-gray-50 p-5 lg:border-l lg:border-t-0">
              <div className="grid gap-3 text-sm text-gray-700">
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <span className="font-semibold text-gray-950">Essentiels actifs</span>
                  <p className="mt-1 text-xs leading-5 text-gray-600">Nécessaires pour la sécurité, la session et vos préférences.</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <span className="font-semibold text-gray-950">Choix modifiable</span>
                  <p className="mt-1 text-xs leading-5 text-gray-600">Un bouton de gestion reste disponible sur la page cookies.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-gray-200 bg-white p-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => saveChoice('rejected', DEFAULT_PREFERENCES)}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Tout refuser
          </button>
          <button
            type="button"
            onClick={() => customizing ? saveChoice('custom') : setCustomizing(true)}
            className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50"
          >
            {customizing ? 'Enregistrer mes choix' : 'Personnaliser'}
          </button>
          <button
            type="button"
            onClick={() => saveChoice('accepted')}
            className="rounded-lg bg-red-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-800"
          >
            Tout accepter
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
