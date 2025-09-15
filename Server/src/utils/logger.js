const winston = require('winston');
const { pool } = require('../db');
const PostgreSQLJSONBTransport = require('./winston-postgresql-transport');

// Create Winston logger with multiple transports
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // Custom PostgreSQL JSONB transport
    new PostgreSQLJSONBTransport({
      pool: pool,
      tableName: 'user_logs',
      level: 'info'
    })
  ]
});

// Helper functions for common logging scenarios
const authLogger = {
  loginSuccess: (email, req, additionalData = {}) => {
    logger.info('User login successful', {
      email,
      event_type: 'login_success',
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      ...additionalData
    });
  },

  loginFailed: (email, req, reason = 'Invalid credentials', additionalData = {}) => {
    logger.warn('User login failed', {
      email,
      event_type: 'login_failed',
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      failure_reason: reason,
      ...additionalData
    });
  },

  logout: (email, req, additionalData = {}) => {
    logger.info('User logout', {
      email,
      event_type: 'logout',
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      ...additionalData
    });
  },

  registerSuccess: (email, req, additionalData = {}) => {
    logger.info('User registration successful', {
      email,
      event_type: 'register_success',
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      ...additionalData
    });
  },

  registerFailed: (email, req, reason = 'Registration failed', additionalData = {}) => {
    logger.warn('User registration failed', {
      email,
      event_type: 'register_failed',
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      failure_reason: reason,
      ...additionalData
    });
  },

  passwordReset: (email, req, additionalData = {}) => {
    logger.info('Password reset requested', {
      email,
      event_type: 'password_reset_request',
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      ...additionalData
    });
  },

  logEvent: (eventType, additionalData = {}) => {
    logger.info('User event', {
      event_type: eventType,
      ...additionalData
    });
  }
};

module.exports = { logger, authLogger };
