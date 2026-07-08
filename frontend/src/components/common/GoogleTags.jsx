import { useEffect } from 'react';

const ADSENSE_SCRIPT_ID = 'google-adsense-script';
const ANALYTICS_SCRIPT_ID = 'google-analytics-script';
const ANALYTICS_INLINE_ID = 'google-analytics-inline';
const SEARCH_CONSOLE_META_ID = 'google-site-verification';

const getEnv = (name) => String(import.meta.env[name] || '').trim();

const GoogleTags = () => {
  useEffect(() => {
    const siteVerification = getEnv('VITE_GOOGLE_SITE_VERIFICATION');
    const analyticsId = getEnv('VITE_GOOGLE_ANALYTICS_ID');
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

    if (analyticsId && !document.getElementById(ANALYTICS_SCRIPT_ID)) {
      const script = document.createElement('script');
      script.id = ANALYTICS_SCRIPT_ID;
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(analyticsId)}`;
      document.head.appendChild(script);

      const inline = document.createElement('script');
      inline.id = ANALYTICS_INLINE_ID;
      inline.textContent = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${analyticsId}');
      `;
      document.head.appendChild(inline);
    }

    if (adsenseEnabled && adsenseClientId && !document.getElementById(ADSENSE_SCRIPT_ID)) {
      const script = document.createElement('script');
      script.id = ADSENSE_SCRIPT_ID;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(adsenseClientId)}`;
      document.head.appendChild(script);
    }
  }, []);

  return null;
};

export default GoogleTags;
