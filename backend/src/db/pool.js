const { Pool } = require('pg');
require('dotenv').config();

const sharedOptions = {
  // These limits prevent a traffic spike from opening an unbounded number of
  // PostgreSQL connections. They can be tuned from the deployment environment.
  max: Number(process.env.DB_POOL_MAX || 20),
  idleTimeoutMillis: Number(process.env.DB_POOL_IDLE_TIMEOUT_MS || 30_000),
  connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT_MS || 10_000),
};

const useSsl = process.env.NODE_ENV === 'production' && process.env.DB_SSL !== 'false';

const pool = new Pool(process.env.DATABASE_URL ? {
  ...sharedOptions,
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
} : {
  ...sharedOptions,
  user: process.env.DB_USER || 'afroflix_tv',
  password: process.env.DB_PASSWORD || 'afroflix_tv123',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'afroflix_tv_db',
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

module.exports = pool;
