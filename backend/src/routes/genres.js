const express = require('express');
const router = express.Router();
const genresController = require('../controllers/genresController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// Public routes
router.get('/', genresController.getAllGenres);
router.get('/:slug/films', genresController.getFilmsByGenre);

// Admin routes
router.post('/', authMiddleware, adminOnly, genresController.createGenre);
router.put('/:id', authMiddleware, adminOnly, genresController.updateGenre);
router.delete('/:id', authMiddleware, adminOnly, genresController.deleteGenre);

module.exports = router;
