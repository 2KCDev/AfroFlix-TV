const pool = require('../db/pool');
const { cleanText, isValidEmail, normalizeEmail, parsePositiveInt } = require('../utils/validation');

// Spam filter keywords
const spamKeywords = ['viagra', 'casino', 'forex', 'bitcoin', 'crypto', 'click here', 'buy now', 'www.', 'http://'];

const isSpam = (content) => {
  const lower = content.toLowerCase();
  return spamKeywords.some(keyword => lower.includes(keyword)) || content.match(/\bhttps?:\/\//gi);
};

// POST comment (with auto-moderation)
const createComment = async (req, res) => {
  try {
    const { film_id } = req.params;
    const content = cleanText(req.body.content);
    const authorName = cleanText(req.body.author_name || req.user?.username || 'Utilisateur AFROFLIX.TV');
    const authorEmail = normalizeEmail(req.body.author_email || req.user?.email);

    // Validation
    if (!content || content.length < 5) {
      return res.status(400).json({ error: 'Comment must be at least 5 characters' });
    }

    if (content.length > 2000) {
      return res.status(400).json({ error: 'Le commentaire ne peut pas dépasser 2000 caractères.' });
    }

    if (!authorName || authorName.length > 255 || !isValidEmail(authorEmail)) {
      return res.status(400).json({ error: 'Author name and email are required' });
    }

    // Check if film exists
    const filmCheck = await pool.query('SELECT id FROM films WHERE id = $1', [film_id]);
    if (!filmCheck.rows.length) {
      return res.status(404).json({ error: 'Film not found' });
    }

    // Auto-detect spam
    const status = isSpam(content) ? 'spam' : 'pending';

    const result = await pool.query(
      `INSERT INTO comments (film_id, user_id, author_name, author_email, content, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, film_id, author_name, author_email, content, status, created_at`,
      [film_id, req.user?.id || null, authorName, authorEmail, content, status]
    );

    res.status(201).json({
      message: status === 'spam' ? 'Comment flagged as potential spam and sent for review' : 'Comment submitted for moderation',
      comment: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// GET comments for a film (only published ones for public)
const getFilmComments = async (req, res) => {
  try {
    const { film_id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const currentPage = parsePositiveInt(page, 1, { min: 1, max: 100000 });
    const pageSize = parsePositiveInt(limit, 10, { min: 1, max: 50 });
    const offset = (currentPage - 1) * pageSize;

    const result = await pool.query(
      `SELECT id, author_name, content, created_at FROM comments 
       WHERE film_id = $1 AND status = 'published'
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [film_id, pageSize, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM comments WHERE film_id = $1 AND status = $2',
      [film_id, 'published']
    );

    res.json({
      comments: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: currentPage,
        limit: pageSize
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// REPORT comment as inappropriate
const reportComment = async (req, res) => {
  try {
    const { id } = req.params;
    const ipAddress = req.ip || null;
    const userAgent = req.get('user-agent') || null;

    const commentCheck = await pool.query(
      "SELECT id, status FROM comments WHERE id = $1 AND status = 'published'",
      [id]
    );

    if (!commentCheck.rows.length) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const duplicateCheck = req.user?.id
      ? await pool.query(
        `SELECT id FROM comment_reports
         WHERE comment_id = $1 AND reporter_user_id = $2
         LIMIT 1`,
        [id, req.user.id]
      )
      : await pool.query(
        `SELECT id FROM comment_reports
         WHERE comment_id = $1
           AND ip_address = $2
           AND created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
         LIMIT 1`,
        [id, ipAddress]
      );

    if (duplicateCheck.rows.length) {
      return res.status(409).json({ error: 'Ce commentaire a déjà été signalé.' });
    }

    await pool.query('BEGIN');
    await pool.query(
      `INSERT INTO comment_reports (comment_id, reporter_user_id, ip_address, user_agent)
       VALUES ($1, $2, $3, $4)`,
      [id, req.user?.id || null, ipAddress, userAgent]
    );

    const result = await pool.query(
      `UPDATE comments
       SET reported_count = reported_count + 1,
           status = CASE WHEN reported_count + 1 >= 3 THEN 'hidden' ELSE status END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, reported_count, status`,
      [id]
    );

    // Auto-hide if reported 3+ times
    await pool.query('COMMIT');

    res.json({
      message: 'Merci. Le commentaire a été signalé à la modération.',
      reported_count: result.rows[0].reported_count,
      status: result.rows[0].status,
    });
  } catch (err) {
    await pool.query('ROLLBACK').catch(() => {});
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ADMIN: Get moderation queue
const getModerationQueue = async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const currentPage = parsePositiveInt(page, 1, { min: 1, max: 100000 });
    const pageSize = parsePositiveInt(limit, 20, { min: 1, max: 100 });
    const offset = (currentPage - 1) * pageSize;

    const result = await pool.query(
      `SELECT c.*, f.title as film_title FROM comments c
       JOIN films f ON c.film_id = f.id
       WHERE c.status IN ('pending', 'spam', 'hidden')
       ORDER BY c.reported_count DESC, c.created_at ASC
       LIMIT $1 OFFSET $2`,
      [pageSize, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM comments WHERE status IN ('pending', 'spam', 'hidden')`
    );

    res.json({
      comments: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: currentPage,
        limit: pageSize
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ADMIN: Approve comment
const approveComment = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE comments SET status = 'published' WHERE id = $1 RETURNING *`,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    res.json({ message: 'Comment approved', comment: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ADMIN: Reject/delete comment
const rejectComment = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE comments SET status = 'rejected' WHERE id = $1 RETURNING *`,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    res.json({ message: 'Comment rejected', comment: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createComment,
  getFilmComments,
  reportComment,
  getModerationQueue,
  approveComment,
  rejectComment
};
