const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const pool = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');
const { sendPasswordResetEmail, sendWelcomeEmail } = require('../services/emailService');
const { isValidEmail, normalizeEmail, schemas, validatePayload } = require('../utils/validation');

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const RESET_ALLOWED_ROLES = ['user', 'admin'];

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production' && (!secret || secret.length < 32 || secret === 'your-secret-key')) {
    throw new Error('JWT_SECRET must be configured with a strong secret in production.');
  }
  return secret || 'development-only-secret-change-me';
};

const signToken = (user) => jwt.sign(
  { id: user.id, email: user.email, username: user.username, role: user.role },
  getJwtSecret(),
  { expiresIn: '7d' }
);

const getFrontendUrl = () => (
  process.env.FRONTEND_URL
  || process.env.APP_URL
  || (process.env.NODE_ENV === 'production' ? 'https://www.afroflix-tv.com' : 'http://localhost:3000')
).replace(/\/$/, '');

const hashResetToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives. Réessayez dans quelques minutes.' },
});

router.use(authLimiter);

router.post('/register', async (req, res) => {
  try {
    const validation = validatePayload(schemas.register, req.body);
    if (validation.error) {
      return res.status(400).json({ error: validation.error });
    }
    const { email: normalizedEmail, password, username } = validation.value;

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, username, role) 
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, username, role, created_at`,
      [normalizedEmail, passwordHash, username || normalizedEmail.split('@')[0], 'user']
    );

    sendWelcomeEmail({
      to: result.rows[0].email,
      username: result.rows[0].username,
    }).catch((emailErr) => console.error('[email] welcome failed:', emailErr.message));

    res.status(201).json({ 
      user: result.rows[0], 
      token: signToken(result.rows[0]) 
    });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already registered' });
    res.status(500).json({ error: err.message });
  }
});

router.post('/forgot-password', async (req, res) => {
  const genericResponse = {
    message: 'Si ce compte est éligible, un email de réinitialisation vient d’être envoyé.',
  };

  try {
    const email = normalizeEmail(req.body.email);
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Adresse email invalide.' });
    }

    const result = await pool.query(
      "SELECT id, email, username, role FROM users WHERE email = $1",
      [email]
    );

    if (!result.rows.length || !RESET_ALLOWED_ROLES.includes(result.rows[0].role)) {
      return res.json(genericResponse);
    }

    const user = result.rows[0];
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashResetToken(rawToken);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await pool.query('DELETE FROM password_reset_tokens WHERE expires_at <= CURRENT_TIMESTAMP OR used_at IS NOT NULL');
    await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [user.id]);
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, tokenHash, expiresAt]
    );

    const resetUrl = `${getFrontendUrl()}/auth?reset_token=${rawToken}`;
    await sendPasswordResetEmail({
      to: user.email,
      username: user.username,
      resetUrl,
    });

    res.json(genericResponse);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Impossible de traiter la demande pour le moment.' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const validation = validatePayload(schemas.resetPassword, req.body);
    if (validation.error) {
      return res.status(400).json({ error: validation.error });
    }
    const { token, password } = validation.value;

    const tokenHash = hashResetToken(String(token));
    const result = await pool.query(
      `SELECT prt.id, prt.user_id, u.email, u.username, u.role
       FROM password_reset_tokens prt
       JOIN users u ON u.id = prt.user_id
       WHERE prt.token_hash = $1
         AND prt.used_at IS NULL
         AND prt.expires_at > CURRENT_TIMESTAMP`,
      [tokenHash]
    );

    if (!result.rows.length || !RESET_ALLOWED_ROLES.includes(result.rows[0].role)) {
      return res.status(400).json({ error: 'Lien de réinitialisation invalide ou expiré.' });
    }

    const user = result.rows[0];
    const passwordHash = await bcrypt.hash(String(password), 10);

    await pool.query('BEGIN');
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [passwordHash, user.user_id]
    );
    await pool.query(
      'UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );
    await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1 AND id <> $2', [user.user_id, user.id]);
    await pool.query('COMMIT');

    res.json({ message: 'Mot de passe mis à jour. Vous pouvez maintenant vous connecter.' });
  } catch (err) {
    await pool.query('ROLLBACK').catch(() => {});
    console.error(err);
    res.status(500).json({ error: 'Impossible de réinitialiser le mot de passe pour le moment.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const validation = validatePayload(schemas.login, req.body);
    if (validation.error) {
      return res.status(400).json({ error: validation.error });
    }
    const { email, password } = validation.value;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (!result.rows.length) return res.status(401).json({ error: 'Invalid credentials' });

    const user = result.rows[0];
    const ok = await bcrypt.compare(password || '', user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    res.json({
      user: { id: user.id, email: user.email, username: user.username, role: user.role },
      token: signToken(user)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user profile (requires auth)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, username, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
