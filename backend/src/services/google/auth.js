const { google } = require('googleapis');

const ANALYTICS_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';
const SEARCH_CONSOLE_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';

const getGoogleConfig = () => ({
  clientId: String(process.env.GOOGLE_CLIENT_ID || '').trim(),
  clientSecret: String(process.env.GOOGLE_CLIENT_SECRET || '').trim(),
  refreshToken: String(process.env.GOOGLE_REFRESH_TOKEN || '').trim(),
  redirectUri: String(process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/oauth2callback').trim(),
});

const isGoogleOAuthConfigured = () => {
  const { clientId, clientSecret, refreshToken } = getGoogleConfig();
  return Boolean(clientId && clientSecret && refreshToken);
};

const createOAuthClient = () => {
  const { clientId, clientSecret, refreshToken, redirectUri } = getGoogleConfig();
  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET sont requis.');
  }

  const client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  if (refreshToken) client.setCredentials({ refresh_token: refreshToken });
  return client;
};

const getGoogleAccessToken = async () => {
  const { refreshToken } = getGoogleConfig();
  if (!refreshToken) throw new Error('GOOGLE_REFRESH_TOKEN est requis.');

  const client = createOAuthClient();
  const result = await client.getAccessToken();
  if (!result.token) throw new Error('Google n’a pas retourné de jeton d’accès.');
  return result.token;
};

module.exports = {
  ANALYTICS_SCOPE,
  SEARCH_CONSOLE_SCOPE,
  createOAuthClient,
  getGoogleAccessToken,
  isGoogleOAuthConfigured,
};
