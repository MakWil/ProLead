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
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
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
        productID SERIAL PRIMARY KEY,
        idProject INTEGER,
        product_name VARCHAR(255) NOT NULL,
        product_description TEXT,
        product_priority INTEGER DEFAULT 1,
        start_date DATE,
        end_date DATE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Products table created/verified successfully');

    // Create indexes for products table
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_products_project ON products(idProject);
      CREATE INDEX IF NOT EXISTS idx_products_priority ON products(product_priority);
      CREATE INDEX IF NOT EXISTS idx_products_dates ON products(start_date, end_date);
    `);
    console.log('✅ Products table indexes created successfully');

    // Create categories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Categories table created/verified successfully');

    // Create indexes for categories table
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_categories_status ON categories(status);
    `);
    console.log('✅ Categories table indexes created successfully');

    // Create properties table for master property data
    await pool.query(`
      CREATE TABLE IF NOT EXISTS properties (
        property_id SERIAL PRIMARY KEY,
        property_name VARCHAR(255) NOT NULL UNIQUE,
        property_description TEXT,
        property_priority INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Properties table created/verified successfully');

    // Create indexes for properties table
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_properties_name ON properties(property_name);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_properties_priority ON properties(property_priority);
    `);
    console.log('✅ Properties table indexes created successfully');

  
    await pool.query(`
      CREATE TABLE product_properties (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(productID) ON DELETE CASCADE,
        property_id INTEGER NOT NULL REFERENCES properties(property_id) ON DELETE CASCADE,
        property_name VARCHAR(255) NOT NULL,
        property_value TEXT NOT NULL,
        property_description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Product_properties table created/verified successfully');

    // Create indexes for product_properties table
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_product_properties_product_id ON product_properties(product_id);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_product_properties_property_id ON product_properties(property_id);
    `);
    console.log('✅ Product_properties table indexes created successfully');

    // Add unique constraint to prevent duplicate property assignments for same product
    try {
      await pool.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_product_property') THEN
            ALTER TABLE product_properties ADD CONSTRAINT unique_product_property UNIQUE (product_id, property_id);
            RAISE NOTICE 'Unique constraint added to product_properties table';
          END IF;
        END $$;
      `);
      console.log('✅ Product_properties unique constraint completed');
    } catch (err) {
      console.error('❌ Failed to add unique constraint to product_properties:', err.message);
    }

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

    // Add updated_at column to existing user_info table if it doesn't exist
    try {
      await pool.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_info' AND column_name = 'updated_at') THEN
            ALTER TABLE user_info ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
            RAISE NOTICE 'Column updated_at added to user_info table';
          END IF;
        END $$;
      `);
      console.log('✅ Updated_at column migration completed');
    } catch (err) {
      console.error('❌ Failed to add updated_at column:', err.message);
      // Don't throw here as it's not critical for basic functionality
    }

    // Insert dummy data for testing
    try {
      // Check if products table is empty
      const productCount = await pool.query('SELECT COUNT(*) FROM products');
      if (parseInt(productCount.rows[0].count) === 0) {
        console.log('📦 Inserting dummy product data...');
        
        // Insert Alexandra Residence product
        const productResult = await pool.query(`
          INSERT INTO products (idProject, product_name, product_description, product_priority, start_date, end_date) 
          VALUES (1, 'Alexandra Residence', 'Sebuah inovasi property', 1, '2025-01-11', '2026-05-11') 
          RETURNING productID
        `);
        
        const productId = productResult.rows[0].productid;
        console.log(`✅ Inserted product with ID: ${productId}`);
      }

      // Check if properties table is empty
      const propertyCount = await pool.query('SELECT COUNT(*) FROM properties');
      if (parseInt(propertyCount.rows[0].count) === 0) {
        console.log('🏷️ Inserting dummy property data...');
        
        // Insert properties
        const properties = [
          { name: 'Luas tanah', description: 'Luas tanah properti', priority: 1 },
          { name: 'Jumlah kamar tidur', description: 'Jumlah kamar tidur', priority: 2 },
          { name: 'Jumlah kamar mandi', description: 'Jumlah kamar mandi', priority: 3 },
          { name: 'Tinggi langit-langit', description: 'Tinggi langit-langit', priority: 4 },
          { name: 'Carport', description: 'Carport mobil', priority: 5 }
        ];
        
        for (const property of properties) {
          await pool.query(`
            INSERT INTO properties (property_name, property_description, property_priority) 
            VALUES ($1, $2, $3)
          `, [property.name, property.description, property.priority]);
        }
        
        console.log('✅ Inserted 5 properties');
      }

      console.log('🎉 Dummy data insertion completed');
    } catch (err) {
      console.error('❌ Failed to insert dummy data:', err.message);
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