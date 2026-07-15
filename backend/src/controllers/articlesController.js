const pool = require('../db/pool');
const { sendArticleNotificationEmail } = require('../services/emailService');
const { parsePositiveInt, schemas, validatePayload } = require('../utils/validation');

const articleSlugify = (value = '') => value
  .toString()
  .trim()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const getFrontendUrl = () => (
  process.env.FRONTEND_URL || process.env.APP_URL || 'https://www.afroflix-tv.com'
).replace(/\/$/, '');

const makeExcerpt = (content = '') => String(content)
  .replace(/<[^>]*>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, 220);

const notifyNewsletterSubscribers = async (article) => {
  try {
    const result = await pool.query(
      `SELECT id, email, unsubscribe_token
       FROM newsletter_subscribers
       WHERE status = 'subscribed'
       ORDER BY subscribed_at DESC
       LIMIT 1000`
    );

    if (!result.rows.length) return;

    const url = `${getFrontendUrl()}/actualites/${article.slug}`;
    const excerpt = makeExcerpt(article.content);
    const deliveries = await Promise.allSettled(
      result.rows.map((subscriber) => sendArticleNotificationEmail({
        to: subscriber.email,
        title: article.title,
        excerpt,
        url,
        unsubscribeToken: subscriber.unsubscribe_token,
      }).then(() => pool.query(
        'UPDATE newsletter_subscribers SET last_notified_at = CURRENT_TIMESTAMP WHERE id = $1',
        [subscriber.id]
      )))
    );

    const failedCount = deliveries.filter((delivery) => delivery.status === 'rejected').length;
    if (failedCount > 0) {
      console.error(`[email] newsletter article notification failed for ${failedCount} subscriber(s)`);
    }
  } catch (err) {
    console.error('[email] newsletter article notification failed:', err.message);
  }
};

// GET manageable articles for admin/editor spaces.
const getManageableArticles = async (req, res) => {
  try {
    const { page = 1, limit = 100, status, q } = req.query;
    const currentPage = parsePositiveInt(page, 1, { min: 1, max: 100000 });
    const pageSize = parsePositiveInt(limit, 100, { min: 1, max: 100 });
    const offset = (currentPage - 1) * pageSize;
    const params = [];
    let paramIndex = 1;
    let where = 'WHERE 1 = 1';

    if (req.user.role === 'editor') {
      where += ` AND created_by = $${paramIndex++}`;
      params.push(req.user.id);
    }

    if (status) {
      where += ` AND status = $${paramIndex++}`;
      params.push(status);
    }

    if (q && q.trim().length >= 2) {
      where += ` AND (
        title ILIKE $${paramIndex}
        OR content ILIKE $${paramIndex}
        OR category ILIKE $${paramIndex}
        OR author ILIKE $${paramIndex}
      )`;
      params.push(`%${q.trim()}%`);
      paramIndex++;
    }

    const countResult = await pool.query(`SELECT COUNT(*) FROM articles ${where}`, params);
    const result = await pool.query(
      `SELECT * FROM articles ${where}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, pageSize, offset]
    );

    res.json({
      articles: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: currentPage,
        limit: pageSize,
        pages: Math.ceil(parseInt(countResult.rows[0].count) / pageSize)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// GET all articles with pagination and filtering
const getAllArticles = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const currentPage = parsePositiveInt(page, 1, { min: 1, max: 100000 });
    const pageSize = parsePositiveInt(limit, 10, { min: 1, max: 60 });
    const offset = (currentPage - 1) * pageSize;

    let query = 'SELECT * FROM articles WHERE status = $1';
    let countQuery = 'SELECT COUNT(*) FROM articles WHERE status = $1';
    const params = ['published'];
    let paramIndex = 2;

    if (category) {
      query += ` AND category ILIKE $${paramIndex}`;
      countQuery += ` AND category ILIKE $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (search) {
      query += ` AND (title ILIKE $${paramIndex} OR content ILIKE $${paramIndex})`;
      countQuery += ` AND (title ILIKE $${paramIndex} OR content ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY published_at DESC NULLS LAST LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(pageSize, offset);

    const result = await pool.query(query, params);
    const countResult = await pool.query(countQuery, params.slice(0, -2));

    res.json({
      articles: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: currentPage,
        limit: pageSize,
        pages: Math.ceil(parseInt(countResult.rows[0].count) / pageSize)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// GET article by slug
const getArticleBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const result = await pool.query(
      'SELECT * FROM articles WHERE slug = $1 AND status = $2',
      [slug, 'published']
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Increment views
    await pool.query('UPDATE articles SET views = views + 1 WHERE id = $1', [result.rows[0].id]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// CREATE article (editor/admin only)
const createArticle = async (req, res) => {
  try {
    const validation = validatePayload(schemas.article, req.body);
    if (validation.error) {
      return res.status(400).json({ error: validation.error });
    }
    const { title, content, category, featured_image, author } = validation.value;

    // Generate slug
    const slug = articleSlugify(title);

    const result = await pool.query(
      `INSERT INTO articles (title, slug, content, category, featured_image, author, status, published_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, $8)
       RETURNING *`,
      [title, slug, content, category, featured_image, author || 'Rédaction AfroFlix.TV', 'published', req.user.id]
    );

    notifyNewsletterSubscribers(result.rows[0]);

    res.status(201).json({ message: 'Article created successfully', article: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'An article with this slug already exists' });
    }
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE article (editor/admin only)
const updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const validation = validatePayload(schemas.articleUpdate, req.body);
    if (validation.error) {
      return res.status(400).json({ error: validation.error });
    }
    const { title, content, category, featured_image, author, status } = validation.value;

    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updateFields.push(`title = $${paramIndex++}`);
      updateValues.push(title);
    }
    if (content !== undefined) {
      updateFields.push(`content = $${paramIndex++}`);
      updateValues.push(content);
    }
    if (category !== undefined) {
      updateFields.push(`category = $${paramIndex++}`);
      updateValues.push(category);
    }
    if (featured_image !== undefined) {
      updateFields.push(`featured_image = $${paramIndex++}`);
      updateValues.push(featured_image);
    }
    if (author !== undefined) {
      updateFields.push(`author = $${paramIndex++}`);
      updateValues.push(author);
    }
    if (status !== undefined && ['published', 'draft', 'archived'].includes(status)) {
      updateFields.push(`status = $${paramIndex++}`);
      updateValues.push(status);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updateFields.length === 1) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(id);
    let query = `UPDATE articles SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`;
    if (req.user.role === 'editor') {
      updateValues.push(req.user.id);
      query += ` AND created_by = $${paramIndex + 1}`;
    }
    query += ' RETURNING *';

    const result = await pool.query(query, updateValues);

    if (!result.rows.length) {
      return res.status(req.user.role === 'editor' ? 403 : 404).json({
        error: req.user.role === 'editor'
          ? 'Access denied. Editors can only update their own articles'
          : 'Article not found'
      });
    }

    res.json({ message: 'Article updated successfully', article: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE article (admin only)
const deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;

    const params = ['archived', id];
    let query = 'UPDATE articles SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2';
    if (req.user.role === 'editor') {
      params.push(req.user.id);
      query += ' AND created_by = $3';
    }
    query += ' RETURNING *';

    const result = await pool.query(query, params);

    if (!result.rows.length) {
      return res.status(req.user.role === 'editor' ? 403 : 404).json({
        error: req.user.role === 'editor'
          ? 'Access denied. Editors can only archive their own articles'
          : 'Article not found'
      });
    }

    res.json({ message: 'Article archived successfully', article: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// GET article categories
const getCategories = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT category FROM articles WHERE status = 'published' ORDER BY category`,
      []
    );

    res.json({
      categories: result.rows.map(r => r.category)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getManageableArticles,
  getAllArticles,
  getArticleBySlug,
  createArticle,
  updateArticle,
  deleteArticle,
  getCategories
};
