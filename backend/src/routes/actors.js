const express = require('express');
const router = express.Router();
const actorsController = require('../controllers/actorsController');
const { authMiddleware, editorOrAdmin } = require('../middleware/auth');

// Public routes
router.get('/', actorsController.getAllActors);
router.get('/:slug', actorsController.getActorBySlug);

// Protected routes (editor/admin)
router.post('/', authMiddleware, editorOrAdmin, actorsController.createActor);
router.put('/:id', authMiddleware, editorOrAdmin, actorsController.updateActor);

router.delete('/:id', authMiddleware, editorOrAdmin, actorsController.deleteActor);

module.exports = router;
