const winston = require('winston');
const { Transport } = winston;

/**
 * Custom Winston transport that logs to PostgreSQL with JSONB storage
 */
class PostgreSQLJSONBTransport extends Transport {
  constructor(options) {
    super(options);
    this.pool = options.pool;
    this.tableName = options.tableName || 'user_logs';
    this.level = options.level || 'info';
  }

  log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    // Prepare JSONB data with all log information
    const logData = {
      level: info.level,
      message: info.message,
      timestamp: new Date().toISOString(),
      ...info // Spread all other properties (email, event_type, ip_address, etc.)
    };

    // Remove Winston-specific properties that we don't want in the database
    delete logData.level; // We'll store this separately if needed
    delete logData[Symbol.for('message')];
    delete logData[Symbol.for('splat')];

    // Insert log data as JSONB
    const query = `INSERT INTO ${this.tableName} (log_data) VALUES ($1)`;
    
    this.pool.query(query, [JSON.stringify(logData)])
      .then(() => {
        callback();
      })
      .catch((err) => {
        console.error('Failed to log to PostgreSQL:', err.message);
        // Don't fail the callback - we don't want logging errors to break the app
        callback();
      });
  }
}

module.exports = PostgreSQLJSONBTransport;
