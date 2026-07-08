const pool = require('../db/pool');

// GET all genres
const getAllGenres = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, slug, description FROM genres ORDER BY name',
      []
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// GET films by genre with pagination
const getFilmsByGenre = async (req, res) => {
  try {
    const { slug } = req.params;
    const { page = 1, limit = 12, sortBy = 'latest' } = req.query;
    const offset = (page - 1) * limit;

    // Get genre
    const genreResult = await pool.query('SELECT * FROM genres WHERE slug = $1', [slug]);
    if (!genreResult.rows.length) {
      return res.status(404).json({ error: 'Genre not found' });
    }

    const genre = genreResult.rows[0];

    // Build query
    let query = `SELECT DISTINCT f.* FROM films f
      JOIN film_genres fg ON f.id = fg.film_id
      JOIN genres g ON fg.genre_id = g.id
      WHERE g.slug = $1 AND f.status = $2`;
    
    let countQuery = `SELECT COUNT(DISTINCT f.id) FROM films f
      JOIN film_genres fg ON f.id = fg.film_id
      JOIN genres g ON fg.genre_id = g.id
      WHERE g.slug = $1 AND f.status = $2`;

    // Apply sorting
    switch (sortBy) {
      case 'popular':
        query += ' ORDER BY f.views DESC';
        break;
      case 'rated':
        query += ' ORDER BY f.average_rating DESC';
        break;
      case 'oldest':
        query += ' ORDER BY f.year ASC';
        break;
      case 'latest':
      default:
        query += ' ORDER BY f.created_at DESC';
    }

    query += ` LIMIT $3 OFFSET $4`;

    const result = await pool.query(query, [slug, 'published', limit, offset]);
    const countResult = await pool.query(countQuery, [slug, 'published']);

    // Enrich films with genres and actors
    const filmsEnriched = await Promise.all(result.rows.map(async (film) => {
      const genresResult = await pool.query(
        `SELECT g.id, g.name, g.slug FROM genres g
         JOIN film_genres fg ON g.id = fg.genre_id
         WHERE fg.film_id = $1`,
        [film.id]
      );
      
      return {
        ...film,
        genres: genresResult.rows
      };
    }));

    res.json({
      genre,
      films: filmsEnriched,
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

// CREATE genre (admin only)
const createGenre = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Genre name is required' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const result = await pool.query(
      'INSERT INTO genres (name, slug, description) VALUES ($1, $2, $3) RETURNING *',
      [name, slug, description]
    );

    res.status(201).json({ message: 'Genre created successfully', genre: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A genre with this name already exists' });
    }
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE genre (admin only)
const updateGenre = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Genre name is required' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const result = await pool.query(
      'UPDATE genres SET name = $1, slug = $2, description = $3 WHERE id = $4 RETURNING *',
      [name, slug, description, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Genre not found' });
    }

    res.json({ message: 'Genre updated successfully', genre: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE genre (admin only)
const deleteGenre = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM genres WHERE id = $1 RETURNING *',
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Genre not found' });
    }

    res.json({ message: 'Genre deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllGenres,
  getFilmsByGenre,
  createGenre,
  updateGenre,
  deleteGenre
};
