const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool(process.env.DATABASE_URL ? {
  connectionString: process.env.DATABASE_URL
} : {
  user: process.env.DB_USER || 'afroflix_tv',
  password: process.env.DB_PASSWORD || 'afroflix_tv123',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'afroflix_tv_db'
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

module.exports = pool;
