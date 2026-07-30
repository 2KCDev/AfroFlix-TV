import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../../services/analytics';

const AnalyticsPageView = () => {
  const location = useLocation();

  useEffect(() => {
    trackPageView({ path: `${location.pathname}${location.search}` });
  }, [location.pathname, location.search]);

  return null;
};

export default AnalyticsPageView;
