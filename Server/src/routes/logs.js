const express = require('express');
const { pool } = require('../db');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Get all logs (with pagination)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      'SELECT id, log_data, created_at FROM user_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    // Get total count for pagination
    const countResult = await pool.query('SELECT COUNT(*) FROM user_logs');
    const totalLogs = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalLogs / limit);

    res.json({
      logs: result.rows,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_logs: totalLogs,
        per_page: limit
      }
    });
  } catch (err) {
    console.error('Get logs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get logs for specific user by email
router.get('/user/:email', authenticateToken, async (req, res) => {
  try {
    const { email } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT id, log_data, created_at FROM user_logs 
       WHERE log_data ->> 'email' = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [email, limit, offset]
    );

    // Get total count for this user
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM user_logs WHERE log_data ->> 'email' = $1`,
      [email]
    );
    const totalLogs = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalLogs / limit);

    res.json({
      email,
      logs: result.rows,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_logs: totalLogs,
        per_page: limit
      }
    });
  } catch (err) {
    console.error('Get user logs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get logs by event type
router.get('/events/:eventType', authenticateToken, async (req, res) => {
  try {
    const { eventType } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT id, log_data, created_at FROM user_logs 
       WHERE log_data ->> 'event_type' = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [eventType, limit, offset]
    );

    res.json({
      event_type: eventType,
      logs: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('Get event logs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get login/logout statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Get event type counts
    const eventStats = await pool.query(`
      SELECT 
        log_data ->> 'event_type' as event_type,
        COUNT(*) as count
      FROM user_logs 
      WHERE log_data ->> 'event_type' IS NOT NULL
      GROUP BY log_data ->> 'event_type'
      ORDER BY count DESC
    `);

    // Get daily login counts for last 7 days
    const dailyStats = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as login_count
      FROM user_logs 
      WHERE log_data ->> 'event_type' = 'login_success'
        AND created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    // Get most active users (by login count)
    const activeUsers = await pool.query(`
      SELECT 
        log_data ->> 'email' as email,
        COUNT(*) as login_count
      FROM user_logs 
      WHERE log_data ->> 'event_type' = 'login_success'
      GROUP BY log_data ->> 'email'
      ORDER BY login_count DESC
      LIMIT 10
    `);

    res.json({
      event_statistics: eventStats.rows,
      daily_logins_last_7_days: dailyStats.rows,
      most_active_users: activeUsers.rows
    });
  } catch (err) {
    console.error('Get stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search logs by custom query
router.post('/search', authenticateToken, async (req, res) => {
  try {
    const { query, page = 1, limit = 50 } = req.body;
    const offset = (page - 1) * limit;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Search in JSONB data using containment operator
    const result = await pool.query(
      `SELECT id, log_data, created_at FROM user_logs 
       WHERE log_data @> $1::jsonb
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [JSON.stringify(query), limit, offset]
    );

    res.json({
      search_query: query,
      logs: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('Search logs error:', err);
    res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
});

module.exports = router;
