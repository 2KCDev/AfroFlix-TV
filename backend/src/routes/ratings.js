const express = require('express');
const router = express.Router();
const ratingsController = require('../controllers/ratingsController');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

// Public routes
router.get('/:film_id/stats', ratingsController.getFilmRatings);
router.get('/:film_id/user', optionalAuth, ratingsController.getUserRating);

// Public route with optional user identity. Guests are limited by IP.
router.post('/:film_id', optionalAuth, ratingsController.rateFilm);

module.exports = router;
