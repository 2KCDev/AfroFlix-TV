const ANALYTICS_SCRIPT_ID = 'google-analytics-script';
const CONSENT_CHANGED_EVENT = 'cookie-consent:changed';

const measurementId = () => String(
  import.meta.env.VITE_GA4_MEASUREMENT_ID || import.meta.env.VITE_GOOGLE_ANALYTICS_ID || ''
).trim();

const canTrack = () => window.__afroflixAnalyticsConsent === true && Boolean(measurementId());

export const initializeAnalytics = () => {
  const id = measurementId();
  if (!id || document.getElementById(ANALYTICS_SCRIPT_ID)) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', id, { send_page_view: false, anonymize_ip: true });

  const script = document.createElement('script');
  script.id = ANALYTICS_SCRIPT_ID;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);
};

export const updateAnalyticsConsent = (analyticsAllowed) => {
  window.__afroflixAnalyticsConsent = Boolean(analyticsAllowed);
  if (analyticsAllowed) initializeAnalytics();
};

export const trackEvent = (name, params = {}) => {
  if (!canTrack() || typeof window.gtag !== 'function') return;
  window.gtag('event', name, params);
};

export const trackPageView = ({ path, title }) => {
  const id = measurementId();
  if (!id) return;
  trackEvent('page_view', {
    page_location: window.location.href,
    page_path: path,
    page_title: title || document.title,
    send_to: id,
  });
};

export const CONSENT_CHANGE_EVENT = CONSENT_CHANGED_EVENT;
