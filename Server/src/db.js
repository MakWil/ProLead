const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

// Debug: show which DB connection details are being used (without password)
let pool;
if (process.env.DATABASE_URL) {
  try {
    const parsed = new URL(process.env.DATABASE_URL);
    console.log('Connecting to Postgres →', {
      user: parsed.username,
      host: parsed.hostname,
      port: parsed.port,
      database: parsed.pathname ? parsed.pathname.slice(1) : undefined,
    });
  } catch (e) {
    console.warn('Invalid DATABASE_URL format');
  }
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
} else {
  const config = {
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
  };
  console.log('Connecting to Postgres →', {
    user: config.user,
    host: config.host,
    port: String(config.port),
    database: config.database,
  });
  pool = new Pool(config);
}

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      age INT NOT NULL,
      date_of_birth DATE NOT NULL,
      favorite_food VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

initializeDatabase().catch((err) => {
  console.error('Failed to initialize database', err);
  process.exit(1);
});

module.exports = { pool };

