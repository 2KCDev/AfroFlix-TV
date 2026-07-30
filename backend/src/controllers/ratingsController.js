const pool = require('../db/pool');

// POST a rating (1-5 stars)
const rateFilm = async (req, res) => {
  try {
    const { film_id } = req.params;
    const ratingValue = Number.parseInt(req.body.rating_value, 10);
    const userId = req.user?.id;
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';

    // Validation
    if (!Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const client = await pool.connect();
    let result;
    try {
      await client.query('BEGIN');
      // Locking the film row serializes its counters without scanning every
      // historical vote (which becomes very expensive as ratings grow).
      const filmCheck = await client.query(
        'SELECT id FROM films WHERE id = $1 FOR UPDATE',
        [film_id]
      );
      if (!filmCheck.rows.length) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Film not found' });
      }

      const existingRating = userId
        ? await client.query(
          `SELECT id FROM ratings WHERE film_id = $1 AND user_id = $2 ORDER BY created_at DESC LIMIT 1`,
          [film_id, userId]
        )
        : await client.query(
          `SELECT id FROM ratings
           WHERE film_id = $1 AND user_id IS NULL AND ip_address = $2
           ORDER BY created_at DESC LIMIT 1`,
          [film_id, ip]
        );
      if (existingRating.rows.length) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'You have already rated this film' });
      }

      result = await client.query(
        `INSERT INTO ratings (film_id, user_id, rating_value, ip_address)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [film_id, userId, ratingValue, ip]
      );
      await client.query(
        `UPDATE films
         SET rating_sum = rating_sum + $1,
             rating_count = rating_count + 1,
             average_rating = ROUND((rating_sum + $1)::numeric / (rating_count + 1), 2),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [ratingValue, film_id]
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      client.release();
    }

    res.status(201).json({
      message: 'Rating submitted successfully',
      rating: result.rows[0]
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'You have already rated this film' });
    }
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// GET rating stats for a film
const getFilmRatings = async (req, res) => {
  try {
    const { film_id } = req.params;

    // Check film exists
    const filmCheck = await pool.query('SELECT average_rating FROM films WHERE id = $1', [film_id]);
    if (!filmCheck.rows.length) {
      return res.status(404).json({ error: 'Film not found' });
    }

    // Get rating distribution
    const distribution = await pool.query(
      `SELECT rating_value, COUNT(*) as count 
       FROM ratings 
       WHERE film_id = $1 
       GROUP BY rating_value 
       ORDER BY rating_value DESC`,
      [film_id]
    );

    const stats = await pool.query(
      `SELECT 
        COUNT(*) as total_ratings,
        AVG(rating_value)::DECIMAL(3,2) as average_rating,
        MIN(rating_value) as min_rating,
        MAX(rating_value) as max_rating,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY rating_value) as median_rating
       FROM ratings 
       WHERE film_id = $1`,
      [film_id]
    );

    res.json({
      stats: stats.rows[0],
      distribution: distribution.rows,
      average: filmCheck.rows[0].average_rating
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// GET user rating for a film
const getUserRating = async (req, res) => {
  try {
    const { film_id } = req.params;
    const userId = req.user?.id;
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const result = userId
      ? await pool.query(
        `SELECT * FROM ratings WHERE film_id = $1 AND user_id = $2 ORDER BY created_at DESC LIMIT 1`,
        [film_id, userId]
      )
      : await pool.query(
        `SELECT * FROM ratings
         WHERE film_id = $1 AND user_id IS NULL AND ip_address = $2
         ORDER BY created_at DESC LIMIT 1`,
        [film_id, ip]
      );

    if (!result.rows.length) {
      return res.status(404).json({ message: 'No rating found', rating: null });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  rateFilm,
  getFilmRatings,
  getUserRating
};
