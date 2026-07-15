const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const pool = require('./db/pool');
const { ensureDatabaseReady } = require('./db/init');
const { startEmailQueueWorker } = require('./services/emailService');

const app = express();
const PORT = process.env.PORT || 5000;

// Le backend est servi derrière Nginx dans Docker
app.set('trust proxy', 1);

// =========================
// Security
// =========================

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        fontSrc: ["'self'", 'https:', 'data:'],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
        frameSrc: [
          "'self'",
          'https://www.youtube.com',
          'https://www.youtube-nocookie.com',
        ],
        imgSrc: ["'self'", 'https:', 'data:'],
        mediaSrc: ["'self'", 'https:'],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'"],
        scriptSrcAttr: ["'none'"],
        styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
        upgradeInsecureRequests: [],
      },
    },
  })
);

app.use(compression());
app.use(morgan('combined'));

// =========================
// Rate Limit
// =========================

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  skip: (req) => req.method === 'OPTIONS',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// =========================
// CORS
// =========================

const allowedOrigins = (
  process.env.CORS_ORIGIN ||
  'https://afroflix-tv.com,https://www.afroflix-tv.com'
)
  .split(',')
  .map(origin => origin.trim());

const corsOptions = {
  origin(origin, callback) {
    // Autorise les requêtes sans Origin (curl, Postman, healthcheck...)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn(`CORS blocked origin: ${origin}`);

    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// =========================
// Body Parser
// =========================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// =========================
// Static uploads
// =========================

app.use(
  '/uploads',
  express.static(path.join(__dirname, '../uploads'), {
    maxAge: '30d',
    immutable: true,
  })
);

// =========================
// Health Check
// =========================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
  });
});

// =========================
// API Routes
// =========================

app.use('/api/auth', require('./routes/auth'));
app.use('/api/films', require('./routes/films'));
app.use('/api/actors', require('./routes/actors'));
app.use('/api/acteurs', require('./routes/actors'));
app.use('/api/articles', require('./routes/articles'));
app.use('/api/genres', require('./routes/genres'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/ratings', require('./routes/ratings'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/favoris', require('./routes/favorites'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/newsletter', require('./routes/newsletter'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/uploads', require('./routes/uploads'));

// =========================
// 404
// =========================

app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
  });
});

// =========================
// Error Handler
// =========================

app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(err.status || 500).json({
    error:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
  });
});

// =========================
// Start Server
// =========================

pool
  .query('SELECT 1')
  .then(async () => {
    await ensureDatabaseReady();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('Allowed CORS origins:', allowedOrigins);

      startEmailQueueWorker();
    });
  })
  .catch((err) => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });

module.exports = app;