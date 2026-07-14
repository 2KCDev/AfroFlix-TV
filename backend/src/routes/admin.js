const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware, adminOnly, editorOrAdmin } = require('../middleware/auth');

// All admin routes require authentication. Each route then declares its role scope.
router.use(authMiddleware);

// Dashboard
router.get('/stats', editorOrAdmin, adminController.getDashboardStats);
router.get('/email/status', adminOnly, adminController.getEmailDiagnostics);
router.get('/email/queue', adminOnly, adminController.getEmailQueue);
router.post('/email/test', adminOnly, adminController.sendEmailDiagnostic);

// User management
router.get('/users', adminOnly, adminController.getAllUsers);
router.post('/users', adminOnly, adminController.createUser);
router.put('/users/:id', adminOnly, adminController.updateUser);
router.put('/users/:id/role', adminOnly, adminController.updateUserRole);
router.delete('/users/:id', adminOnly, adminController.deleteUser);
router.put('/profile', adminOnly, adminController.updateOwnProfile);

module.exports = router;
