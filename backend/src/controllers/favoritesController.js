const pool = require('../db/pool');

// GET user's favorite films
const getFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT f.*,
              MAX(fav.created_at) AS favorited_at,
              COALESCE(
                json_agg(DISTINCT jsonb_build_object('id', g.id, 'name', g.name, 'slug', g.slug))
                  FILTER (WHERE g.id IS NOT NULL),
                '[]'
              ) AS genres
       FROM favorites fav
       JOIN films f ON fav.film_id = f.id
       LEFT JOIN film_genres fg ON f.id = fg.film_id
       LEFT JOIN genres g ON fg.genre_id = g.id
       WHERE fav.user_id = $1 AND f.status = 'published'
       GROUP BY f.id
       ORDER BY favorited_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*)
       FROM favorites fav
       JOIN films f ON fav.film_id = f.id
       WHERE fav.user_id = $1 AND f.status = 'published'`,
      [userId]
    );

    res.json({
      films: result.rows,
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

// ADD film to favorites
const addFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { film_id } = req.params;

    // Check if film exists
    const filmCheck = await pool.query('SELECT id FROM films WHERE id = $1', [film_id]);
    if (!filmCheck.rows.length) {
      return res.status(404).json({ error: 'Film not found' });
    }

    const result = await pool.query(
      `INSERT INTO favorites (user_id, film_id) VALUES ($1, $2) RETURNING *`,
      [userId, film_id]
    );

    res.status(201).json({ message: 'Film added to favorites', favorite: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Film is already in your favorites' });
    }
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// REMOVE film from favorites
const removeFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { film_id } = req.params;

    const result = await pool.query(
      `DELETE FROM favorites WHERE user_id = $1 AND film_id = $2 RETURNING *`,
      [userId, film_id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    res.json({ message: 'Film removed from favorites' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// CHECK if film is in user's favorites
const isFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { film_id } = req.params;

    const result = await pool.query(
      `SELECT EXISTS(SELECT 1 FROM favorites WHERE user_id = $1 AND film_id = $2) as is_favorite`,
      [userId, film_id]
    );

    res.json({ is_favorite: result.rows[0].is_favorite });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getFavorites,
  addFavorite,
  removeFavorite,
  isFavorite
};
