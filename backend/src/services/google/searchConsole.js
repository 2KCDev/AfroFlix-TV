const { getGoogleAccessToken, isGoogleOAuthConfigured } = require('./auth');

const getSearchConsoleInsights = async () => {
  const siteUrl = String(process.env.GSC_SITE_URL || '').trim();
  if (!isGoogleOAuthConfigured() || !siteUrl) {
    return { connected: false, message: 'Search Console n’est pas configuré (GSC_SITE_URL optionnel).' };
  }

  const accessToken = await getGoogleAccessToken();
  const response = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        endDate: new Date().toISOString().slice(0, 10),
        dimensions: ['query'],
        rowLimit: 5,
      }),
    }
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || `Search Console API error ${response.status}`);

  return {
    connected: true,
    clicks: (data.rows || []).reduce((sum, row) => sum + Number(row.clicks || 0), 0),
    impressions: (data.rows || []).reduce((sum, row) => sum + Number(row.impressions || 0), 0),
    top_queries: (data.rows || []).map((row) => ({
      query: row.keys?.[0] || '', clicks: Number(row.clicks || 0), impressions: Number(row.impressions || 0),
      ctr: Number(row.ctr || 0), position: Number(row.position || 0),
    })),
  };
};

module.exports = { getSearchConsoleInsights };
