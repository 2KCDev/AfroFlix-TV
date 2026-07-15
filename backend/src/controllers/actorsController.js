const pool = require('../db/pool');
const { schemas, validatePayload } = require('../utils/validation');

let actorOwnershipMigration;

const ensureActorManagementColumns = () => {
  if (!actorOwnershipMigration) {
    actorOwnershipMigration = pool.query(`
      ALTER TABLE actors
        ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'published';
      CREATE INDEX IF NOT EXISTS idx_actors_created_by ON actors(created_by);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_actors_name_unique_lower ON actors (LOWER(name));
    `);
  }
  return actorOwnershipMigration;
};

const assertUniqueActorName = async ({ name, excludeId = null }) => {
  if (!name || !String(name).trim()) return null;
  const params = [String(name).trim()];
  let query = 'SELECT id FROM actors WHERE LOWER(name) = LOWER($1)';
  if (excludeId) {
    params.push(excludeId);
    query += ' AND id <> $2';
  }
  const result = await pool.query(query, params);
  return result.rows.length ? 'Un acteur avec ce nom existe déjà.' : null;
};

// GET manageable actors for admin/editor spaces.
const getManageableActors = async (req, res) => {
  try {
    await ensureActorManagementColumns();
    const { page = 1, limit = 100, status, search } = req.query;
    const currentPage = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 100);
    const offset = (currentPage - 1) * pageSize;
    const params = [];
    let paramIndex = 1;
    let where = 'WHERE 1 = 1';

    if (req.user.role === 'editor') {
      where += ` AND created_by = $${paramIndex++}`;
      params.push(req.user.id);
    }

    if (status) {
      where += ` AND COALESCE(status, 'published') = $${paramIndex++}`;
      params.push(status);
    }

    if (search && search.trim().length >= 2) {
      where += ` AND name ILIKE $${paramIndex++}`;
      params.push(`%${search.trim()}%`);
    }

    const countResult = await pool.query(`SELECT COUNT(*) FROM actors ${where}`, params);
    const result = await pool.query(
      `SELECT * FROM actors ${where}
       ORDER BY name ASC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, pageSize, offset]
    );

    res.json({
      actors: result.rows,
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

// GET all actors with pagination
const getAllActors = async (req, res) => {
  try {
    await ensureActorManagementColumns();
    const { page = 1, limit = 12, search } = req.query;
    const currentPage = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 100);
    const offset = (currentPage - 1) * pageSize;

    let query = `SELECT * FROM actors WHERE COALESCE(status, 'published') = 'published'`;
    const params = [];

    if (search) {
      query += ` AND name ILIKE $1`;
      params.push(`%${search}%`);
    }

    const limitParamIndex = params.length + 1;
    query += ` ORDER BY name ASC LIMIT $${limitParamIndex} OFFSET $${limitParamIndex + 1}`;

    const result = await pool.query(query, [...params, pageSize, offset]);

    let countQuery = `SELECT COUNT(*) FROM actors WHERE COALESCE(status, 'published') = 'published'`;
    const countResult = await pool.query(
      countQuery + (search ? ` AND name ILIKE $1` : ''),
      params
    );

    res.json({
      actors: result.rows,
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

// GET actor by slug with filmography
const getActorBySlug = async (req, res) => {
  try {
    await ensureActorManagementColumns();
    const { slug } = req.params;

    const result = await pool.query(
      `SELECT * FROM actors WHERE slug = $1 AND COALESCE(status, 'published') = 'published'`,
      [slug]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Actor not found' });
    }

    const actor = result.rows[0];

    // Get filmography
    const filmsResult = await pool.query(
      `SELECT f.id, f.title, f.slug, f.poster_url, f.year, f.average_rating
       FROM films f
       JOIN film_actors fa ON f.id = fa.film_id
       WHERE fa.actor_id = $1 AND f.status = 'published'
       ORDER BY f.year DESC`,
      [actor.id]
    );

    // Get best films (by rating)
    const bestFilmsResult = await pool.query(
      `SELECT f.id, f.title, f.slug, f.poster_url, f.year, f.average_rating
       FROM films f
       JOIN film_actors fa ON f.id = fa.film_id
       WHERE fa.actor_id = $1 AND f.status = 'published'
       ORDER BY f.average_rating DESC
       LIMIT 5`,
      [actor.id]
    );

    res.json({
      ...actor,
      filmography: filmsResult.rows,
      best_films: bestFilmsResult.rows,
      film_count: filmsResult.rows.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// CREATE actor (editor/admin only)
const createActor = async (req, res) => {
  try {
    await ensureActorManagementColumns();
    const validation = validatePayload(schemas.actor, req.body);
    if (validation.error) {
      return res.status(400).json({ error: validation.error });
    }
    const { name, biography, birth_date, photo_url } = validation.value;

    const uniqueError = await assertUniqueActorName({ name });
    if (uniqueError) {
      return res.status(409).json({ error: uniqueError });
    }

    // Generate slug
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const result = await pool.query(
      `INSERT INTO actors (name, slug, biography, birth_date, photo_url, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, slug, biography, birth_date, photo_url, req.user.id]
    );

    res.status(201).json({ message: 'Actor created successfully', actor: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'An actor with this name already exists' });
    }
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE actor (editor/admin only)
const updateActor = async (req, res) => {
  try {
    await ensureActorManagementColumns();
    const { id } = req.params;
    const validation = validatePayload(schemas.actorUpdate, req.body);
    if (validation.error) {
      return res.status(400).json({ error: validation.error });
    }
    const { name, biography, birth_date, photo_url } = validation.value;

    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (name !== undefined) {
      const uniqueError = await assertUniqueActorName({ name, excludeId: id });
      if (uniqueError) {
        return res.status(409).json({ error: uniqueError });
      }
      updateFields.push(`name = $${paramIndex++}`);
      updateValues.push(name);
    }
    if (biography !== undefined) {
      updateFields.push(`biography = $${paramIndex++}`);
      updateValues.push(biography);
    }
    if (birth_date !== undefined) {
      updateFields.push(`birth_date = $${paramIndex++}`);
      updateValues.push(birth_date);
    }
    if (photo_url !== undefined) {
      updateFields.push(`photo_url = $${paramIndex++}`);
      updateValues.push(photo_url);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updateFields.length === 1) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(id);
    let query = `UPDATE actors SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`;
    if (req.user.role === 'editor') {
      updateValues.push(req.user.id);
      query += ` AND created_by = $${paramIndex + 1}`;
    }
    query += ' RETURNING *';

    const result = await pool.query(query, updateValues);

    if (!result.rows.length) {
      return res.status(req.user.role === 'editor' ? 403 : 404).json({
        error: req.user.role === 'editor'
          ? 'Access denied. Editors can only update their own actors'
          : 'Actor not found'
      });
    }

    res.json({ message: 'Actor updated successfully', actor: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Un acteur avec ce nom existe déjà.' });
    }
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE actor (archive)
const deleteActor = async (req, res) => {
  try {
    await ensureActorManagementColumns();
    const { id } = req.params;

    const params = ['archived', id];
    let query = 'UPDATE actors SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2';
    if (req.user.role === 'editor') {
      params.push(req.user.id);
      query += ' AND created_by = $3';
    }
    query += ' RETURNING *';

    const result = await pool.query(query, params);

    if (!result.rows.length) {
      return res.status(req.user.role === 'editor' ? 403 : 404).json({
        error: req.user.role === 'editor'
          ? 'Access denied. Editors can only archive their own actors'
          : 'Actor not found'
      });
    }

    res.json({ message: 'Actor archived successfully', actor: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

const restoreActor = async (req, res) => {
  try {
    await ensureActorManagementColumns();
    const { id } = req.params;

    const params = ['published', id];
    let query = 'UPDATE actors SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2';
    if (req.user.role === 'editor') {
      params.push(req.user.id);
      query += ' AND created_by = $3';
    }
    query += ' RETURNING *';

    const result = await pool.query(query, params);

    if (!result.rows.length) {
      return res.status(req.user.role === 'editor' ? 403 : 404).json({
        error: req.user.role === 'editor'
          ? 'Access denied. Editors can only restore their own actors'
          : 'Actor not found'
      });
    }

    res.json({ message: 'Actor restored successfully', actor: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getManageableActors,
  getAllActors,
  getActorBySlug,
  createActor,
  updateActor,
  deleteActor,
  restoreActor
};
