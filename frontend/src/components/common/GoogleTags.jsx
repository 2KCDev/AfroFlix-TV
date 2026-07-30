import { useEffect } from 'react';
import { CONSENT_CHANGE_EVENT, trackPageView, updateAnalyticsConsent } from '../../services/analytics';

const ADSENSE_SCRIPT_ID = 'google-adsense-script';
const SEARCH_CONSOLE_META_ID = 'google-site-verification';

const getEnv = (name) => String(import.meta.env[name] || '').trim();

const GoogleTags = () => {
  useEffect(() => {
    const siteVerification = getEnv('VITE_GOOGLE_SITE_VERIFICATION');
    const adsenseClientId = getEnv('VITE_GOOGLE_ADSENSE_CLIENT_ID');
    const adsenseEnabled = getEnv('VITE_GOOGLE_ADSENSE_ENABLED') === 'true';

    if (siteVerification) {
      let tag = document.head.querySelector(`meta[name="${SEARCH_CONSOLE_META_ID}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', SEARCH_CONSOLE_META_ID);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', siteVerification);
    }

    const loadAdSense = () => {
      if (!adsenseEnabled || !adsenseClientId || document.getElementById(ADSENSE_SCRIPT_ID)) return;
      const script = document.createElement('script');
      script.id = ADSENSE_SCRIPT_ID;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(adsenseClientId)}`;
      document.head.appendChild(script);
    };
    const onConsentChanged = (event) => {
      const consent = event.detail || {};
      updateAnalyticsConsent(consent.analytics);
      if (consent.analytics) trackPageView({ path: `${window.location.pathname}${window.location.search}` });
      if (consent.ads) loadAdSense();
    };
    window.addEventListener(CONSENT_CHANGE_EVENT, onConsentChanged);
    return () => window.removeEventListener(CONSENT_CHANGE_EVENT, onConsentChanged);
  }, []);

  return null;
};

export default GoogleTags;
