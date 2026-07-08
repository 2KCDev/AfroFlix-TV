const express = require('express');
const router = express.Router();
const filmsController = require('../controllers/filmsController');
const { authMiddleware, editorOrAdmin } = require('../middleware/auth');

// Public routes
router.get('/', filmsController.getAllFilms);
router.get('/trending', filmsController.getTrendingFilms);
router.get('/search', filmsController.search);
router.get('/directors/list', authMiddleware, editorOrAdmin, filmsController.getDirectors);
router.get('/manage/list', authMiddleware, editorOrAdmin, filmsController.getManageableFilms);
router.get('/:slug', filmsController.getFilmBySlug);
router.post('/:id/views', filmsController.recordView);
router.post('/:id/vues', filmsController.recordView);

// Protected routes (Editor or Admin)
router.post('/', authMiddleware, editorOrAdmin, filmsController.createFilm);
router.put('/:id', authMiddleware, editorOrAdmin, filmsController.updateFilm);

router.delete('/:id', authMiddleware, editorOrAdmin, filmsController.deleteFilm);

module.exports = router;
