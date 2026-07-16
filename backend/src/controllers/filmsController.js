const pool = require('../db/pool');
const { deleteReplacedManagedImage } = require('../services/cloudinaryService');
const { parsePositiveInt, schemas, validatePayload } = require('../utils/validation');

const slugify = (value = '') => value
  .toString()
  .trim()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const MAX_FILM_SLUG_LENGTH = 30;

const normalizeFilmSlug = (value = '') => slugify(value).slice(0, MAX_FILM_SLUG_LENGTH).replace(/-+$/g, '');

const normalizeOptionalUrl = (value) => {
  const clean = String(value || '').trim();
  return clean || null;
};

let filmConstraintsMigration;
const ensureFilmConstraints = () => {
  if (!filmConstraintsMigration) {
    filmConstraintsMigration = pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_films_youtube_embed_url_unique
        ON films (youtube_embed_url)
        WHERE youtube_embed_url IS NOT NULL AND youtube_embed_url <> '';
      CREATE UNIQUE INDEX IF NOT EXISTS idx_films_slug_unique
        ON films (slug);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_actors_name_unique_lower
        ON actors (LOWER(name));
    `).catch((err) => {
      console.warn('Film uniqueness indexes were not fully applied:', err.message);
    });
  }
  return filmConstraintsMigration;
};

const assertUniqueFilmFields = async ({ slug, youtube_embed_url, excludeId = null }) => {
  const checks = [];
  const params = [];

  if (slug) {
    params.push(slug);
    checks.push(`slug = $${params.length}`);
  }

  if (youtube_embed_url) {
    params.push(youtube_embed_url);
    checks.push(`youtube_embed_url = $${params.length}`);
  }

  if (!checks.length) return null;

  let query = `SELECT slug, youtube_embed_url FROM films WHERE (${checks.join(' OR ')})`;
  if (excludeId) {
    params.push(excludeId);
    query += ` AND id <> $${params.length}`;
  }

  const result = await pool.query(query, params);
  if (!result.rows.length) return null;

  const existing = result.rows[0];
  if (slug && existing.slug === slug) {
    return 'Ce nom d’URL de film existe déjà. Choisissez un libellé unique.';
  }
  if (youtube_embed_url && existing.youtube_embed_url === youtube_embed_url) {
    return 'Cette URL YouTube est déjà utilisée par un autre film.';
  }
  return 'Ce film contient déjà une valeur unique existante.';
};

const enrichFilms = async (films) => {
  if (!films.length) return [];

  const filmIds = films.map((film) => film.id);
  const [genresResult, actorsResult] = await Promise.all([
    pool.query(
      `SELECT fg.film_id, g.id, g.name, g.slug
       FROM film_genres fg
       JOIN genres g ON g.id = fg.genre_id
       WHERE fg.film_id = ANY($1::int[])
       ORDER BY g.name ASC`,
      [filmIds]
    ),
    pool.query(
      `SELECT fa.film_id, a.id, a.name, a.slug, fa.character_name
       FROM film_actors fa
       JOIN actors a ON a.id = fa.actor_id
       WHERE fa.film_id = ANY($1::int[])
       ORDER BY a.name ASC`,
      [filmIds]
    ),
  ]);

  const genresByFilm = new Map();
  const actorsByFilm = new Map();

  for (const row of genresResult.rows) {
    const genres = genresByFilm.get(row.film_id) || [];
    genres.push({ id: row.id, name: row.name, slug: row.slug });
    genresByFilm.set(row.film_id, genres);
  }

  for (const row of actorsResult.rows) {
    const actors = actorsByFilm.get(row.film_id) || [];
    actors.push({
      id: row.id,
      name: row.name,
      slug: row.slug,
      character_name: row.character_name,
    });
    actorsByFilm.set(row.film_id, actors);
  }

  return films.map((film) => ({
    ...film,
    genres: genresByFilm.get(film.id) || [],
    actors: actorsByFilm.get(film.id) || [],
  }));
};

const normalizeActorIds = (actors = []) => [...new Set(
  actors
    .map((actor) => parseInt(actor, 10))
    .filter((actorId) => Number.isInteger(actorId) && actorId > 0)
)];

const replaceFilmActors = async (filmId, actors = []) => {
  const actorIds = normalizeActorIds(actors);
  await pool.query('DELETE FROM film_actors WHERE film_id = $1', [filmId]);

  for (const actorId of actorIds) {
    await pool.query(
      `INSERT INTO film_actors (film_id, actor_id)
       SELECT $1, id FROM actors WHERE id = $2
       ON CONFLICT DO NOTHING`,
      [filmId, actorId]
    );
  }
};

const appendFilmKeywordSearch = ({ query, countQuery, params, paramIndex, q }) => {
  if (!q || q.trim().length < 2) {
    return { query, countQuery, paramIndex };
  }

  const clause = ` AND (
    title ILIKE $${paramIndex}
    OR description ILIKE $${paramIndex}
    OR director ILIKE $${paramIndex}
    OR country ILIKE $${paramIndex}
    OR id IN (
      SELECT fg.film_id FROM film_genres fg
      JOIN genres g ON fg.genre_id = g.id
      WHERE g.name ILIKE $${paramIndex} OR g.slug ILIKE $${paramIndex}
    )
    OR id IN (
      SELECT fa.film_id FROM film_actors fa
      JOIN actors a ON fa.actor_id = a.id
      WHERE a.name ILIKE $${paramIndex}
    )
  )`;

  params.push(`%${q.trim()}%`);
  return {
    query: query + clause,
    countQuery: countQuery + clause,
    paramIndex: paramIndex + 1
  };
};

// GET manageable films for admin/editor spaces.
const getManageableFilms = async (req, res) => {
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
        OR description ILIKE $${paramIndex}
        OR director ILIKE $${paramIndex}
        OR country ILIKE $${paramIndex}
        OR id IN (
          SELECT fg.film_id FROM film_genres fg
          JOIN genres g ON fg.genre_id = g.id
          WHERE g.name ILIKE $${paramIndex} OR g.slug ILIKE $${paramIndex}
        )
        OR id IN (
          SELECT fa.film_id FROM film_actors fa
          JOIN actors a ON fa.actor_id = a.id
          WHERE a.name ILIKE $${paramIndex}
        )
      )`;
      params.push(`%${q.trim()}%`);
      paramIndex++;
    }

    const countResult = await pool.query(`SELECT COUNT(*) FROM films ${where}`, params);

    const result = await pool.query(
      `SELECT * FROM films ${where}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, pageSize, offset]
    );

    res.json({
      data: await enrichFilms(result.rows),
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

// GET directors already used in published/admin film records.
const getDirectors = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT director
       FROM films
       WHERE director IS NOT NULL AND BTRIM(director) <> ''
       ORDER BY director ASC
       LIMIT 500`
    );

    res.json({ directors: result.rows.map((row) => row.director) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// GET all films with pagination, filtering, and sorting
const getAllFilms = async (req, res) => {
  try {
    const { page = 1, limit = 12, genre, year, q, sortBy = 'latest' } = req.query;
    const currentPage = parsePositiveInt(page, 1, { min: 1, max: 100000 });
    const pageSize = parsePositiveInt(limit, 12, { min: 1, max: 60 });
    const offset = (currentPage - 1) * pageSize;
    
    let query = 'SELECT * FROM films WHERE status = $1';
    let countQuery = 'SELECT COUNT(*) FROM films WHERE status = $1';
    const params = ['published'];
    let paramIndex = 2;

    // Apply filters
    if (genre) {
      query += ` AND id IN (
        SELECT fg.film_id FROM film_genres fg
        JOIN genres g ON fg.genre_id = g.id
        WHERE g.slug = $${paramIndex}
      )`;
      countQuery += ` AND id IN (
        SELECT fg.film_id FROM film_genres fg
        JOIN genres g ON fg.genre_id = g.id
        WHERE g.slug = $${paramIndex}
      )`;
      params.push(genre);
      paramIndex++;
    }

    if (year) {
      const parsedYear = Number.parseInt(year, 10);
      if (Number.isInteger(parsedYear) && parsedYear >= 1888 && parsedYear <= new Date().getFullYear() + 5) {
        query += ` AND year = $${paramIndex}`;
        countQuery += ` AND year = $${paramIndex}`;
        params.push(parsedYear);
        paramIndex++;
      }
    }

    ({ query, countQuery, paramIndex } = appendFilmKeywordSearch({
      query,
      countQuery,
      params,
      paramIndex,
      q
    }));

    // Apply sorting
    switch (sortBy) {
      case 'trending':
        query += ' ORDER BY (views + average_rating * 10) DESC';
        break;
      case 'popular':
        query += ' ORDER BY views DESC';
        break;
      case 'rated':
      case 'rating':
        query += ' ORDER BY average_rating DESC';
        break;
      case 'title':
        query += ' ORDER BY title ASC';
        break;
      case 'oldest':
        query += ' ORDER BY year ASC';
        break;
      case 'latest':
      default:
        query += ' ORDER BY created_at DESC';
    }

    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(pageSize, offset);

    // Get total count
    const countResult = await pool.query(countQuery, params.slice(0, -2));
    const total = parseInt(countResult.rows[0].count);

    // Get films
    const result = await pool.query(query, params);
    
    // Enrich films with genres and actors
    const filmsEnriched = await enrichFilms(result.rows);

    res.json({
      data: filmsEnriched,
      pagination: {
        total,
        page: currentPage,
        limit: pageSize,
        pages: Math.ceil(total / pageSize)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// GET trending films (calculated automatically)
const getTrendingFilms = async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    const pageSize = parsePositiveInt(limit, 6, { min: 1, max: 24 });
    const result = await pool.query(
      `SELECT * FROM films 
       WHERE status = $1
       ORDER BY (views + average_rating * 10 + (
         SELECT COUNT(*) FROM comments WHERE film_id = films.id AND status = 'published'
       )) DESC
       LIMIT $2`,
      ['published', pageSize]
    );

    const filmsEnriched = await enrichFilms(result.rows);

    res.json(filmsEnriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// GET film by slug (detail page)
const getFilmBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const result = await pool.query('SELECT * FROM films WHERE slug = $1', [slug]);
    
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Film not found' });
    }

    const film = result.rows[0];

    // Get genres
    const genresResult = await pool.query(
      `SELECT g.id, g.name, g.slug FROM genres g
       JOIN film_genres fg ON g.id = fg.genre_id
       WHERE fg.film_id = $1`,
      [film.id]
    );

    // Get actors
    const actorsResult = await pool.query(
      `SELECT a.id, a.name, a.slug, fa.character_name FROM actors a
       JOIN film_actors fa ON a.id = fa.actor_id
       WHERE fa.film_id = $1`,
      [film.id]
    );

    // Get all similar films; the frontend decides how many are visible at first.
    const similarResult = await pool.query(
      `SELECT f.*, COUNT(fg.genre_id) AS similarity_score FROM films f
       JOIN film_genres fg ON f.id = fg.film_id
       WHERE fg.genre_id IN (
         SELECT genre_id FROM film_genres WHERE film_id = $1
       ) AND f.id != $1 AND f.status = 'published'
       GROUP BY f.id
       ORDER BY similarity_score DESC, f.average_rating DESC NULLS LAST, f.views DESC, f.created_at DESC`,
      [film.id]
    );

    // Get rating stats
    const ratingResult = await pool.query(
      `SELECT 
        COUNT(*) as vote_count,
        AVG(rating_value)::DECIMAL(3,2) as average,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY rating_value) as median
       FROM ratings WHERE film_id = $1`,
      [film.id]
    );

    // Get comments count
    const commentsResult = await pool.query(
      `SELECT COUNT(*) FROM comments WHERE film_id = $1 AND status = 'published'`,
      [film.id]
    );

    res.json({
      ...film,
      genres: genresResult.rows,
      actors: actorsResult.rows,
      similar_films: similarResult.rows,
      stats: {
        rating_count: parseInt(ratingResult.rows[0].vote_count),
        average_rating: parseFloat(ratingResult.rows[0].average) || 0,
        comments_count: parseInt(commentsResult.rows[0].count)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// CREATE film (admin/editor only)
const createFilm = async (req, res) => {
  try {
    await ensureFilmConstraints();
    const validation = validatePayload(schemas.film, req.body);
    if (validation.error) {
      return res.status(400).json({ error: validation.error });
    }
    const { title, slug: requestedSlug, description, poster_url, director, country, year, duration, youtube_embed_url, genres = [], actors = [] } = validation.value;

    const slug = normalizeFilmSlug(requestedSlug || title);
    if (!slug) {
      return res.status(400).json({ error: 'Le nom d’URL du film est obligatoire.' });
    }
    if (slug.length > MAX_FILM_SLUG_LENGTH) {
      return res.status(400).json({ error: 'Le nom d’URL du film doit contenir 30 caractères maximum.' });
    }

    const cleanYoutubeUrl = normalizeOptionalUrl(youtube_embed_url);
    const uniqueError = await assertUniqueFilmFields({ slug, youtube_embed_url: cleanYoutubeUrl });
    if (uniqueError) {
      return res.status(409).json({ error: uniqueError });
    }

    const result = await pool.query(
      `INSERT INTO films (title, slug, description, poster_url, director, country, year, duration, youtube_embed_url, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [title, slug, description, poster_url, director, country, year, duration, cleanYoutubeUrl, req.user.id]
    );

    const film = result.rows[0];

    // Add genres if provided
    if (genres.length > 0) {
      for (const genreSlug of genres) {
        await pool.query(
          `INSERT INTO film_genres (film_id, genre_id)
           SELECT $1, id FROM genres WHERE slug = $2
           ON CONFLICT DO NOTHING`,
          [film.id, genreSlug]
        );
      }
    }

    if (actors.length > 0) {
      await replaceFilmActors(film.id, actors);
    }

    res.status(201).json({ 
      message: 'Film created successfully', 
      film 
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A film with this slug already exists' });
    }
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE film (admin/editor only)
const updateFilm = async (req, res) => {
  try {
    await ensureFilmConstraints();
    const { id } = req.params;
    const validation = validatePayload(schemas.filmUpdate, req.body);
    if (validation.error) {
      return res.status(400).json({ error: validation.error });
    }
    const { title, slug: requestedSlug, description, poster_url, director, country, year, duration, youtube_embed_url, status, genres, actors } = validation.value;

    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;
    const previousImageResult = poster_url !== undefined
      ? await pool.query('SELECT poster_url FROM films WHERE id = $1', [id])
      : null;

    if (title !== undefined) {
      updateFields.push(`title = $${paramIndex++}`);
      updateValues.push(title);
    }
    if (requestedSlug !== undefined) {
      const slug = normalizeFilmSlug(requestedSlug);
      if (!slug) {
        return res.status(400).json({ error: 'Le nom d’URL du film est obligatoire.' });
      }
      if (slug.length > MAX_FILM_SLUG_LENGTH) {
        return res.status(400).json({ error: 'Le nom d’URL du film doit contenir 30 caractères maximum.' });
      }
      const uniqueError = await assertUniqueFilmFields({ slug, excludeId: id });
      if (uniqueError) {
        return res.status(409).json({ error: uniqueError });
      }
      updateFields.push(`slug = $${paramIndex++}`);
      updateValues.push(slug);
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      updateValues.push(description);
    }
    if (poster_url !== undefined) {
      updateFields.push(`poster_url = $${paramIndex++}`);
      updateValues.push(poster_url);
    }
    if (director !== undefined) {
      updateFields.push(`director = $${paramIndex++}`);
      updateValues.push(director);
    }
    if (country !== undefined) {
      updateFields.push(`country = $${paramIndex++}`);
      updateValues.push(country);
    }
    if (year !== undefined) {
      updateFields.push(`year = $${paramIndex++}`);
      updateValues.push(year);
    }
    if (duration !== undefined) {
      updateFields.push(`duration = $${paramIndex++}`);
      updateValues.push(duration);
    }
    if (youtube_embed_url !== undefined) {
      const cleanYoutubeUrl = normalizeOptionalUrl(youtube_embed_url);
      const uniqueError = await assertUniqueFilmFields({ youtube_embed_url: cleanYoutubeUrl, excludeId: id });
      if (uniqueError) {
        return res.status(409).json({ error: uniqueError });
      }
      updateFields.push(`youtube_embed_url = $${paramIndex++}`);
      updateValues.push(cleanYoutubeUrl);
    }
    if (status !== undefined && ['published', 'draft', 'archived'].includes(status)) {
      updateFields.push(`status = $${paramIndex++}`);
      updateValues.push(status);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updateFields.length === 1 && !Array.isArray(genres) && !Array.isArray(actors)) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(id);
    let query = `UPDATE films SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`;
    if (req.user.role === 'editor') {
      updateValues.push(req.user.id);
      query += ` AND created_by = $${paramIndex + 1}`;
    }
    query += ' RETURNING *';
    
    const result = await pool.query(query, updateValues);

    if (!result.rows.length) {
      return res.status(req.user.role === 'editor' ? 403 : 404).json({
        error: req.user.role === 'editor'
          ? 'Access denied. Editors can only update their own films'
          : 'Film not found'
      });
    }

    // Update genres if provided
    if (Array.isArray(genres)) {
      await pool.query('DELETE FROM film_genres WHERE film_id = $1', [id]);
      for (const genreSlug of genres) {
        await pool.query(
          `INSERT INTO film_genres (film_id, genre_id)
           SELECT $1, id FROM genres WHERE slug = $2`,
          [id, genreSlug]
        );
      }
    }

    if (Array.isArray(actors)) {
      await replaceFilmActors(id, actors);
    }

    if (poster_url !== undefined) {
      await deleteReplacedManagedImage(previousImageResult?.rows[0]?.poster_url, result.rows[0].poster_url);
    }

    res.json({ message: 'Film updated successfully', film: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A film with this slug already exists' });
    }
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE film (admin only) - soft delete (archive)
const deleteFilm = async (req, res) => {
  try {
    const { id } = req.params;
    const params = ['archived', id];
    let query = 'UPDATE films SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2';
    if (req.user.role === 'editor') {
      params.push(req.user.id);
      query += ' AND created_by = $3';
    }
    query += ' RETURNING *';

    const result = await pool.query(query, params);

    if (!result.rows.length) {
      return res.status(req.user.role === 'editor' ? 403 : 404).json({
        error: req.user.role === 'editor'
          ? 'Access denied. Editors can only archive their own films'
          : 'Film not found'
      });
    }

    res.json({ message: 'Film archived successfully', film: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// RECORD VIEW with anti-fraud (1 view per IP per 24 hours)
const recordView = async (req, res) => {
  try {
    const { id } = req.params;
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Check if this IP viewed this film in last 24 hours
    const existingView = await pool.query(
      `SELECT * FROM views WHERE film_id = $1 AND ip_address = $2 AND timestamp > $3`,
      [id, ip, twentyFourHoursAgo]
    );

    if (existingView.rows.length > 0) {
      return res.status(200).json({ message: 'View already counted in last 24 hours' });
    }

    // Record new view
    await pool.query(
      `INSERT INTO views (film_id, ip_address) VALUES ($1, $2)`,
      [id, ip]
    );

    // Increment views counter
    const result = await pool.query(
      `UPDATE films SET views = views + 1 WHERE id = $1 RETURNING views`,
      [id]
    );

    res.json({ message: 'View recorded', views: result.rows[0].views });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// SEARCH films and actors
const search = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    
    if (!q || q.length < 2 || q.length > 100) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const searchTerm = `%${q.trim()}%`;

    // Search films
    const filmsResult = await pool.query(
      `SELECT id, title, slug, poster_url, description FROM films 
       WHERE status = 'published' AND (
         title ILIKE $1
         OR description ILIKE $1
         OR director ILIKE $1
         OR country ILIKE $1
         OR id IN (
           SELECT fg.film_id FROM film_genres fg
           JOIN genres g ON fg.genre_id = g.id
           WHERE g.name ILIKE $1 OR g.slug ILIKE $1
         )
         OR id IN (
           SELECT fa.film_id FROM film_actors fa
           JOIN actors a ON fa.actor_id = a.id
           WHERE a.name ILIKE $1
         )
       )
       LIMIT 10`,
      [searchTerm]
    );

    // Search actors
    const actorsResult = await pool.query(
      `SELECT a.id, a.name, a.slug, a.photo_url, a.biography,
        (
          SELECT COUNT(*)
          FROM film_actors fa
          JOIN films f ON f.id = fa.film_id
          WHERE fa.actor_id = a.id AND f.status = 'published'
        )::int AS film_count
       FROM actors a
       WHERE COALESCE(a.status, 'published') = 'published'
         AND a.name ILIKE $1
       LIMIT 10`,
      [searchTerm]
    );

    const articlesResult = await pool.query(
      `SELECT id, title, slug, category, content FROM articles
       WHERE status = 'published' AND (
         title ILIKE $1 OR content ILIKE $1 OR category ILIKE $1
       )
       LIMIT 10`,
      [searchTerm]
    );

    res.json({
      films: filmsResult.rows,
      actors: actorsResult.rows,
      articles: articlesResult.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getManageableFilms,
  getDirectors,
  getAllFilms,
  getTrendingFilms,
  getFilmBySlug,
  createFilm,
  updateFilm,
  deleteFilm,
  recordView,
  search
};
