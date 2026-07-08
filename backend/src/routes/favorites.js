const express = require('express');
const router = express.Router();
const favoritesController = require('../controllers/favoritesController');
const { authMiddleware } = require('../middleware/auth');

// All favorites routes require authentication
router.use(authMiddleware);

router.get('/', favoritesController.getFavorites);
router.post('/:film_id', favoritesController.addFavorite);
router.delete('/:film_id', favoritesController.removeFavorite);
router.get('/:film_id/is-favorite', favoritesController.isFavorite);

module.exports = router;
