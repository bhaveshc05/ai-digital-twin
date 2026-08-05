const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const connectionString = process.env.DATABASE_URL || 'postgresql://twin_user:twin_password@localhost:5434/twin_db';

const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

let isSchemaInitialized = false;

// Auto-migrate students table columns once on startup
const initDbSchema = async () => {
  if (isSchemaInitialized) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS students (
          student_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          full_name VARCHAR(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE students ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
      ALTER TABLE students ADD COLUMN IF NOT EXISTS board VARCHAR(100);
      ALTER TABLE students ADD COLUMN IF NOT EXISTS grade VARCHAR(50);
      ALTER TABLE students ADD COLUMN IF NOT EXISTS date_of_birth DATE;
      ALTER TABLE students ADD COLUMN IF NOT EXISTS guardian_email VARCHAR(255);
    `);
    isSchemaInitialized = true;
    console.log('✅ PostgreSQL Database schema connected & verified (twin_db)');
  } catch (err) {
    console.error('⚠️ Database schema verification notice:', err.message);
  }
};

// Run schema verification on startup
initDbSchema();

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL database error:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};