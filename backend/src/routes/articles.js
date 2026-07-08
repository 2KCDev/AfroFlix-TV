const express = require('express');
const router = express.Router();
const articlesController = require('../controllers/articlesController');
const { authMiddleware, editorOrAdmin } = require('../middleware/auth');

// Public routes
router.get('/', articlesController.getAllArticles);
router.get('/categories', articlesController.getCategories);
router.get('/manage/list', authMiddleware, editorOrAdmin, articlesController.getManageableArticles);
router.get('/:slug', articlesController.getArticleBySlug);

// Protected routes (editor/admin)
router.post('/', authMiddleware, editorOrAdmin, articlesController.createArticle);
router.put('/:id', authMiddleware, editorOrAdmin, articlesController.updateArticle);

router.delete('/:id', authMiddleware, editorOrAdmin, articlesController.deleteArticle);

module.exports = router;
