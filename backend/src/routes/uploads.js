const express = require('express');
const multer = require('multer');
const { authMiddleware, editorOrAdmin } = require('../middleware/auth');
const { uploadImageBuffer } = require('../services/cloudinaryService');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype)) {
      return cb(new Error('Seules les images JPG, PNG, WebP ou GIF sont acceptées.'));
    }
    cb(null, true);
  },
});

const uploadImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Image requise' });
  }

  const type = ['film', 'actor', 'article', 'misc'].includes(req.body.type)
    ? req.body.type
    : 'misc';

  const result = await uploadImageBuffer({
    buffer: req.file.buffer,
    originalname: req.file.originalname,
    type,
  });

  res.status(201).json(result);
};

const handleMulterUpload = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      const message = err.code === 'LIMIT_FILE_SIZE'
        ? 'Image trop volumineuse. Taille maximum: 5 Mo.'
        : 'Image invalide.';
      return res.status(400).json({ error: message });
    }

    return res.status(400).json({ error: err.message || 'Image invalide.' });
  });
};

const handleImageUpload = (type) => async (req, res) => {
  try {
    if (type) req.body.type = type;
    await uploadImage(req, res);
  } catch (err) {
    console.error('Image upload failed:', err.message);
    res.status(502).json({
      error: 'Impossible d’uploader l’image pour le moment. Vérifiez la configuration Cloudinary ou collez une URL d’image valide.',
    });
  }
};

router.post('/image', authMiddleware, editorOrAdmin, handleMulterUpload, handleImageUpload());
router.post('/poster', authMiddleware, editorOrAdmin, handleMulterUpload, handleImageUpload('film'));

module.exports = router;
