const jwt = require('jsonwebtoken');

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production' && (!secret || secret.length < 32 || secret === 'your-secret-key')) {
    throw new Error('JWT_SECRET must be configured with a strong secret in production.');
  }
  return secret || 'development-only-secret-change-me';
};

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (token) {
    try {
      const decoded = jwt.verify(token, getJwtSecret());
      req.user = decoded;
    } catch (err) {
      // Token invalid, continue as guest
    }
  }
  next();
};

// Role-based access control middleware
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access denied. Required roles: ${allowedRoles.join(', ')}` });
    }
    
    next();
  };
};

// Admin-only middleware
const adminOnly = requireRole(['admin']);

// Editor or Admin
const editorOrAdmin = requireRole(['editor', 'admin']);

// Moderator or Admin
const moderatorOrAdmin = requireRole(['moderator', 'admin']);

module.exports = { authMiddleware, optionalAuth, requireRole, adminOnly, editorOrAdmin, moderatorOrAdmin };
