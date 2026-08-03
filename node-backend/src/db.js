const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const connectionString = process.env.DATABASE_URL || 'postgresql://twin_user:twin_password@localhost:5434/twin_db';

const pool = new Pool({
  connectionString,
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL (twin_db)');
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};