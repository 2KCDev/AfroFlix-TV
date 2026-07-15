const express = require('express');
const router = express.Router();
const actorsController = require('../controllers/actorsController');
const { authMiddleware, editorOrAdmin } = require('../middleware/auth');

// Public routes
router.get('/', actorsController.getAllActors);
router.get('/manage/list', authMiddleware, editorOrAdmin, actorsController.getManageableActors);
router.get('/:slug', actorsController.getActorBySlug);

// Protected routes (editor/admin)
router.post('/', authMiddleware, editorOrAdmin, actorsController.createActor);
router.put('/:id', authMiddleware, editorOrAdmin, actorsController.updateActor);
router.put('/:id/restore', authMiddleware, editorOrAdmin, actorsController.restoreActor);

router.delete('/:id', authMiddleware, editorOrAdmin, actorsController.deleteActor);

module.exports = router;
