const { getGoogleAccessToken, isGoogleOAuthConfigured } = require('./auth');

const fetchGoogleJson = async (url, accessToken, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || `Google Analytics API error ${response.status}`);
  return data;
};

const getAnalyticsInsights = async () => {
  const propertyId = String(process.env.GA4_PROPERTY_ID || '').trim();
  if (!isGoogleOAuthConfigured() || !propertyId) {
    return { connected: false, message: 'Configure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN et GA4_PROPERTY_ID.' };
  }

  const accessToken = await getGoogleAccessToken();
  const startDate = process.env.GOOGLE_INSIGHTS_START_DATE || '30daysAgo';
  const endDate = process.env.GOOGLE_INSIGHTS_END_DATE || 'today';
  const report = await fetchGoogleJson(
    `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(propertyId)}:runReport`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'screenPageViews' },
          { name: 'sessions' },
          { name: 'eventCount' },
        ],
      }),
    }
  );
  const values = report.rows?.[0]?.metricValues || [];
  return {
    connected: true,
    range: { startDate, endDate },
    active_users: Number(values[0]?.value || 0),
    page_views: Number(values[1]?.value || 0),
    sessions: Number(values[2]?.value || 0),
    events: Number(values[3]?.value || 0),
  };
};

module.exports = { getAnalyticsInsights };
