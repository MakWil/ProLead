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

// Create database tables if they don't exist
async function initializeDatabase() {
  try {
    // Create user_info table for authentication
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_info (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        profile_picture TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ User_info table created/verified successfully');

    // Create users table for customer data
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        age INTEGER,
        date_of_birth DATE,
        favorite_food VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Users table created/verified successfully');

    // Create OTP table for password reset functionality
    await pool.query(`
      CREATE TABLE IF NOT EXISTS otp_codes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES user_info(id) ON DELETE CASCADE,
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

    // Create user_logs table for Winston logging with JSONB
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_logs (
        id SERIAL PRIMARY KEY,
        log_data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ User_logs table created/verified successfully');

    // Create JSONB indexes for efficient querying
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_logs_jsonb ON user_logs USING GIN (log_data);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_logs_email ON user_logs USING BTREE ((log_data ->> 'email'));
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_logs_event_type ON user_logs USING BTREE ((log_data ->> 'event_type'));
    `);
    console.log('✅ User_logs table indexes created successfully');

    // Create products table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        category VARCHAR(100) NOT NULL,
        stock_quantity INTEGER DEFAULT 0,
        description TEXT,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Products table created/verified successfully');

    // Create indexes for products table
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
    `);
    console.log('✅ Products table indexes created successfully');

    // Add profile_picture column to existing user_info table if it doesn't exist
    try {
      await pool.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_info' AND column_name = 'profile_picture') THEN
            ALTER TABLE user_info ADD COLUMN profile_picture TEXT;
            RAISE NOTICE 'Column profile_picture added to user_info table';
          END IF;
        END $$;
      `);
      console.log('✅ Profile picture column migration completed');
    } catch (err) {
      console.error('❌ Failed to add profile_picture column:', err.message);
      // Don't throw here as it's not critical for basic functionality
    }
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