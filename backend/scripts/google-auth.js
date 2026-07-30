const http = require('http');
const { google } = require('googleapis');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/oauth2callback';

if (!CLIENT_ID || !CLIENT_SECRET) {
  throw new Error('Ajoutez GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET dans backend/.env avant de lancer ce script.');
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const SCOPES = [
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/webmasters.readonly'
];

const server = http.createServer(async (req, res) => {
  if (!req.url.startsWith('/oauth2callback')) {
    res.end('Not found');
    return;
  }

  const url = new URL(req.url, 'http://localhost:3000');
  const code = url.searchParams.get('code');

  try {
    const { tokens } = await oauth2Client.getToken(code);

    console.log('\n========================================');
    console.log('GOOGLE_REFRESH_TOKEN');
    console.log('========================================\n');
    console.log(tokens.refresh_token);
    console.log('\n========================================\n');

    res.end('Autorisation réussie. Vous pouvez fermer cette fenêtre.');

    server.close();
  } catch (err) {
    console.error(err);
    res.end('Erreur.');
  }
});

server.listen(3000, async () => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  });

  console.log('\nOuvre cette URL dans ton navigateur :\n');
  console.log(authUrl);
  console.log("\nEn attente de l'autorisation...\n");

});
