const { getAnalyticsInsights } = require('./analytics');
const { getSearchConsoleInsights } = require('./searchConsole');

const getGoogleInsights = async () => {
  const [analyticsResult, searchResult] = await Promise.allSettled([
    getAnalyticsInsights(),
    getSearchConsoleInsights(),
  ]);
  const analytics = analyticsResult.status === 'fulfilled'
    ? analyticsResult.value
    : { connected: false, message: analyticsResult.reason.message };
  const search_console = searchResult.status === 'fulfilled'
    ? searchResult.value
    : { connected: false, message: searchResult.reason.message };

  return {
    connected: analytics.connected,
    message: analytics.message,
    range: analytics.range,
    analytics,
    search_console,
  };
};

module.exports = { getGoogleInsights };
