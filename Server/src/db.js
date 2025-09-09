const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

// Database connection
let pool;
if (process.env.DATABASE_URL) {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
} else {
  const config = {
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
  };
  console.log('Environment variables:', {
    PGHOST: process.env.PGHOST,
    PGPORT: process.env.PGPORT,
    PGUSER: process.env.PGUSER,
    PGPASSWORD: process.env.PGPASSWORD ? '***' : 'undefined',
    PGDATABASE: process.env.PGDATABASE,
  });
  console.log('Connecting to Postgres →', {
    user: config.user,
    host: config.host,
    port: String(config.port),
    database: config.database,
  });
  pool = new Pool(config);
}

// Create Users table if it doesn't exist
async function initializeDatabase() {
  try {
    // First, check if the table exists and what columns it has
    const tableCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
    `);
    
    console.log('Existing columns in users table:', tableCheck.rows.map(row => row.column_name));
    
    // Drop the existing table if it has the wrong schema
    if (tableCheck.rows.length > 0 && !tableCheck.rows.some(row => row.column_name === 'email')) {
      console.log('🔄 Dropping existing users table with old schema...');
      await pool.query('DROP TABLE IF EXISTS users CASCADE');
    }
    
    // Create the new table with correct schema
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Users table created/verified successfully');

    // Create OTP table for password reset functionality
    await pool.query(`
      CREATE TABLE IF NOT EXISTS otp_codes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        otp_code VARCHAR(6) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE
      );
    `);
    console.log('✅ OTP codes table created/verified successfully');

    // Create index for faster lookups
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_otp_user_id ON otp_codes(user_id);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON otp_codes(expires_at);
    `);
    console.log('✅ OTP table indexes created successfully');
  } catch (err) {
    console.error('❌ Failed to create users table:', err.message);
    throw err;
  }
}

// Initialize database on startup
initializeDatabase().catch((err) => {
  console.error('Failed to initialize database', err);
  process.exit(1);
});

module.exports = { pool };