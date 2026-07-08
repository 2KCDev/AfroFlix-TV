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

    // Check if film exists
    const filmCheck = await pool.query('SELECT id, average_rating FROM films WHERE id = $1', [film_id]);
    if (!filmCheck.rows.length) {
      return res.status(404).json({ error: 'Film not found' });
    }

    const existingRating = userId
      ? await pool.query(
        `SELECT id FROM ratings WHERE film_id = $1 AND user_id = $2 ORDER BY created_at DESC LIMIT 1`,
        [film_id, userId]
      )
      : await pool.query(
        `SELECT id FROM ratings
         WHERE film_id = $1 AND user_id IS NULL AND ip_address = $2
         ORDER BY created_at DESC LIMIT 1`,
        [film_id, ip]
      );

    let result;
    if (existingRating.rows.length > 0) {
      return res.status(409).json({ error: 'You have already rated this film' });
    } else {
      result = await pool.query(
        `INSERT INTO ratings (film_id, user_id, rating_value, ip_address)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [film_id, userId, ratingValue, ip]
      );
    }

    // Update average rating
    const avgResult = await pool.query(
      `SELECT AVG(rating_value)::DECIMAL(3,2) as avg FROM ratings WHERE film_id = $1`,
      [film_id]
    );

    await pool.query(
      `UPDATE films SET average_rating = $1 WHERE id = $2`,
      [avgResult.rows[0].avg || 0, film_id]
    );

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
