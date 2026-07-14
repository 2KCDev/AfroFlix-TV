const pool = require('../db/pool');
const bcrypt = require('bcryptjs');
const {
  getEmailStatus,
  sendDiagnosticEmail,
  sendStaffAccountEmail,
} = require('../services/emailService');
const { isValidEmail, normalizeEmail } = require('../utils/validation');

const fetchGoogleJson = async (url, accessToken, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error?.message || `Google API error ${response.status}`);
  }
  return data;
};

const getGoogleInsights = async () => {
  const accessToken = process.env.GOOGLE_ACCESS_TOKEN;
  const propertyId = process.env.GA4_PROPERTY_ID;
  const siteUrl = process.env.GSC_SITE_URL;

  const configured = Boolean(accessToken && propertyId && siteUrl);
  if (!configured) {
    return {
      connected: false,
      message: 'Configure GOOGLE_ACCESS_TOKEN, GA4_PROPERTY_ID et GSC_SITE_URL pour connecter Google Analytics et Search Console.'
    };
  }

  const startDate = process.env.GOOGLE_INSIGHTS_START_DATE || '30daysAgo';
  const endDate = process.env.GOOGLE_INSIGHTS_END_DATE || 'today';

  try {
    const [analytics, searchConsole] = await Promise.all([
      fetchGoogleJson(
        `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
        accessToken,
        {
          method: 'POST',
          body: JSON.stringify({
            dateRanges: [{ startDate, endDate }],
            metrics: [
              { name: 'activeUsers' },
              { name: 'screenPageViews' },
              { name: 'sessions' }
            ]
          })
        }
      ),
      fetchGoogleJson(
        `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
        accessToken,
        {
          method: 'POST',
          body: JSON.stringify({
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            endDate: new Date().toISOString().slice(0, 10),
            dimensions: ['query'],
            rowLimit: 5
          })
        }
      )
    ]);

    const metricValues = analytics.rows?.[0]?.metricValues || [];
    return {
      connected: true,
      range: { startDate, endDate },
      analytics: {
        active_users: Number(metricValues[0]?.value || 0),
        page_views: Number(metricValues[1]?.value || 0),
        sessions: Number(metricValues[2]?.value || 0)
      },
      search_console: {
        clicks: (searchConsole.rows || []).reduce((sum, row) => sum + Number(row.clicks || 0), 0),
        impressions: (searchConsole.rows || []).reduce((sum, row) => sum + Number(row.impressions || 0), 0),
        top_queries: (searchConsole.rows || []).map((row) => ({
          query: row.keys?.[0] || '',
          clicks: Number(row.clicks || 0),
          impressions: Number(row.impressions || 0),
          ctr: Number(row.ctr || 0),
          position: Number(row.position || 0)
        }))
      }
    };
  } catch (err) {
    return {
      connected: false,
      message: err.message
    };
  }
};

const getEmailDiagnostics = async (req, res) => {
  res.json(getEmailStatus());
};

const sendEmailDiagnostic = async (req, res) => {
  try {
    const to = normalizeEmail(req.body.to || req.user.email);
    if (!isValidEmail(to)) {
      return res.status(400).json({ error: 'Adresse email de test invalide.' });
    }

    const result = await sendDiagnosticEmail({ to });
    res.json({
      message: 'Email de test traité.',
      delivery: {
        mode: result.mode || getEmailStatus().delivery_mode,
        skipped: Boolean(result.skipped),
        id: result.id || result.data?.id || null,
      },
    });
  } catch (err) {
    console.error('[email] diagnostic failed:', err);
    res.status(500).json({ error: err.message || 'Impossible d’envoyer l’email de test.' });
  }
};

const getEmailQueue = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id,
              type,
              status,
              attempts,
              max_attempts,
              last_error,
              provider_message_id,
              next_attempt_at,
              sent_at,
              created_at,
              payload->>'subject' AS subject,
              payload->'to' AS recipients
       FROM email_outbox
       ORDER BY created_at DESC
       LIMIT 50`
    );

    res.json({ emails: result.rows });
  } catch (err) {
    console.error('[email] queue read failed:', err);
    res.status(500).json({ error: 'Impossible de lire la file email.' });
  }
};

const publicUserSelect = 'id, email, username, role, created_at, updated_at';

const assertUserPayload = ({ email, username, role }) => {
  if (email !== undefined && !String(email).includes('@')) {
    return 'Email invalide.';
  }
  if (username !== undefined && String(username).trim().length < 2) {
    return 'Le nom doit contenir au moins 2 caractères.';
  }
  if (role !== undefined && !['user', 'editor', 'moderator', 'admin'].includes(role)) {
    return 'Rôle invalide.';
  }
  return null;
};

// GET all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, q } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT id, email, username, role, created_at FROM users';
    let countQuery = 'SELECT COUNT(*) FROM users';
    const params = [];
    const conditions = [];

    if (role) {
      params.push(role);
      conditions.push(`role = $${params.length}`);
    }

    if (q && String(q).trim().length >= 2) {
      params.push(`%${String(q).trim()}%`);
      conditions.push(`(email ILIKE $${params.length} OR username ILIKE $${params.length} OR role ILIKE $${params.length})`);
    }

    if (conditions.length) {
      const where = ` WHERE ${conditions.join(' AND ')}`;
      query += where;
      countQuery += where;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    const countResult = await pool.query(countQuery, params.slice(0, -2));

    res.json({
      users: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE user role (admin only)
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['user', 'editor', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Prevent removing last admin
    if (role !== 'admin') {
      const adminCheck = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'admin' AND id = $1", [id]);
      if (parseInt(adminCheck.rows[0].count) > 0) {
        const adminCount = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'admin'");
        if (parseInt(adminCount.rows[0].count) === 1) {
          return res.status(400).json({ error: 'Cannot remove the last admin' });
        }
      }
    }

    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, username, role',
      [role, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User role updated', user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE user (admin only) - soft delete
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is admin
    const userCheck = await pool.query('SELECT role FROM users WHERE id = $1', [id]);
    if (!userCheck.rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (userCheck.rows[0].role === 'admin') {
      const adminCount = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'admin'");
      if (parseInt(adminCount.rows[0].count) === 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin' });
      }
    }

    // Delete user's favorites and comments (or archive them)
    await pool.query('DELETE FROM favorites WHERE user_id = $1', [id]);
    await pool.query('DELETE FROM ratings WHERE user_id = $1', [id]);

    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id, email, username',
      [id]
    );

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// CREATE staff/user account (admin only)
const createUser = async (req, res) => {
  try {
    const { email, username, password, role = 'editor' } = req.body;
    const validationError = assertUserPayload({ email, username, role });
    if (validationError) return res.status(400).json({ error: validationError });
    if (!email || !password || String(password).length < 8) {
      return res.status(400).json({ error: 'Email et mot de passe de 8 caractères minimum requis.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, username, role)
       VALUES ($1, $2, $3, $4)
       RETURNING ${publicUserSelect}`,
      [String(email).toLowerCase().trim(), passwordHash, username || String(email).split('@')[0], role]
    );

    if (['editor', 'moderator'].includes(role)) {
      sendStaffAccountEmail({
        to: result.rows[0].email,
        username: result.rows[0].username,
        role,
      }).catch((emailErr) => console.error('[email] staff account failed:', emailErr.message));
    }

    res.status(201).json({ message: 'Utilisateur créé', user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Cet email existe déjà.' });
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE user profile fields (admin only for any user)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, username, role, password } = req.body;
    const validationError = assertUserPayload({ email, username, role });
    if (validationError) return res.status(400).json({ error: validationError });

    if (role && role !== 'admin') {
      const adminCheck = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'admin' AND id = $1", [id]);
      if (parseInt(adminCheck.rows[0].count) > 0) {
        const adminCount = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'admin'");
        if (parseInt(adminCount.rows[0].count) === 1) {
          return res.status(400).json({ error: 'Cannot remove the last admin' });
        }
      }
    }

    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (email !== undefined) {
      fields.push(`email = $${paramIndex++}`);
      values.push(String(email).toLowerCase().trim());
    }
    if (username !== undefined) {
      fields.push(`username = $${paramIndex++}`);
      values.push(String(username).trim());
    }
    if (role !== undefined) {
      fields.push(`role = $${paramIndex++}`);
      values.push(role);
    }
    if (password) {
      if (String(password).length < 8) {
        return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' });
      }
      fields.push(`password_hash = $${paramIndex++}`);
      values.push(await bcrypt.hash(password, 10));
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const result = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING ${publicUserSelect}`,
      values
    );

    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Utilisateur mis à jour', user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Cet email existe déjà.' });
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE own admin profile/password
const updateOwnProfile = async (req, res) => {
  try {
    const { email, username, current_password, new_password } = req.body;
    const validationError = assertUserPayload({ email, username });
    if (validationError) return res.status(400).json({ error: validationError });

    const current = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (!current.rows.length) return res.status(404).json({ error: 'User not found' });

    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (email !== undefined) {
      fields.push(`email = $${paramIndex++}`);
      values.push(String(email).toLowerCase().trim());
    }
    if (username !== undefined) {
      fields.push(`username = $${paramIndex++}`);
      values.push(String(username).trim());
    }
    if (new_password) {
      if (!current_password || !(await bcrypt.compare(current_password, current.rows[0].password_hash))) {
        return res.status(400).json({ error: 'Mot de passe actuel incorrect.' });
      }
      if (String(new_password).length < 8) {
        return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' });
      }
      fields.push(`password_hash = $${paramIndex++}`);
      values.push(await bcrypt.hash(new_password, 10));
    }

    if (!fields.length) return res.status(400).json({ error: 'Aucun champ à mettre à jour.' });

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.user.id);

    const result = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING ${publicUserSelect}`,
      values
    );

    res.json({ message: 'Profil mis à jour', user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Cet email existe déjà.' });
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// GET dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const isEditor = req.user?.role === 'editor';
    const ownerFilter = isEditor ? ' AND created_by = $2' : '';
    const ownerParams = isEditor ? [req.user.id] : [];

    // Count entities. Editors see their own film activity; admin keeps the global view.
    const filmsCount = await pool.query(
      `SELECT COUNT(*) FROM films WHERE status = $1${ownerFilter}`,
      ['published', ...ownerParams]
    );
    const actorsCount = await pool.query('SELECT COUNT(*) FROM actors');
    const articlesCount = await pool.query(
      `SELECT COUNT(*) FROM articles WHERE status = $1${isEditor ? ' AND created_by = $2' : ''}`,
      ['published', ...ownerParams]
    );
    const usersCount = await pool.query('SELECT COUNT(*) FROM users');
    const commentsCount = await pool.query(
      `SELECT COUNT(*) FROM comments c
       JOIN films f ON c.film_id = f.id
       WHERE c.status = $1${isEditor ? ' AND f.created_by = $2' : ''}`,
      ['published', ...ownerParams]
    );
    const pendingComments = await pool.query(
      `SELECT COUNT(*) FROM comments c
       JOIN films f ON c.film_id = f.id
       WHERE c.status = $1${isEditor ? ' AND f.created_by = $2' : ''}`,
      ['pending', ...ownerParams]
    );
    const viewsTotal = await pool.query(
      `SELECT COALESCE(SUM(views), 0) AS total FROM films WHERE 1 = 1${isEditor ? ' AND created_by = $1' : ''}`,
      ownerParams
    );
    const draftFilms = await pool.query(
      `SELECT COUNT(*) FROM films WHERE status = $1${ownerFilter}`,
      ['draft', ...ownerParams]
    );

    // Get today's stats
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayFilmsAdded = await pool.query(
      `SELECT COUNT(*) FROM films WHERE created_at > $1${isEditor ? ' AND created_by = $2' : ''}`,
      [todayStart, ...ownerParams]
    );

    const todayArticlesAdded = await pool.query(
      `SELECT COUNT(*) FROM articles WHERE created_at > $1${isEditor ? ' AND created_by = $2' : ''}`,
      [todayStart, ...ownerParams]
    );

    const todayComments = await pool.query(
      `SELECT COUNT(*) FROM comments c
       JOIN films f ON c.film_id = f.id
       WHERE c.created_at > $1${isEditor ? ' AND f.created_by = $2' : ''}`,
      [todayStart, ...ownerParams]
    );

    const todayUsers = await pool.query(
      'SELECT COUNT(*) FROM users WHERE created_at > $1',
      [todayStart]
    );

    // Top films
    const topFilms = await pool.query(
      `SELECT id, title, slug, views, average_rating FROM films 
       WHERE status = 'published'${isEditor ? ' AND created_by = $1' : ''}
       ORDER BY views DESC
       LIMIT 5`,
      ownerParams
    );

    // Top articles
    const topArticles = await pool.query(
      `SELECT id, title, slug, views FROM articles 
       WHERE status = 'published'${isEditor ? ' AND created_by = $1' : ''}
       ORDER BY views DESC
       LIMIT 5`,
      ownerParams
    );

    const monthlyViews = await pool.query(
      `SELECT TO_CHAR(month_bucket, 'YYYY-MM') AS month,
              TO_CHAR(month_bucket, 'Mon YYYY') AS label,
              COALESCE(view_count, 0)::INT AS views
       FROM generate_series(
         date_trunc('month', CURRENT_DATE) - INTERVAL '11 months',
         date_trunc('month', CURRENT_DATE),
         INTERVAL '1 month'
       ) AS month_bucket
       LEFT JOIN (
         SELECT date_trunc('month', v.timestamp) AS viewed_month, COUNT(*) AS view_count
         FROM views v
         JOIN films f ON f.id = v.film_id
         WHERE v.timestamp >= date_trunc('month', CURRENT_DATE) - INTERVAL '11 months'
         ${isEditor ? 'AND f.created_by = $1' : ''}
         GROUP BY viewed_month
       ) counted ON counted.viewed_month = month_bucket
       ORDER BY month_bucket ASC`,
      ownerParams
    );

    const payload = {
      overview: {
        total_films: parseInt(filmsCount.rows[0].count),
        total_actors: parseInt(actorsCount.rows[0].count),
        total_articles: parseInt(articlesCount.rows[0].count),
        total_users: parseInt(usersCount.rows[0].count),
        total_comments: parseInt(commentsCount.rows[0].count),
        pending_comments: parseInt(pendingComments.rows[0].count),
        total_views: parseInt(viewsTotal.rows[0].total),
        draft_films: parseInt(draftFilms.rows[0].count)
      },
      today: {
        films_added: parseInt(todayFilmsAdded.rows[0].count),
        articles_added: parseInt(todayArticlesAdded.rows[0].count),
        new_comments: parseInt(todayComments.rows[0].count),
        new_users: parseInt(todayUsers.rows[0].count)
      },
      trending: {
        top_films: topFilms.rows,
        top_articles: topArticles.rows
      },
      monthly: {
        views: monthlyViews.rows
      }
    };

    if (req.user?.role === 'admin') {
      payload.google = await getGoogleInsights();
    }

    res.json(payload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  updateOwnProfile,
  updateUserRole,
  deleteUser,
  getDashboardStats,
  getEmailDiagnostics,
  getEmailQueue,
  sendEmailDiagnostic
};
