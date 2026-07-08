const express = require('express');
const router = express.Router();
const commentsController = require('../controllers/commentsController');
const { authMiddleware, optionalAuth, moderatorOrAdmin } = require('../middleware/auth');

// Public routes
router.get('/moderation/queue', authMiddleware, moderatorOrAdmin, commentsController.getModerationQueue);
router.post('/:film_id/comment', optionalAuth, commentsController.createComment);
router.get('/:film_id', commentsController.getFilmComments);
router.post('/:id/report', optionalAuth, commentsController.reportComment);

// Moderator/Admin routes
router.put('/:id/approve', authMiddleware, moderatorOrAdmin, commentsController.approveComment);
router.put('/:id/reject', authMiddleware, moderatorOrAdmin, commentsController.rejectComment);

module.exports = router;
