const crypto = require('crypto');
const pool = require('../db/pool');
const {
  sendNewsletterConfirmation,
  sendNewsletterInternalNotification,
} = require('../services/emailService');
const { isValidEmail, normalizeEmail } = require('../utils/validation');

const createUnsubscribeToken = () => crypto.randomBytes(24).toString('hex');

const subscribe = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Adresse email invalide.' });
    }

    const token = createUnsubscribeToken();
    const result = await pool.query(
      `INSERT INTO newsletter_subscribers (email, unsubscribe_token, status, source)
       VALUES ($1, $2, 'subscribed', $3)
       ON CONFLICT (email)
       DO UPDATE SET
         status = 'subscribed',
         unsubscribed_at = NULL,
         updated_at = CURRENT_TIMESTAMP
       RETURNING id, email, unsubscribe_token, status`,
      [email, token, req.body.source || 'footer']
    );

    const subscriber = result.rows[0];

    try {
      await sendNewsletterConfirmation({
        to: subscriber.email,
        unsubscribeToken: subscriber.unsubscribe_token,
      });
    } catch (emailErr) {
      console.error('[email] newsletter confirmation failed:', emailErr.message);
      return res.status(502).json({
        error: 'Inscription enregistrée, mais l’email de confirmation n’a pas pu être envoyé.',
      });
    }

    sendNewsletterInternalNotification({ email: subscriber.email })
      .catch((emailErr) => console.error('[email] newsletter internal notification failed:', emailErr.message));

    res.status(201).json({
      message: 'Votre inscription aux actualités AFROFLIX.TV est confirmée.',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Impossible de traiter cette inscription pour le moment.' });
  }
};

const unsubscribe = async (req, res) => {
  try {
    const token = String(req.params.token || '').trim();
    if (!token || token.length < 24) {
      return res.status(400).json({ error: 'Lien de désinscription invalide.' });
    }

    const result = await pool.query(
      `UPDATE newsletter_subscribers
       SET status = 'unsubscribed',
           unsubscribed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE unsubscribe_token = $1
       RETURNING email`,
      [token]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Lien de désinscription introuvable.' });
    }

    res.json({ message: 'Vous êtes désinscrit des actualités AFROFLIX.TV.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Impossible de vous désinscrire pour le moment.' });
  }
};

module.exports = {
  subscribe,
  unsubscribe,
};
